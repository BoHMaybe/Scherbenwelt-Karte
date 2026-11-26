
/* ---------------- V10.95: Hauptreiter „Spielerbögen“ (Unterreiter Schiffe; später Heere, Gebäude …)
   Schiffsbögen online (Web-Atlas mit Anmeldung): jeder Spieler legt beliebig viele Schiffe an, bearbeitet und löscht sie; gespeichert
   wird im eigenen privaten Repo (boegen/schiffe.json), automatisch kurz nach Änderungen oder mit „Jetzt speichern“. Andere Spieler
   sehen die Schiffe nicht. Spielleitung (SL-Fassung bzw. Arbeitsstand mit SL-Schlüssel): Spieler wählen, ansehen, bearbeiten, löschen;
   „Online-Stand übernehmen“ legt alle Spielerschiffe im Arbeitsstand ab (atlas.online, nie in der Spielerdatei).
   Ohne Anmeldung bzw. ohne Schlüssel: Bögen wie bisher nur im Browser. Keine Wirkung auf Wirtschaft oder Karte. */
const V1095={sub:'schiffe',mode:'lokal',ziel:'lokal',sha:{},base:'',dirty:false,busy:false,fehler:'',zeit:null,timer:null,geladen:{},legacy:null,offline:false,liste:null};
const V1095_SL='BoHMaybe/scherbenwelt-sl',V1095_DATEI='boegen/schiffe.json';
const V1095_DEF=[['bernd','Bernd'],['drew','Drew'],['tink','Tink'],['slevin','Slevin'],['haraku','Haraku'],['blutaar','Blutaar'],['gast1','Gast 1'],['gast2','Gast 2']].map(([b,n])=>({benutzer:b,name:n,repo:'BoHMaybe/scherbenwelt-'+b}));
function v1095IsShip(){return typeof V1M!=='undefined'&&V1M.top==='boegen'&&V1095.sub==='schiffe'}
function v1095L(){return window.SW_LOGIN||null}
function v1095Ich(){const L=v1095L();if(!L)return null;return L.benutzer||((L.repo||'').split('/scherbenwelt-')[1])||null}
function v1095Tok(){const L=v1095L();if(L)return L.rolle==='sl'?((L.tokens||{}).sl||''):((L.tokens||{}).eigen||'');try{return localStorage.getItem('scherbenweltSLSchluessel')||''}catch(e){return ''}}
function v1095Mode(){const L=v1095L();if(L&&L.rolle==='spieler'&&(L.tokens||{}).eigen&&L.repo)return 'spieler';if(L&&L.rolle==='sl'&&(L.tokens||{}).sl)return 'sl';if(!L&&!atlas.player&&v1095Tok())return 'sl';return 'lokal'}
function v1095Wer(){const L=v1095L();return L?(L.rolle==='sl'?'Spielleitung':(L.name||v1095Ich()||'Spieler')):'Spielleitung'}
function v1095Sp(z){const L=V1095.liste||V1095_DEF;if(V1095.mode==='spieler'){const l=v1095L();return {benutzer:z,name:l.name||z,repo:l.repo}}return L.find(x=>x.benutzer===z)||{benutzer:z,name:z,repo:'BoHMaybe/scherbenwelt-'+z}}
function v1095B64e(str){const b=new TextEncoder().encode(str);let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s)}
function v1095B64d(b64){const bin=atob(String(b64||'').replace(/\s/g,''));const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new TextDecoder().decode(u)}
function v1095Api(repo,path,opt){opt=opt||{};return fetch('https://api.github.com/repos/'+repo+'/contents/'+path,{method:opt.method||'GET',cache:'no-store',body:opt.body,
 headers:Object.assign({Authorization:'Bearer '+v1095Tok(),Accept:'application/vnd.github+json'},opt.body?{'Content-Type':'application/json'}:{})})}
async function v1095Get(repo){const r=await v1095Api(repo,V1095_DATEI);if(r.status===404)return {sha:null,liste:[],zeit:null};
 if(r.status===401||r.status===403)throw new Error('kein Zugriff (Schlüssel prüfen)');if(!r.ok)throw new Error('HTTP '+r.status);
 const j=await r.json();let o={};try{o=JSON.parse(v1095B64d(j.content))}catch(e){throw new Error('Datei unlesbar')}
 return {sha:j.sha,liste:(Array.isArray(o.schiffe)?o.schiffe:[]).filter(v1086Valid),zeit:o.geaendert||null}}
async function v1095Put(repo,liste,sha,wer){const now=new Date().toISOString(),who={name:'Scherbenwelt Atlas · '+wer,email:'atlas@scherbenwelt.invalid'};
 const body={message:'Schiffsbögen · '+wer+' · '+now.slice(0,16).replace('T',' '),committer:who,author:who,
  content:v1095B64e(JSON.stringify({format:'scherbenwelt-spielerboegen',v:1,geaendert:now,von:wer,schiffe:liste},null,1))};if(sha)body.sha=sha;
 const r=await v1095Api(repo,V1095_DATEI,{method:'PUT',body:JSON.stringify(body)});
 if(r.status===409||r.status===422){const e=new Error('Konflikt');e.konflikt=1;throw e}
 if(r.status===401||r.status===403||r.status===404)throw new Error('kein Schreibrecht (Schlüssel prüfen)');if(!r.ok)throw new Error('HTTP '+r.status);
 const j=await r.json();return j&&j.content&&j.content.sha}
async function v1095SpListe(){if(V1095.liste)return V1095.liste;try{const r=await v1095Api(V1095_SL,'steuerung/spieler.json');if(r.ok){const j=await r.json();const o=JSON.parse(v1095B64d(j.content));
  if(Array.isArray(o.spieler)&&o.spieler.length){V1095.liste=o.spieler.filter(x=>x&&x.benutzer&&x.repo);return V1095.liste}}}catch(e){}V1095.liste=V1095_DEF;return V1095.liste}
function v1095Dt(x){try{return x?new Date(x).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'}):''}catch(e){return String(x||'')}}
function v1095Key(z){return V1086_LS+':'+z}
function v1095Snap(){return JSON.stringify(V1086.list)}
/* Speichern: lokal wie bisher; online als Entwurf im Browser + automatisch nach 15 s ins Repo */
v1086Save=function(){if(V1095.mode==='lokal'||V1095.ziel==='lokal'){try{localStorage.setItem(V1086_LS,JSON.stringify({list:V1086.list,cur:V1086.cur}))}catch(e){}return}
 V1095.dirty=v1095Snap()!==V1095.base;try{if(V1095.dirty)localStorage.setItem(v1095Key(V1095.ziel),JSON.stringify({list:V1086.list,cur:V1086.cur,sha:V1095.sha[V1095.ziel]||null}));else localStorage.removeItem(v1095Key(V1095.ziel))}catch(e){}
 clearTimeout(V1095.timer);V1095.timer=V1095.dirty?setTimeout(v1095Speichern,15000):null;v1095Bar()};
async function v1095Speichern(){clearTimeout(V1095.timer);V1095.timer=null;if(!V1095.dirty||V1095.ziel==='lokal')return;if(V1095.busy){V1095.timer=setTimeout(v1095Speichern,3000);return}
 const z=V1095.ziel,sp=v1095Sp(z),liste=JSON.parse(JSON.stringify(V1086.list)),snap=v1095Snap();V1095.busy=true;V1095.fehler='';v1095Bar();
 try{let sha;try{sha=await v1095Put(sp.repo,liste,V1095.sha[z],v1095Wer())}catch(e){if(!e.konflikt)throw e;const g=await v1095Get(sp.repo);sha=await v1095Put(sp.repo,liste,g.sha,v1095Wer())}
  V1095.sha[z]=sha;if(V1095.ziel===z){V1095.base=snap;V1095.dirty=v1095Snap()!==snap;V1095.zeit=new Date().toISOString();V1095.offline=false;try{if(!V1095.dirty)localStorage.removeItem(v1095Key(z))}catch(e){}}}
 catch(e){V1095.fehler='Nicht gespeichert: '+e.message+' – neuer Versuch in 1 Minute.';V1095.busy=false;v1095Bar();V1095.timer=setTimeout(v1095Speichern,60000);return}
 V1095.busy=false;if(V1095.dirty)V1095.timer=setTimeout(v1095Speichern,15000);v1095Bar()}
async function v1095Laden(z){if(V1095.dirty&&V1095.ziel!=='lokal')await v1095Speichern();
 clearTimeout(V1095.timer);V1095.timer=null;V1095.ziel=z;V1095.dirty=false;V1095.fehler='';V1095.zeit=null;V1095.legacy=null;V1095.offline=false;V1095.geladen[z]=1;
 if(z==='lokal'){V1086.list=[];V1086.cur=null;v1086Load();V1095.base=v1095Snap();v911Render();return}
 V1086.list=[];V1086.cur=null;V1095.busy=true;v911Render();const sp=v1095Sp(z);let g=null;
 try{g=await v1095Get(sp.repo);V1095.sha[z]=g.sha;V1086.list=g.liste;V1095.zeit=g.zeit}
 catch(e){const sn=atlas.online&&atlas.online.schiffe&&atlas.online.schiffe[z];V1086.list=sn?JSON.parse(JSON.stringify(sn.liste||[])):[];V1095.offline=true;
  V1095.fehler='Online nicht erreichbar ('+e.message+')'+(sn?' – angezeigt: Stand im Arbeitsstand vom '+v1095Dt(sn.abgerufen):'')+'.'}
 for(const x of V1086.list){try{const v=v1086Calc(x);if(v)v1086Lauf(x,v)}catch(e){}}
 V1095.base=v1095Snap();
 try{const d=JSON.parse(localStorage.getItem(v1095Key(z))||'null');if(d&&Array.isArray(d.list)){if(!V1095.offline&&(d.sha||null)===(V1095.sha[z]||null)){V1086.list=d.list.filter(v1086Valid);V1086.cur=d.cur||null;V1095.dirty=v1095Snap()!==V1095.base;
   if(V1095.dirty){V1095.fehler='Ungespeicherte Änderungen aus der letzten Sitzung wiederhergestellt.';V1095.timer=setTimeout(v1095Speichern,15000)}}else if(!V1095.offline)localStorage.removeItem(v1095Key(z))}}catch(e){}
 if(V1095.mode==='spieler'&&g&&!g.sha&&!V1086.list.length){try{const o=JSON.parse(localStorage.getItem(V1086_LS)||'{}');if(o&&Array.isArray(o.list)){const L=o.list.filter(v1086Valid);if(L.length)V1095.legacy=L}}catch(e){}}
 if(!V1086.list.find(x=>x.id===V1086.cur))V1086.cur=V1086.list[0]?V1086.list[0].id:null;V1095.busy=false;v911Render()}
async function v1095Import(){if(V1095.busy)return;const L=await v1095SpListe();let n=0,m=0;const bad=[],out={},now=new Date().toISOString();V1095.busy=true;v1095Bar('Hole die Schiffe aller Spieler …');
 for(const sp of L){try{const g=await v1095Get(sp.repo);out[sp.benutzer]={name:sp.name,abgerufen:now,geaendert:g.zeit,sha:g.sha,liste:g.liste};n+=g.liste.length;m++}catch(e){bad.push(sp.name)}}
 atlas.online=atlas.online||{};atlas.online.schiffe=Object.assign(atlas.online.schiffe||{},out);atlas.online.abgerufen=now;V1095.busy=false;
 status('Online-Stand übernommen: '+n+' Schiffe von '+m+' Spielern'+(bad.length?' · nicht erreichbar: '+bad.join(', '):'')+'. Dauerhaft mit „Arbeitsstand speichern“.',!!bad.length);v911Render()}
function v1095Tabs(){return '<div class="v911-modes v914sub v1095sub"><button data-v1095sub="schiffe" class="'+(V1095.sub==='schiffe'?'on':'')+'">Schiffe</button></div>'}
function v1095Note(){if(V1095.mode==='spieler')return 'Deine Schiffe: beliebig viele anlegen, bearbeiten und löschen. Gespeichert wird online in deinem privaten Speicher – automatisch kurz nach jeder Änderung oder sofort mit „Jetzt speichern“. Andere Spieler sehen deine Schiffe nicht, die Spielleitung schon.';
 if(V1095.mode==='sl')return 'Schiffe der Spieler: oben den Spieler wählen; ansehen, bearbeiten, anlegen und löschen wird im Speicher des Spielers gesichert. „Eigene Bögen“ liegen nur in diesem Browser. „Online-Stand übernehmen“ legt alle Spielerschiffe im Arbeitsstand ab (dauerhaft mit „Arbeitsstand speichern“; nie in der Spielerdatei).';
 return 'Schiffsbogen für den Schiffskampf: Typ und Größe wählen, Geschütze je Platz und Module je Kategorie eintragen. Werte mit Modulboni werden berechnet. Die Bögen liegen in diesem Browser; über Export und Import lassen sie sich als Datei weitergeben.'+(atlas.player?'':' Mit SL-Schlüssel erscheinen hier die Schiffe der Spieler.')}
function v1095Ctl(){let h='';if(V1095.mode==='sl'){const L=V1095.liste||V1095_DEF;const on=atlas.online&&atlas.online.schiffe;
  h+='<div class="v1086bar v1095ctl"><label>Bögen von <select id="v1095Ziel"><option value="lokal"'+(V1095.ziel==='lokal'?' selected':'')+'>Eigene Bögen (nur dieser Browser)</option>'
   +L.map(x=>{const k=on&&on[x.benutzer];return '<option value="'+esc(x.benutzer)+'"'+(V1095.ziel===x.benutzer?' selected':'')+'>'+esc(x.name)+(k?' · '+k.liste.length+' im Arbeitsstand':'')+'</option>'}).join('')+'</select></label>'
   +'<button type="button" data-v1095a="import" title="Schiffe aller Spieler abrufen und im Arbeitsstand ablegen">Online-Stand übernehmen</button>'
   +(atlas.online&&atlas.online.abgerufen?'<span class="v911-note">Arbeitsstand: Stand vom '+esc(v1095Dt(atlas.online.abgerufen))+'</span>':'')+'</div>'}
 else if(V1095.mode==='lokal'&&!atlas.player&&typeof v1094Ask==='function')h+='<div class="v1086bar v1095ctl"><button type="button" data-v1095a="key">SL-Schlüssel eingeben</button></div>';
 if(V1095.legacy&&V1095.legacy.length)h+='<div class="v1086bar v1095ctl"><button type="button" data-v1095a="legacy">'+V1095.legacy.length+' Bogen/Bögen aus diesem Browser übernehmen</button><span class="v911-note">Diese Bögen hattest du vor der Anmeldung im Browser angelegt.</span></div>';
 return h}
function v1095StHtml(t){if(V1095.mode==='lokal'||V1095.ziel==='lokal')return '';const busy=t||(V1095.busy?'Speichere …':'');
 const txt=busy||(V1095.fehler?V1095.fehler:V1095.dirty?'Ungespeicherte Änderungen – werden in Kürze gespeichert.':V1095.zeit?'Gespeichert · '+v1095Dt(V1095.zeit):'Online-Speicher bereit.');
 return '<span class="v1095t'+(V1095.fehler&&!busy?' err':V1095.dirty?' dirty':'')+'">'+esc(txt)+'</span><button type="button" data-v1095a="save"'+(V1095.dirty&&!V1095.busy?'':' disabled')+'>Jetzt speichern</button>'}
function v1095Bar(t){const e=$('v1095St');if(e)e.innerHTML=v1095StHtml(t)}
v1086Render=function(el){const S=v1086Sys();if(!S){el.innerHTML=v1095Tabs()+'<p>Keine Schiffsdaten vorhanden.</p>';return}
 if(V1095.mode!=='lokal'&&V1095.ziel!=='lokal'&&!V1095.geladen[V1095.ziel]&&!V1095.busy){v1095Laden(V1095.ziel);return}
 const s=v1086Cur(),dis=V1095.busy?' disabled':'';
 let h=v1095Tabs()+'<p class="v911-note">'+v1095Note()+'</p>'+v1095Ctl();
 if(V1095.busy&&!V1086.list.length){el.innerHTML=h+'<p>Schiffsbögen werden geladen …</p>';return}
 h+='<div class="v1086bar"><select id="v1086Sel"'+dis+'>'+(V1086.list.length?V1086.list.map(x=>'<option value="'+x.id+'"'+(s&&x.id===s.id?' selected':'')+'>'+esc(x.name||'Ohne Namen')+' · '+esc((v1086Ship(x.typ)||{}).n||x.typ)+'</option>').join(''):'<option value="">– kein Schiff –</option>')+'</select>'
  +'<button type="button" data-v1086a="new"'+dis+'>Neues Schiff</button><button type="button" data-v1086a="copy"'+(s?dis:' disabled')+'>Kopie</button><button type="button" data-v1086a="del"'+(s?dis:' disabled')+'>Löschen</button>'
  +'<button type="button" data-v1086a="exp"'+(s?'':' disabled')+'>Export</button><button type="button" data-v1086a="imp"'+dis+'>Import</button><input type="file" id="v1086File" accept=".json,application/json" multiple hidden><button type="button" data-v1086a="print"'+(s?'':' disabled')+'>Drucken</button></div>'
  +'<div class="v1086bar v1095st" id="v1095St">'+v1095StHtml()+'</div>';
 h+=s?v1086Html(s,false):'<p>Noch kein Schiff angelegt. „Neues Schiff“ legt eines an.</p>';el.innerHTML=h};
{const _r=v911Render;v911Render=function(){const el=$('tablesBody');if(el&&V1M.top==='boegen'){if(V1095.sub==='schiffe')v1086Render(el);return}return _r.apply(this,arguments)}}
{const _s=v911Show;v911Show=function(){_s.apply(this,arguments);const b=V1M.top==='boegen';if($('tabTables'))$('tabTables').setAttribute('aria-selected',String(V1M.top==='eco'));if($('tabSheets'))$('tabSheets').setAttribute('aria-selected',String(b));const h=document.querySelector('#tablesView h2');if(h&&V1M.top!=='journal')h.textContent=b?'Spielerbögen':'Tabellen'}}
{const _h=v911Hide;v911Hide=function(){_h.apply(this,arguments);if($('tabSheets'))$('tabSheets').setAttribute('aria-selected','false')}}
function v1095Init(){const t=$('tabTables');if(!t||$('tabSheets'))return;const b=document.createElement('button');b.setAttribute('role','tab');b.id='tabSheets';b.setAttribute('aria-selected','false');
 b.title='Spielerbögen: Schiffe (weitere Bögen folgen)';b.textContent='Spielerbögen';t.after(b);b.onclick=()=>{V1M.top='boegen';v911Show()};
 if(typeof V911!=='undefined'&&V911.tab==='ship'){V911.tab=atlas.player?'cover':'gain';try{v911Save()}catch(e){}}
 V1095.mode=v1095Mode();if(V1095.mode==='spieler')V1095.ziel=v1095Ich()||'ich';
 else if(V1095.mode==='sl'){let z='lokal';try{z=localStorage.getItem('scherbenweltBogenZiel')||'lokal'}catch(e){}V1095.ziel=z;v1095SpListe().then(()=>{if(v1095IsShip())v911Render()})}
 const root=$('tablesView');if(!root)return;
 root.addEventListener('click',e=>{const x=e.target.closest&&e.target.closest('[data-v1095a],[data-v1095sub]');if(!x||V1M.top!=='boegen')return;e.preventDefault();
  if(x.dataset.v1095sub){V1095.sub=x.dataset.v1095sub;v911Render();return}const a=x.dataset.v1095a;
  if(a==='save')v1095Speichern();else if(a==='import')v1095Import();else if(a==='key'){v1094Ask();const w=()=>{if(v1095Tok()&&!document.getElementById('v1094ask')){V1095.mode=v1095Mode();v911Render()}else if(document.getElementById('v1094ask'))setTimeout(w,500)};setTimeout(w,500)}
  else if(a==='legacy'&&V1095.legacy){for(const s of V1095.legacy){const n=JSON.parse(JSON.stringify(s));n.id='sb'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);V1086.list.push(n);V1086.cur=n.id}V1095.legacy=null;v1086Save();v911Render()}});
 root.addEventListener('change',e=>{if(e.target.id!=='v1095Ziel')return;const z=e.target.value;try{localStorage.setItem('scherbenweltBogenZiel',z)}catch(x){}v1095Laden(z)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&V1095.dirty)v1095Speichern()});
 addEventListener('beforeunload',e=>{if(V1095.dirty&&V1095.ziel!=='lokal'){v1095Speichern();e.preventDefault();e.returnValue=''}});
 try{document.head.insertAdjacentHTML('beforeend','<style id="v1095css">.v1095st{min-height:30px}.v1095t{font-size:13px;color:#3d6b2f}.v1095t.dirty{color:#8a6a22}.v1095t.err{color:#a33}.v1095ctl label{font-size:13px}.v1095ctl select{margin-left:4px;max-width:100%}</style>')}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v1095Init);else v1095Init();
