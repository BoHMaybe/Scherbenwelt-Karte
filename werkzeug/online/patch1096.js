
/* ---------------- V10.96: Online-Abgleich (automatisch)
   SL-Fassung im Web-Atlas: jede inhaltliche Änderung am Atlas (Heere, Freischaltungen, Schwärzungen, Labels, Quests, Journal, POIs …)
   wird erkannt, ca. 10 s später als Änderungsliste im privaten Repo gespeichert (online/aenderungen.json) und ca. 2 Minuten nach der
   letzten Änderung automatisch veröffentlicht (online/veroeffentlichen.json → GitHub-Ablauf baut die Spielerfassung neu).
   Schalter „Veröffentlichung pausieren“: es wird weiter gespeichert, aber nichts an die Spieler gegeben.
   Lokal geöffneter Arbeitsstand mit SL-Schlüssel: offene Online-Änderungen werden beim Öffnen automatisch übernommen, wenn die Datei
   genau der veröffentlichte Stand ist (sonst übernimmt Claude sie beim nächsten Hochladen; bei Widerspruch gewinnt der Arbeitsstand).
   Ansichtseinstellungen (Filter, Zoom …) sind keine Inhalte und werden nicht übertragen. */
const V1096={an:false,base:{},pend:[],sTimer:null,cTimer:null,pTimer:null,stTimer:null,busy:false,seq:0,basis:null,dirty0:null,
 gespeichert:null,angestossen:0,veroeff:0,veroeffZeit:null,fehler:'',pause:false,meldung:''};
const V1096_REPO='BoHMaybe/scherbenwelt-sl',V1096_PAUSE='swOnlinePause';
function v1096L(){return window.SW_LOGIN||null}
function v1096Tok(){const L=v1096L();if(L)return L.rolle==='sl'?((L.tokens||{}).sl||''):'';try{return localStorage.getItem('scherbenweltSLSchluessel')||''}catch(e){return ''}}
function v1096B64e(str){const b=new TextEncoder().encode(str);let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s)}
function v1096B64d(b64){const bin=atob(String(b64||'').replace(/\s/g,''));const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new TextDecoder().decode(u)}
async function v1096Get(path){const r=await fetch('https://api.github.com/repos/'+V1096_REPO+'/contents/'+path,{cache:'no-store',headers:{Authorization:'Bearer '+v1096Tok(),Accept:'application/vnd.github+json'}});
 if(r.status===404)return {sha:null,obj:null};if(r.status===401||r.status===403)throw new Error('kein Zugriff (SL-Schlüssel prüfen)');if(!r.ok)throw new Error('HTTP '+r.status);
 const j=await r.json();let txt=j.content?v1096B64d(j.content):'';
 if(!txt&&j.size>0){const r2=await fetch('https://api.github.com/repos/'+V1096_REPO+'/contents/'+path,{cache:'no-store',headers:{Authorization:'Bearer '+v1096Tok(),Accept:'application/vnd.github.raw+json'}});txt=await r2.text()}
 return {sha:j.sha,obj:txt?JSON.parse(txt):null}}
async function v1096Put(path,obj,sha,msg){const who={name:'Scherbenwelt Atlas · Spielleitung',email:'atlas@scherbenwelt.invalid'};
 const body={message:msg,committer:who,author:who,content:v1096B64e(JSON.stringify(obj))};if(sha)body.sha=sha;
 const r=await fetch('https://api.github.com/repos/'+V1096_REPO+'/contents/'+path,{method:'PUT',cache:'no-store',headers:{Authorization:'Bearer '+v1096Tok(),Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify(body)});
 if(r.status===409||r.status===422){const e=new Error('Konflikt');e.konflikt=1;throw e}if(r.status===401||r.status===403||r.status===404)throw new Error('kein Schreibrecht (SL-Schlüssel prüfen)');if(!r.ok)throw new Error('HTTP '+r.status);
 const j=await r.json();return j&&j.content&&j.content.sha}
function v1096Zeit(x){try{return new Date(x).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}catch(e){return ''}}
/* ---- Erfassung (nur SL-Fassung im Web) */
function v1096Snap(){V1096.base={};for(const k of Object.keys(atlas))V1096.base[k]=JSON.stringify(atlas[k])}
function v1096Check(){clearTimeout(V1096.cTimer);V1096.cTimer=null;if(!V1096.an)return;const ops=[],B=V1096.base;
 for(const k of new Set([...Object.keys(B),...Object.keys(atlas)])){const s=Object.prototype.hasOwnProperty.call(atlas,k)?JSON.stringify(atlas[k]):undefined;if(s===B[k])continue;
  if(s===undefined){ops.push({p:[k],d:1});delete B[k];continue}if(B[k]===undefined){ops.push({p:[k],v:JSON.parse(s)});B[k]=s;continue}
  swOpsDiff(JSON.parse(B[k]),JSON.parse(s),[k],ops);B[k]=s}
 if(!ops.length)return;V1096.pend=swOpsMerge(V1096.pend,ops);try{localStorage.setItem('swOnlinePend',JSON.stringify({basis:V1096.basis,ops:V1096.pend}))}catch(e){}
 clearTimeout(V1096.sTimer);V1096.sTimer=setTimeout(v1096Save,10000);clearTimeout(V1096.pTimer);V1096.pTimer=null;v1096Ui()}
function v1096Soon(ms){if(!V1096.an)return;clearTimeout(V1096.cTimer);V1096.cTimer=setTimeout(v1096Check,ms||2500)}
async function v1096Save(){clearTimeout(V1096.sTimer);V1096.sTimer=null;if(!V1096.pend.length)return;if(V1096.busy){V1096.sTimer=setTimeout(v1096Save,3000);return}
 V1096.busy=true;V1096.fehler='';v1096Ui();const pend=V1096.pend.slice();
 try{for(let v=0;;v++){const g=await v1096Get('online/aenderungen.json');const f=g.obj||{basis:V1096.basis,seq:0,ops:[]};
   if(f.basis&&f.basis!==V1096.basis){V1096.fehler='Inzwischen wurde eine neue Atlas-Fassung hochgeladen. Bitte neu laden; die letzten Änderungen sind im Browser gesichert.';throw new Error('basis')}
   let seq=f.seq||0;const neu=pend.map(o=>Object.assign({},o,{n:++seq}));
   try{await v1096Put('online/aenderungen.json',{basis:V1096.basis,seq:seq,zeit:new Date().toISOString(),ops:swOpsMerge(f.ops||[],neu)},g.sha,'Online-Änderungen · '+neu.length+' · bis '+seq);V1096.seq=seq;break}
   catch(e){if(!e.konflikt||v>=2)throw e}}
  V1096.pend=V1096.pend.slice(pend.length);V1096.gespeichert=new Date().toISOString();
  try{if(!V1096.pend.length)localStorage.removeItem('swOnlinePend')}catch(e){}
  v1096PlanPub()}
 catch(e){if(e.message!=='basis'){V1096.fehler='Online nicht gespeichert: '+e.message+' – neuer Versuch in 1 Minute.';V1096.sTimer=setTimeout(v1096Save,60000)}}
 V1096.busy=false;if(V1096.pend.length&&!V1096.sTimer)V1096.sTimer=setTimeout(v1096Save,10000);v1096Ui()}
function v1096PlanPub(){clearTimeout(V1096.pTimer);V1096.pTimer=null;if(V1096.pause||V1096.seq<=Math.max(V1096.angestossen,V1096.veroeff))return;V1096.pTimer=setTimeout(v1096Pub,120000)}
async function v1096Pub(){clearTimeout(V1096.pTimer);V1096.pTimer=null;if(V1096.pause||V1096.pend.length||V1096.busy){if(!V1096.pause)V1096.pTimer=setTimeout(v1096Pub,20000);return}
 if(V1096.seq<=Math.max(V1096.angestossen,V1096.veroeff))return;const seq=V1096.seq;V1096.busy=true;
 try{for(let v=0;;v++){const g=await v1096Get('online/veroeffentlichen.json');try{await v1096Put('online/veroeffentlichen.json',{seq:seq,basis:V1096.basis,zeit:new Date().toISOString()},g.sha,'Veröffentlichen bis '+seq);break}catch(e){if(!e.konflikt||v>=2)throw e}}
  V1096.angestossen=seq;V1096.fehler='';v1096StatusPoll(30000)}
 catch(e){V1096.fehler='Veröffentlichung nicht angestoßen: '+e.message;V1096.pTimer=setTimeout(v1096Pub,60000)}
 V1096.busy=false;v1096Ui()}
async function v1096Status(){try{const g=await v1096Get('online/status.json');const s=g.obj;if(s&&s.basis===V1096.basis){if((s.verarbeitet||0)>V1096.veroeff||s.ok===false){V1096.veroeff=s.verarbeitet||0;V1096.veroeffZeit=s.zeit||null;V1096.meldung=s.ok===false?(s.meldung||'Fehler'):''}}}catch(e){}v1096Ui()}
function v1096StatusPoll(ms){clearTimeout(V1096.stTimer);V1096.stTimer=setTimeout(async()=>{await v1096Status();if(V1096.angestossen>V1096.veroeff&&!V1096.meldung)v1096StatusPoll(30000)},ms)}
function v1096Text(){if(V1096.fehler)return {t:V1096.fehler,c:'err'};if(V1096.meldung)return {t:'Veröffentlichung fehlgeschlagen: '+V1096.meldung,c:'err'};
 if(V1096.busy)return {t:'Speichere online …',c:''};if(V1096.pend.length||V1096.sTimer||V1096.cTimer)return {t:'Änderungen werden gleich online gespeichert …',c:'dirty'};
 if(V1096.pause&&V1096.seq>V1096.veroeff)return {t:'Online gespeichert'+(V1096.gespeichert?' '+v1096Zeit(V1096.gespeichert):'')+' · Veröffentlichung pausiert',c:'dirty'};
 if(V1096.angestossen>V1096.veroeff)return {t:'Online gespeichert · Veröffentlichung läuft (einige Minuten) …',c:'dirty'};
 if(V1096.pTimer)return {t:'Online gespeichert '+v1096Zeit(V1096.gespeichert)+' · wird in Kürze veröffentlicht',c:''};
 if(V1096.veroeff&&V1096.veroeff>=V1096.seq)return {t:'Für Spieler sichtbar seit '+v1096Zeit(V1096.veroeffZeit),c:'ok'};
 return {t:'Online-Abgleich aktiv',c:'ok'}}
function v1096Ui(){if(!V1096.an)return;let d=document.getElementById('v1096bar');
 if(!d){d=document.createElement('div');d.id='v1096bar';d.innerHTML='<span id="v1096t"></span><label title="Gespeichert wird weiter; an die Spieler geht erst nach dem Lösen etwas."><input type="checkbox" id="v1096p"> Veröffentlichung pausieren</label>';document.body.appendChild(d);
  const p=d.querySelector('#v1096p');p.checked=V1096.pause;p.onchange=()=>{V1096.pause=p.checked;try{localStorage.setItem(V1096_PAUSE,V1096.pause?'1':'0')}catch(e){}if(V1096.pause){clearTimeout(V1096.pTimer);V1096.pTimer=null}else if(V1096.seq>V1096.angestossen)v1096Pub();v1096Ui()}}
 const x=v1096Text(),t=d.querySelector('#v1096t');t.textContent=x.t;t.className=x.c}
function v1096Start(){const L=v1096L();if(!L||L.rolle!=='sl'||atlas.player||!v1096Tok())return;const O=window.SW_OPS||{};
 V1096.an=true;V1096.basis=L.basis||O.basis||null;V1096.seq=O.seq||0;try{V1096.pause=localStorage.getItem(V1096_PAUSE)==='1'}catch(e){}
 try{document.head.insertAdjacentHTML('beforeend','<style id="v1096css">#v1096bar{position:fixed;left:50%;bottom:8px;transform:translateX(-50%);z-index:8999;display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:calc(100vw - 260px);font:12px system-ui,sans-serif;background:#1f1b16;color:#f6e7c4;border:1px solid #6b5a3a;border-radius:6px;padding:4px 10px;opacity:.92}#v1096bar label{display:flex;gap:4px;align-items:center;cursor:pointer;white-space:nowrap}#v1096t.ok{color:#9fd38a}#v1096t.dirty{color:#e8c56a}#v1096t.err{color:#ff9a8a}@media(max-width:700px){#v1096bar{left:8px;right:8px;transform:none;max-width:none;bottom:40px}}</style>')}catch(e){}
 if(window.SW_OPS_ERR)V1096.fehler='Online-Änderungen konnten nicht vollständig angewendet werden: '+window.SW_OPS_ERR;
 setTimeout(()=>{v1096Snap();V1096.dirty0=typeof v7Dirty!=='undefined'?v7Dirty:0;
  for(const ev of ['pointerup','change','keyup','drop','dragend'])document.addEventListener(ev,()=>v1096Soon(2500),true);
  setInterval(()=>{try{if(typeof v7Dirty!=='undefined'&&v7Dirty!==V1096.dirty0){V1096.dirty0=v7Dirty;v1096Soon(1500)}}catch(e){}},2500);
  try{const _s=status;status=function(){const r=_s.apply(this,arguments);v1096Soon(2500);return r}}catch(e){}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(V1096.cTimer)v1096Check();if(V1096.pend.length)v1096Save()}else if(V1096.angestossen>V1096.veroeff)v1096Status()});
  addEventListener('beforeunload',e=>{if(V1096.cTimer)v1096Check();if(V1096.pend.length){v1096Save();e.preventDefault();e.returnValue=''}});
  v1096Status().then(()=>{if(V1096.veroeff<V1096.seq&&!V1096.meldung)v1096PlanPub();else if(V1096.veroeff>=V1096.seq)V1096.angestossen=V1096.seq;v1096Ui()});v1096Ui()},3000)}
/* ---- Übernahme in den lokal geöffneten Arbeitsstand */
async function v1096Lokal(){if(v1096L()||atlas.player||!v1096Tok()||location.protocol!=='file:')return;
 if(window.SW_IMPORT_DONE){status(window.SW_IMPORT_DONE+' Online-Änderungen übernommen. Dauerhaft mit „Arbeitsstand speichern“.');return}
 let g;try{g=await v1096Get('online/aenderungen.json')}catch(e){return}const f=g.obj;if(!f||!Array.isArray(f.ops)||!f.ops.length)return;
 const imp=atlas.onlineImport;if(imp&&imp.basis===f.basis&&(imp.seq||0)>=(f.seq||0))return;
 const el=document.getElementById('atlas-data');if(!el)return;const txt=el.textContent;
 let h='';try{const d=await crypto.subtle.digest('SHA-1',new TextEncoder().encode(txt));h=[...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,12)}catch(e){return}
 if(h!==f.basis){status(f.ops.length+' Online-Änderungen liegen vor, gehören aber zu einer anderen Fassung als diese Datei. Claude übernimmt sie beim nächsten Hochladen (bei Widerspruch gewinnt der Arbeitsstand).');return}
 try{sessionStorage.setItem('swImportOps',JSON.stringify({len:txt.length,basis:f.basis,seq:f.seq||0,ops:f.ops}))}catch(e){status('Online-Änderungen: Übernahme nicht möglich (Browserspeicher).',true);return}
 status('Übernehme '+f.ops.length+' Online-Änderungen …');setTimeout(()=>location.reload(),300)}
{const go=()=>{try{v1096Start()}catch(e){}setTimeout(()=>{try{v1096Lokal()}catch(e){}},4000)};if(document.readyState==='complete')setTimeout(go,0);else addEventListener('load',go)}
