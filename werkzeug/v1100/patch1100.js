/* ================================================================ V11.00 · Stufe 6: Würfel, Würfelprotokoll, Würfelstil, Flüstern (SL ↔ Spieler)
   Ablage (GitHub, Contents-API):
   - offene Würfe:      scherbenwelt-tisch/wuerfe/<benutzer>.json   (alle am Tisch lesen; je Benutzer eine Datei, kein Schreibkonflikt)
   - Würfelstil:        scherbenwelt-tisch/stil/<benutzer>.json
   - verdeckte Würfe:   <Spieler-Repo>/wuerfe/verdeckt.json (Spieler + SL) · SL: scherbenwelt-sl/tisch/sl-verdeckt.json (nur SL-Fassung)
   - Flüstern:          <Spieler-Repo>/fluestern/spieler.json (schreibt der Spieler) und fluestern/sl.json (schreibt die SL); Nachrichten > 90 Tage werden entfernt
   Abfrage im Takt des Zeitplans (scherbenwelt-sl/steuerung/zeitplan.json), zusätzlich beim Öffnen der Fenster. Ändert keine Atlasdaten. */
const V1100={mode:'lokal',ich:'',name:'',t0:Date.now(),log:[],ids:new Set(),stil:{},sha:{},q:{},busy:{},timer:null,last:0,poll:false,fehler:'',
 chat:{},chatSel:null,unread:0,panel:null,tab:'wuerfeln',vis:'offen',form:{n:1,s:20,b:0,l:'',m:'n',f:''},fontOk:{}};
const V1100_TISCH='BoHMaybe/scherbenwelt-tisch',V1100_SL='BoHMaybe/scherbenwelt-sl',V1100_TAGE=90,V1100_MAX=300,V1100_ARTEN=[4,6,8,10,12,20,100];
const V1100_FONTS={cinzel:['Cinzel','SWCinzel','medien/fonts/cinzel-latin-700-normal.woff2'],uncial:['Uncial Antiqua','SWUncial','medien/fonts/uncial-antiqua-latin-400-normal.woff2'],
 fraktur:['Fraktur','SWFraktur','medien/fonts/unifrakturmaguntia-latin-400-normal.woff2'],serif:['Serif','Georgia, "Times New Roman", serif',null],sans:['Sans','system-ui, -apple-system, sans-serif',null],mono:['Mono','ui-monospace, Menlo, Consolas, monospace',null]};
const V1100_STD={farbe:'#7a1f1f',schrift:'#f6e7c4',font:'cinzel',bild:'',deck:0.35,anim:true};
function swE(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])}
function swLS(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v))}catch(e){return null}}
/* ---------------- Formeln und Wurf */
function swParse(str){const s=String(str||'').replace(/\s+/g,'').replace(/[−–]/g,'-').replace(/d/gi,'W').toUpperCase();if(!s)return null;
 const re=/([+-]?)(\d*)W(\d+)|([+-]?)(\d+)/gy;let m,pos=0;const T=[];let b=0;
 while(pos<s.length){re.lastIndex=pos;m=re.exec(s);if(!m||m.index!==pos)return null;pos=re.lastIndex;
  if(m[3]){const n=m[2]===''?1:+m[2],sd=+m[3];if(!(n>=1&&n<=100)||!(sd>=2&&sd<=1000))return null;T.push({n,s:sd,neg:m[1]==='-'})}else{b+=(m[4]==='-'?-1:1)*(+m[5])}}
 if(!T.length)return null;return {T,b}}
function swFmt(p){let s='';p.T.forEach((t,i)=>{s+=(t.neg?'-':(i?'+':''))+t.n+'W'+t.s});if(p.b)s+=(p.b>0?'+':'-')+Math.abs(p.b);return s}
function swRnd(s){const a=new Uint32Array(1),lim=Math.floor(4294967296/s)*s;for(;;){crypto.getRandomValues(a);if(a[0]<lim)return a[0]%s+1}}
/* o: {f, l, k:'offen'|'verdeckt', m:'n'|'v'|'d', krit, ziel, wo} */
function swWuerfeln(o){const p=swParse(o.f);if(!p)throw new Error('Ungültige Würfelangabe: '+o.f);
 const w20=p.T.length===1&&p.T[0].n===1&&p.T[0].s===20&&!p.T[0].neg,m=w20?(o.m||'n'):'n';const D=[];let e=p.b,nat=null;
 for(const t of p.T){if(w20&&m!=='n'){const a=swRnd(20),b=swRnd(20),k=m==='v'?Math.max(a,b):Math.min(a,b);D.push({s:20,r:[a,b],k});e+=k;nat=k}
  else{const r=[];for(let i=0;i<t.n;i++)r.push(swRnd(t.s));const sum=r.reduce((x,y)=>x+y,0);D.push({s:t.s,r,neg:t.neg});e+=t.neg?-sum:sum;if(w20)nat=r[0]}}
 const R={id:(V1100.ich||'x')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),t:Date.now(),ben:V1100.ich||'lokal',name:V1100.name||'',l:String(o.l||'Freier Wurf').slice(0,120),
  f:swFmt(p),b:p.b,m,d:D,e,k:o.k==='verdeckt'?'verdeckt':'offen'};
 if(nat!=null){R.nat=nat;if(nat>=(o.krit||20))R.krit=1;if(nat===1)R.patzer=1}if(o.ziel)R.ziel=o.ziel;return R}
function swZus(R){const parts=R.d.map(d=>{if(d.k!=null)return 'W20 '+(R.m==='v'?'Vorteil':'Nachteil')+': '+d.r.join(' | ')+' → '+d.k;return (d.neg?'−':'')+d.r.length+'W'+d.s+': '+d.r.join(' + ')+(d.r.length>1?' = '+d.r.reduce((a,b)=>a+b,0):'')});
 if(R.b)parts.push((R.b>0?'+':'−')+Math.abs(R.b));const eins=parts.length===1;
 return {f:R.f+(R.m==='v'?' (Vorteil)':R.m==='d'?' (Nachteil)':''),z:eins?parts[0]:parts.join(' · ')+' = '+R.e,x:(R.krit?'Kritisch (natürliche '+R.nat+')':R.patzer?'Natürliche 1':'')+(R.ziel?(R.krit||R.patzer?' · ':'')+'Ziel '+R.ziel+': '+(R.e>=R.ziel?'geschafft':'verfehlt'):'')}}
/* ---------------- Modus, Tokens, Ablage */
function swInit(){V1100.mode=typeof v1095Mode==='function'?v1095Mode():'lokal';if(atlas.player&&V1100.mode!=='spieler')V1100.mode='lokal';
 V1100.ich=V1100.mode==='sl'?'sl':V1100.mode==='spieler'?(v1095Ich()||''):'lokal';V1100.name=V1100.mode==='sl'?'Spielleitung':V1100.mode==='spieler'?v1095Wer():'Lokal';
 const v=swLS('swWVis');if(v==='offen'||v==='verdeckt')V1100.vis=v}
function swTok(){return V1100.mode==='sl'?v1097TokSL():V1100.mode==='spieler'?v1097TokRepo():''}
function swOwnRepo(){const L=v1095L();return L&&L.repo||''}
function swListe(){return (typeof V1095!=='undefined'&&V1095.liste)||V1095_DEF}
async function swApi(repo,path,opt){opt=opt||{};const r=await fetch('https://api.github.com/repos/'+repo+'/contents/'+path,{method:opt.method||'GET',cache:opt.cache||'no-cache',body:opt.body,
 headers:Object.assign({Authorization:'Bearer '+swTok(),Accept:opt.raw?'application/vnd.github.raw+json':'application/vnd.github+json'},opt.body?{'Content-Type':'application/json'}:{})});return r}
async function swDir(repo,dir){const r=await swApi(repo,dir);if(r.status===404)return [];if(r.status===401||r.status===403)throw new Error('kein Zugriff auf '+repo.split('/')[1]);if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();return Array.isArray(j)?j:[]}
async function swRaw(repo,path){const r=await swApi(repo,path,{raw:true,cache:'no-store'});if(r.status===404)return null;if(!r.ok)throw new Error('HTTP '+r.status);const t=await r.text();return t?JSON.parse(t):null}
function swZiel(R){if(V1100.mode==='lokal')return null;if(R.k==='offen')return [V1100_TISCH,'wuerfe/'+V1100.ich+'.json','w'];
 return V1100.mode==='sl'?[V1100_SL,'tisch/sl-verdeckt.json','w']:[swOwnRepo(),'wuerfe/verdeckt.json','w']}
function swMerk(repo,path,fn,msg){const k=repo+'|'+path;(V1100.q[k]=V1100.q[k]||{repo,path,fns:[],msg}).fns.push(fn);swFlush(k)}
async function swFlush(k){if(V1100.busy[k])return;const Q=V1100.q[k];if(!Q||!Q.fns.length)return;V1100.busy[k]=1;const fns=Q.fns.splice(0);
 try{await v1097Mod(Q.repo,Q.path,swTok(),o=>{for(const f of fns)o=f(o);return o},Q.msg);V1100.fehler=''}
 catch(e){V1100.fehler=String(e&&e.message||e);Q.fns.unshift(...fns);setTimeout(()=>swFlush(k),15000)}
 finally{V1100.busy[k]=0;swUi();if(Q.fns.length)swFlush(k)}}
function swAppendW(R){return o=>{o=o&&Array.isArray(o.w)?o:{v:1,w:[]};if(!o.w.some(x=>x.id===R.id))o.w.push(R);o.w.sort((a,b)=>a.t-b.t);if(o.w.length>V1100_MAX)o.w=o.w.slice(-V1100_MAX);return o}}
function swAdd(R,neu){if(V1100.ids.has(R.id))return false;V1100.ids.add(R.id);V1100.log.push(R);V1100.log.sort((a,b)=>b.t-a.t);if(V1100.log.length>600){const x=V1100.log.splice(600);x.forEach(r=>V1100.ids.delete(r.id))}return true}
/* öffentlicher Einstieg: würfeln, anzeigen, ablegen */
async function swWurf(o){let R;try{R=swWuerfeln(Object.assign({k:V1100.vis},o))}catch(e){swToast({l:'Würfel',x:String(e.message||e)});return null}
 swAdd(R);V1100._ui='';swUi();if(V1100.mode==='lokal'){const L=swLS('swWuerfeLokal')||[];L.push(R);swLS('swWuerfeLokal',L.slice(-100))}
 else{const z=swZiel(R);if(z&&z[0])swMerk(z[0],z[1],swAppendW(R),'Wurf · '+V1100.name)}
 await swAnim(R,swMeinStil());swToast(R,true);swUi();return R}
/* ---------------- Stil */
function swMeinStil(){return Object.assign({},V1100_STD,V1100.stil[V1100.ich]||swLS('swWStil')||{})}
function swStilVon(ben){return Object.assign({},V1100_STD,V1100.stil[ben]||{})}
async function swFont(key){const F=V1100_FONTS[key]||V1100_FONTS.cinzel;if(!F[2])return F[1];if(V1100.fontOk[key])return '"'+F[1]+'"';
 try{const u=typeof swMedia==='function'?swMedia(F[2]):F[2];const ff=new FontFace(F[1],'url('+u+')');await Promise.race([ff.load().then(f=>{document.fonts.add(f);V1100.fontOk[key]=1}),new Promise(r=>setTimeout(r,700))])}catch(e){}
 return V1100.fontOk[key]?'"'+F[1]+'"':'Georgia, serif'}
const V1100_FORM={4:'50,6 94,88 6,88',6:'12,12 88,12 88,88 12,88',8:'50,4 94,50 50,96 6,50',10:'50,4 92,42 50,96 8,42',12:'50,4 94,36 77,92 23,92 6,36',20:'50,3 92,27 92,73 50,97 8,73 8,27',100:'50,4 92,42 50,96 8,42'};
function swDieSvg(s,txt,st,font,uid){const pts=V1100_FORM[s]||V1100_FORM[20],id='swp'+uid;
 const pat=st.bild?'<defs><pattern id="'+id+'" patternUnits="objectBoundingBox" width="1" height="1"><image href="'+swE(st.bild)+'" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" opacity="'+(+st.deck||0.35)+'"/></pattern></defs>':'';
 const fs=String(txt).length>2?26:String(txt).length>1?34:40;
 return '<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">'+pat+'<polygon points="'+pts+'" fill="'+swE(st.farbe)+'" stroke="rgba(0,0,0,.55)" stroke-width="3" stroke-linejoin="round"/>'
  +(st.bild?'<polygon points="'+pts+'" fill="url(#'+id+')"/>':'')+'<polygon points="'+pts+'" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1.2" transform="translate(50 50) scale(.86) translate(-50 -50)"/>'
  +'<text x="50" y="'+(s===4?66:57)+'" text-anchor="middle" dominant-baseline="middle" font-family=\''+font.replace(/'/g,'')+'\' font-size="'+fs+'" font-weight="700" fill="'+swE(st.schrift)+'" stroke="rgba(0,0,0,.35)" stroke-width=".6">'+swE(txt)+'</text></svg>'}
let V1100_UID=0;
async function swAnim(R,st){if(!st.anim)return;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return}catch(e){}
 const font=await swFont(st.font);const box=document.createElement('div');box.className='swanim';document.body.appendChild(box);
 const dice=[];for(const d of R.d){const show=d.k!=null?d.r:d.r;for(const v of show){if(dice.length>=12)break;dice.push({s:d.s,v,kept:d.k==null||v===d.k})}}
 const W=innerWidth,H=innerHeight,sz=Math.max(54,Math.min(84,W/7)),n=dice.length;
 const els=dice.map((d,i)=>{const el=document.createElement('div');el.className='swdie';el.style.width=el.style.height=sz+'px';const uid=++V1100_UID;el.innerHTML=swDieSvg(d.s,d.v,st,font,uid);box.appendChild(el);
  const tx=W/2-sz/2+(i-(n-1)/2)*(sz*1.12),ty=H/2-sz/2+((i%2)?sz*0.25:-sz*0.25),sx=W-40,sy=H-60,rot=(Math.random()<.5?-1:1)*(540+Math.random()*360);
  const a=el.animate([{transform:'translate('+sx+'px,'+sy+'px) rotate(0deg) scale(.4)',opacity:0},{transform:'translate('+((sx+tx)/2)+'px,'+(ty-H*0.12)+'px) rotate('+(rot*0.6)+'deg) scale(1.05)',opacity:1,offset:.55},
   {transform:'translate('+tx+'px,'+ty+'px) rotate('+rot+'deg) scale(1)',opacity:1}],{duration:950+i*60,easing:'cubic-bezier(.2,.7,.25,1)',fill:'forwards'});
  const tick=setInterval(()=>{const t=el.querySelector('text');if(t)t.textContent=String(d.s===100?swRnd(100):swRnd(d.s))},70);a.finished.then(()=>{clearInterval(tick);const t=el.querySelector('text');if(t)t.textContent=String(d.v);if(!d.kept)el.style.opacity='.35'});return a});
 await Promise.all(els.map(a=>a.finished.catch(()=>{})));await new Promise(r=>setTimeout(r,900));box.style.transition='opacity .35s';box.style.opacity='0';setTimeout(()=>box.remove(),400)}
/* ---------------- Anzeige: Knöpfe, Fenster, Einblendungen */
function swCss(){if(document.getElementById('swCss'))return;const c=document.createElement('style');c.id='swCss';c.textContent=`
#swTisch{position:fixed;right:calc(12px + var(--swr,0px) + env(safe-area-inset-right,0px));bottom:var(--swb,96px);z-index:9000;display:flex;flex-direction:column;gap:10px}
#swTisch>button{position:relative;width:48px;height:48px;border-radius:50%;border:2px solid #c9a24a;background:radial-gradient(circle at 35% 30%,#3a2c17,#16110b);color:#f0c75e;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.5);padding:0}
#swTisch>button svg{width:26px;height:26px}#swTisch .swbadge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:9px;background:#b3261e;color:#fff;font:700 11px/18px system-ui,sans-serif;padding:0 4px;box-sizing:border-box}
.swpanel{position:fixed;right:calc(70px + var(--swr,0px) + env(safe-area-inset-right,0px));bottom:var(--swb,96px);z-index:9100;width:min(380px,calc(100vw - 90px));max-height:min(560px,calc(100vh - 140px));display:flex;flex-direction:column;background:#1b1712;color:#f3e6c8;border:1px solid #6b5a3a;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.6);font:14px system-ui,sans-serif;overflow:hidden}
.swpanel header{display:flex;align-items:center;gap:6px;padding:8px 10px;border-bottom:1px solid #3d3326;background:#231d15}.swpanel header b{flex:1;font:600 13px system-ui;letter-spacing:1.5px;text-transform:uppercase;color:#e3c27a}
.swpanel header button,.swpanel .swtabs button{background:none;border:1px solid #5a4a30;color:#e8d8b3;border-radius:6px;padding:4px 8px;cursor:pointer;font:13px system-ui}
.swpanel .swtabs{display:flex;gap:6px;padding:8px 10px 0}.swpanel .swtabs button.on{background:#c9a24a;color:#1b1712;border-color:#c9a24a}
.swbody{padding:10px;overflow:auto;flex:1}.swrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}.swrow label{display:flex;gap:6px;align-items:center}
.swbody input,.swbody select,.swbody textarea{background:#120f0b;color:#f3e6c8;border:1px solid #5a4a30;border-radius:6px;padding:5px 7px;font:14px system-ui;max-width:100%}
.swarten{display:flex;flex-wrap:wrap;gap:6px}.swarten button,.swseg button{border:1px solid #5a4a30;background:#120f0b;color:#e8d8b3;border-radius:6px;padding:6px 8px;cursor:pointer;font:600 13px system-ui}
.swarten button.on,.swseg button.on{background:#c9a24a;color:#1b1712;border-color:#c9a24a}.swseg{display:inline-flex;gap:0}.swseg button{border-radius:0}.swseg button:first-child{border-radius:6px 0 0 6px}.swseg button:last-child{border-radius:0 6px 6px 0}
.swpanel .swgo,.swdlg .swgo,.swgo{background:#c9a24a;color:#1b1712;border:0;border-radius:7px;padding:8px 14px;font:700 14px system-ui;cursor:pointer}
.swlog{list-style:none;margin:0;padding:0}.swlog li{padding:6px 4px;border-bottom:1px solid #2e261b;cursor:default}.swlog li b{color:#f6e7c4}.swlog .swmeta{font-size:11px;color:#a8977a}
.swk{display:inline-block;font-size:10px;padding:1px 5px;border-radius:4px;border:1px solid #6b5a3a;margin-left:4px;color:#d9c08a}.swk.v{border-color:#8a4b4b;color:#e7a6a6}
.swpop{position:fixed;z-index:9600;max-width:320px;background:#0f0c09;color:#f3e6c8;border:1px solid #c9a24a;border-radius:8px;padding:8px 10px;font:13px system-ui;box-shadow:0 8px 24px rgba(0,0,0,.6);pointer-events:none}
.swtoasts{position:fixed;right:calc(70px + var(--swr,0px) + env(safe-area-inset-right,0px));bottom:calc(var(--swb,96px) + 112px);z-index:9550;display:flex;flex-direction:column;gap:6px;align-items:flex-end;pointer-events:none;max-width:calc(100vw - 90px)}
.swtoast{pointer-events:auto;display:flex;gap:8px;align-items:center;background:#1b1712;color:#f3e6c8;border:1px solid #6b5a3a;border-left:6px solid var(--c,#c9a24a);border-radius:8px;padding:7px 10px;font:14px system-ui;box-shadow:0 6px 18px rgba(0,0,0,.5);animation:swin .25s ease-out}
.swtoast .swmini{width:30px;height:30px;flex:none}@keyframes swin{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
.swanim{position:fixed;inset:0;z-index:9580;pointer-events:none}.swdie{position:absolute;left:0;top:0;filter:drop-shadow(0 6px 10px rgba(0,0,0,.55))}
.swdbtn{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;margin-left:5px;vertical-align:middle;border:1px solid #b08a3c;border-radius:5px;background:#fff8e6;color:#7a1f1f;cursor:pointer;padding:0}
.swdbtn svg{width:14px;height:14px}.swdbtn:hover{background:#f0c75e}
.swdlg{position:fixed;inset:0;z-index:9620;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}.swdlg>div{background:#1b1712;color:#f3e6c8;border:1px solid #c9a24a;border-radius:10px;padding:14px;min-width:260px;max-width:calc(100vw - 32px);font:14px system-ui}
.swdlg h4{margin:0 0 6px;font:600 15px system-ui;color:#e3c27a}.swdlg .swrow{margin:10px 0}
.swchat{display:flex;flex-direction:column;gap:6px}.swmsg{max-width:82%;padding:6px 9px;border-radius:10px;background:#2a2219;align-self:flex-start;white-space:pre-wrap;word-wrap:break-word}.swmsg.ich{align-self:flex-end;background:#4a3a1c}
.swmsg small{display:block;font-size:10px;color:#a8977a;margin-top:2px}.swsp{display:flex;justify-content:space-between;gap:8px;padding:8px 6px;border-bottom:1px solid #2e261b;cursor:pointer}.swsp:hover{background:#231d15}
.swsp .n{background:#b3261e;color:#fff;border-radius:9px;padding:0 6px;font:700 11px/18px system-ui}.swsend{display:flex;gap:6px;padding:8px 10px;border-top:1px solid #3d3326}.swsend textarea{flex:1;resize:none;height:40px}
.swfehler{padding:4px 10px;font-size:11px;color:#e7a6a6}
.swst .swprev{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.swst .swprev div{width:56px;height:56px}
body.swoffen .swtoasts{right:calc(70px + min(380px,calc(100vw - 90px)) + 10px + var(--swr,0px))}
@media (max-width:560px){body.swoffen .swtoasts{bottom:auto;top:calc(10px + env(safe-area-inset-top,0px));right:8px}.swpanel{right:8px;left:8px;width:auto;bottom:calc(var(--swb,96px) + 112px);max-height:calc(100vh - var(--swb,96px) - 150px)}.swtoasts{right:8px;bottom:calc(var(--swb,96px) + 112px)}}
`;document.head.appendChild(c)}
const V1100_ICON_W='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 2 21 7v10l-9 5-9-5V7z"/><path d="M12 2v6M3 7l9 1 9-1M12 8l-5 9h10z"/></svg>';
const V1100_ICON_C='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 5h16v10H9l-5 4z"/></svg>';
/* Lage der Knöpfe: unten rechts über Kartensteuerung, Kartenknöpfen und Statusleiste; sichtbarer Bildausschnitt (auch bei gezoomter Seite) */
function swPos(){const vv=window.visualViewport,H=vv?vv.offsetTop+vv.height:innerHeight,R=vv?vv.offsetLeft+vv.width:innerWidth;let off=innerWidth<=560?16:24;
 for(const e of document.querySelectorAll('#v1096bar,#swLoginBadge,.map-actions,.leaflet-bottom.leaflet-right .leaflet-control-zoom,#mapHint')){if(!e.offsetParent)continue;const r=e.getBoundingClientRect();if(r.width<2||r.bottom<H-260||r.right<R-90)continue;off=Math.max(off,H-r.top+10)}
 const d=document.documentElement.style;d.setProperty('--swb',Math.round(off+(innerHeight-H))+'px');d.setProperty('--swr',Math.round(innerWidth-R)+'px')}
function swKnoepfe(){if(document.getElementById('swTisch'))return;const d=document.createElement('div');d.id='swTisch';d.setAttribute('data-sw','tisch');
 d.innerHTML='<button type="button" id="swBtnW" title="Würfel">'+V1100_ICON_W+'</button>'+(V1100.mode==='lokal'?'':'<button type="button" id="swBtnC" title="Flüstern">'+V1100_ICON_C+'<span class="swbadge" hidden></span></button>');
 document.body.appendChild(d);$('swBtnW').onclick=()=>swOpen(V1100.panel==='w'?null:'w');if($('swBtnC'))$('swBtnC').onclick=()=>swOpen(V1100.panel==='c'?null:'c');
 const tb=document.createElement('div');tb.className='swtoasts';tb.id='swToasts';tb.setAttribute('data-sw','tisch');document.body.appendChild(tb);swPos();addEventListener('resize',swPos);if(window.visualViewport){visualViewport.addEventListener('resize',swPos);visualViewport.addEventListener('scroll',swPos)}setInterval(swPos,1500)}
function swOpen(p){V1100.panel=p;document.body.classList.toggle('swoffen',!!p);const old=document.getElementById('swPanel');if(old)old.remove();if(!p)return;const el=document.createElement('div');el.className='swpanel';el.id='swPanel';el.setAttribute('data-sw','tisch');document.body.appendChild(el);
 if(p==='c'){if(V1100.mode==='spieler')V1100.chatSel=V1100.ich;swPoll(true)}else if(V1100.mode!=='lokal')swPoll(true);swUi()}
function swUi(){const b=document.querySelector('#swBtnC .swbadge');swUnread();if(b){b.hidden=!V1100.unread;b.textContent=V1100.unread>99?'99+':String(V1100.unread)}
 const el=document.getElementById('swPanel');if(!el)return;const f=document.activeElement&&el.contains(document.activeElement)?document.activeElement:null;
 if(f&&(f.tagName==='TEXTAREA'||f.tagName==='INPUT')&&V1100._ui===V1100.panel+V1100.tab+V1100.chatSel){swUiTeil(el);return}V1100._ui=V1100.panel+V1100.tab+V1100.chatSel;
 el.innerHTML=V1100.panel==='w'?swWHtml():swCHtml();swUiTeil(el);if(V1100.panel==='c'){const c=el.querySelector('.swbody');if(c)c.scrollTop=c.scrollHeight}}
function swUiTeil(el){const L=el.querySelector('.swlog');if(L)L.innerHTML=swLogHtml();const F=el.querySelector('.swfehler');if(F)F.textContent=V1100.fehler?'Hinweis: '+V1100.fehler:''}
function swWHtml(){const F=V1100.form,w20=F.n===1&&F.s===20&&!F.f;
 let h='<header><b>Würfel</b><button type="button" data-sw-x>×</button></header><div class="swtabs"><button data-sw-tab="wuerfeln" class="'+(V1100.tab==='wuerfeln'?'on':'')+'">Würfeln</button><button data-sw-tab="log" class="'+(V1100.tab==='log'?'on':'')+'">Protokoll</button></div><div class="swbody">';
 if(V1100.tab==='wuerfeln'){h+='<div class="swrow"><label>Anzahl <select data-sw-f="n">'+Array.from({length:20},(_,i)=>'<option'+(i+1===F.n?' selected':'')+'>'+(i+1)+'</option>').join('')+'</select></label><label>Bonus <input type="number" data-sw-f="b" value="'+F.b+'" style="width:70px"></label></div>'
  +'<div class="swrow swarten">'+V1100_ARTEN.map(s=>'<button type="button" data-sw-s="'+s+'" class="'+(F.s===s?'on':'')+'">W'+s+'</button>').join('')+'</div>'
  +'<div class="swrow"><label style="flex:1">Wofür <input type="text" data-sw-f="l" value="'+swE(F.l)+'" placeholder="Freier Wurf" maxlength="80" style="flex:1"></label></div>'
  +'<div class="swrow"><label style="flex:1">oder Formel <input type="text" data-sw-f="f" value="'+swE(F.f)+'" placeholder="z. B. 2W6+3" maxlength="40" style="flex:1"></label></div>'
  +(w20?'<div class="swrow"><span class="swseg">'+[['n','Normal'],['v','Vorteil'],['d','Nachteil']].map(([k,l])=>'<button type="button" data-sw-m="'+k+'" class="'+(F.m===k?'on':'')+'">'+l+'</button>').join('')+'</span></div>':'')
  +'<div class="swrow">'+swVisHtml()+'<button type="button" class="swgo" data-sw-go>Würfeln '+swE(F.f?F.f:(F.n+'W'+F.s+(F.b?(F.b>0?'+':'')+F.b:'')))+'</button></div>'
  +'<div style="font-size:11px;color:#a8977a">'+(V1100.mode==='lokal'?'Ohne Anmeldung: Würfe nur auf diesem Gerät.':'Offen: alle am Tisch sehen den Wurf · Für mich: nur du'+(V1100.mode==='spieler'?' und die Spielleitung':'')+'.')+'</div>'
  +'<h4 style="margin:12px 0 4px;font:600 12px system-ui;color:#c9b48a;text-transform:uppercase;letter-spacing:1px">Letzte Würfe</h4><ul class="swlog"></ul>'}
 else h+='<ul class="swlog"></ul>';
 return h+'</div><div class="swfehler"></div>'}
function swVisHtml(){return '<span class="swseg">'+[['offen','Offen'],['verdeckt','Für mich']].map(([k,l])=>'<button type="button" data-sw-vis="'+k+'" class="'+(V1100.vis===k?'on':'')+'">'+l+'</button>').join('')+'</span>'}
function swLogHtml(){const max=V1100.panel==='w'&&V1100.tab==='wuerfeln'?6:150;const L=V1100.log.slice(0,max);if(!L.length)return '<li class="swmeta">Noch keine Würfe.</li>';
 return L.map(R=>{const st=swStilVon(R.ben);return '<li data-sw-r="'+swE(R.id)+'" style="border-left:4px solid '+swE(st.farbe)+';padding-left:8px"><b>'+swE(R.l)+': '+R.e+'</b>'+(R.krit?' <span class="swk">kritisch</span>':R.patzer?' <span class="swk v">nat. 1</span>':'')
  +'<div class="swmeta">'+swE(R.name||R.ben)+' · '+new Date(R.t).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})+(R.ben!==V1100.ich?'':'')+' <span class="swk'+(R.k==='verdeckt'?' v':'')+'">'+(R.k==='verdeckt'?(R.ben==='sl'?'nur SL':'für '+(R.ben===V1100.ich?'mich':'SL')):'offen')+'</span></div></li>'}).join('')}
function swFind(id){return V1100.log.find(r=>r.id===id)}
function swPop(R,x,y){swPopX();const z=swZus(R),p=document.createElement('div');p.className='swpop';p.id='swPop';p.innerHTML='<b>'+swE(z.f)+'</b><br>'+swE(z.z)+(z.x?'<br><i>'+swE(z.x)+'</i>':'');document.body.appendChild(p);
 const r=p.getBoundingClientRect();p.style.left=Math.max(8,Math.min(innerWidth-r.width-8,x-r.width/2))+'px';p.style.top=Math.max(8,y-r.height-14)+'px'}
function swPopX(){const p=document.getElementById('swPop');if(p)p.remove()}
async function swToast(R,eigen){const box=document.getElementById('swToasts');if(!box)return;const t=document.createElement('div');t.className='swtoast';
 if(R.id){const st=swStilVon(R.ben),font=await swFont(st.font);t.style.setProperty('--c',st.farbe);t.dataset.swR=R.id;
  const d=R.d[0];t.innerHTML='<div class="swmini">'+swDieSvg(d?d.s:20,R.e,st,font,++V1100_UID)+'</div><div><b>'+swE(R.l)+': '+R.e+'</b>'+(R.krit?' <span class="swk">kritisch</span>':R.patzer?' <span class="swk v">nat. 1</span>':'')+'<div class="swmeta" style="font-size:11px;color:#a8977a">'+swE(eigen?(R.k==='verdeckt'?'für dich':'offen'):(R.name||R.ben)+(R.k==='verdeckt'?' · verdeckt':''))+'</div></div>'}
 else t.innerHTML='<div><b>'+swE(R.l)+'</b><div>'+swE(R.x)+'</div></div>';
 box.prepend(t);while(box.children.length>4)box.lastChild.remove();setTimeout(()=>{t.style.transition='opacity .4s';t.style.opacity='0';setTimeout(()=>t.remove(),450)},R.id?7000:5000)}
/* ---------------- Flüstern */
function swCut(L){const g=Date.now()-V1100_TAGE*86400000;return (L||[]).filter(m=>m&&m.t>=g)}
function swMix(a,o){const ids=new Set((o.n||[]).map(x=>x.id)),n=(o.n||[]).concat(((a&&a.n)||[]).filter(x=>!ids.has(x.id))).sort((x,y)=>x.t-y.t);return {v:1,n,gelesen:Math.max(+(a&&a.gelesen)||0,+o.gelesen||0)}}
function swChat(ben){return V1100.chat[ben]=V1100.chat[ben]||{sp:{v:1,n:[],gelesen:0},sl:{v:1,n:[],gelesen:0}}}
function swUnread(){let n=0;if(V1100.mode==='spieler'){const C=swChat(V1100.ich);n=swCut(C.sl.n).filter(m=>m.t>(C.sp.gelesen||0)).length}
 else if(V1100.mode==='sl'){for(const sp of swListe()){const C=swChat(sp.benutzer);n+=swCut(C.sp.n).filter(m=>m.t>(C.sl.gelesen||0)).length}}V1100.unread=n;return n}
function swCHtml(){let h='<header>'+(V1100.mode==='sl'&&V1100.chatSel?'<button type="button" data-sw-back>‹</button>':'')+'<b>Flüstern'+(V1100.mode==='sl'&&V1100.chatSel?' · '+swE((swListe().find(s=>s.benutzer===V1100.chatSel)||{}).name||V1100.chatSel):V1100.mode==='spieler'?' · Spielleitung':'')+'</b><button type="button" data-sw-x>×</button></header>';
 if(V1100.mode==='sl'&&!V1100.chatSel){h+='<div class="swbody">'+swListe().map(sp=>{const C=swChat(sp.benutzer),all=swCut(C.sp.n).concat(swCut(C.sl.n)).sort((a,b)=>a.t-b.t),last=all[all.length-1],n=swCut(C.sp.n).filter(m=>m.t>(C.sl.gelesen||0)).length;
   return '<div class="swsp" data-sw-sp="'+swE(sp.benutzer)+'"><div><b>'+swE(sp.name)+'</b><div class="swmeta" style="font-size:12px;color:#a8977a">'+(last?swE((last.von==='sl'?'Du: ':'')+last.x.slice(0,60)):'Keine Nachrichten')+'</div></div>'+(n?'<span class="n">'+n+'</span>':'')+'</div>'}).join('')+'</div><div class="swfehler"></div>';return h}
 const ben=V1100.mode==='sl'?V1100.chatSel:V1100.ich,C=swChat(ben);const L=swCut(C.sp.n).map(m=>Object.assign({von:'sp'},m)).concat(swCut(C.sl.n).map(m=>Object.assign({von:'sl'},m))).sort((a,b)=>a.t-b.t);
 const ich=V1100.mode==='sl'?'sl':'sp';
 h+='<div class="swbody"><div class="swchat">'+(L.length?L.map(m=>'<div class="swmsg'+(m.von===ich?' ich':'')+'">'+swE(m.x)+'<small>'+new Date(m.t).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+'</small></div>').join(''):'<div class="swmeta" style="color:#a8977a">Noch keine Nachrichten. Nachrichten werden nach '+V1100_TAGE+' Tagen gelöscht.</div>')+'</div></div>'
  +'<div class="swfehler"></div><div class="swsend"><textarea data-sw-msg maxlength="2000" placeholder="Nachricht …"></textarea><button type="button" class="swgo" data-sw-send>Senden</button></div>';
 setTimeout(()=>swGelesen(ben),50);return h}
function swGelesen(ben){const C=swChat(ben);if(V1100.mode==='spieler'){const m=Math.max(0,...swCut(C.sl.n).map(x=>x.t));if(m>(C.sp.gelesen||0)){C.sp.gelesen=m;swMerk(swOwnRepo(),'fluestern/spieler.json',o=>{o=o||{v:1,n:[]};o.n=swCut(o.n);o.gelesen=Math.max(o.gelesen||0,m);return o},'Flüstern gelesen');swUi()}}
 else if(V1100.mode==='sl'){const m=Math.max(0,...swCut(C.sp.n).map(x=>x.t));if(m>(C.sl.gelesen||0)){C.sl.gelesen=m;const sp=swListe().find(s=>s.benutzer===ben);if(sp)swMerk(sp.repo,'fluestern/sl.json',o=>{o=o||{v:1,n:[]};o.n=swCut(o.n);o.gelesen=Math.max(o.gelesen||0,m);return o},'Flüstern gelesen');swUi()}}}
function swSend(txt){txt=String(txt||'').trim();if(!txt)return;const m={id:V1100.ich+'-'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),t:Date.now(),x:txt.slice(0,2000)};
 if(V1100.mode==='spieler'){const C=swChat(V1100.ich);C.sp.n.push(m);swMerk(swOwnRepo(),'fluestern/spieler.json',o=>{o=o||{v:1,n:[]};o.n=swCut(o.n);if(!o.n.some(x=>x.id===m.id))o.n.push(m);return o},'Flüstern · '+V1100.name)}
 else if(V1100.mode==='sl'&&V1100.chatSel){const sp=swListe().find(s=>s.benutzer===V1100.chatSel);if(!sp)return;const C=swChat(sp.benutzer);C.sl.n.push(m);swMerk(sp.repo,'fluestern/sl.json',o=>{o=o||{v:1,n:[]};o.n=swCut(o.n);if(!o.n.some(x=>x.id===m.id))o.n.push(m);return o},'Flüstern · Spielleitung')}
 V1100._ui='';swUi()}
/* ---------------- Abfrage */
function swTakt(){const A=window.SW_ABFRAGE,plan=(A&&A.plan)||{zeitzone:'Europe/Berlin',abschnitte:[{von:'So 22:00',bis:'Fr 15:00',takt:'täglich'},{von:'Fr 15:00',bis:'Sa 14:00',sekunden:60},{von:'Sa 14:00',bis:'So 02:00',sekunden:20},{von:'So 02:00',bis:'So 22:00',sekunden:60}]};
 const TAG={So:0,Mo:1,Di:2,Mi:3,Do:4,Fr:5,Sa:6},EN={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};let t;
 try{const p={};new Intl.DateTimeFormat('en-GB',{timeZone:plan.zeitzone||'Europe/Berlin',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).forEach(x=>p[x.type]=x.value);t=EN[p.weekday]*1440+(+p.hour%24)*60+(+p.minute)}catch(e){const d=new Date();t=d.getDay()*1440+d.getHours()*60+d.getMinutes()}
 const z=s=>{const m=/^\s*(So|Mo|Di|Mi|Do|Fr|Sa)\s+(\d{1,2}):(\d{2})\s*$/.exec(s||'');return m?TAG[m[1]]*1440+(+m[2])*60+(+m[3]):null};
 for(const a of plan.abschnitte||[]){const v=z(a.von),b=z(a.bis);if(v==null||b==null)continue;if(v<b?(t>=v&&t<b):(t>=v||t<b))return a.takt==='täglich'?86400:Math.max(10,+a.sekunden||60)}return 60}
async function swLadeW(repo,dir,file,tag){const L=await swDir(repo,dir),f=L.find(x=>x.name===file);if(!f)return;const k=repo+'|'+dir+'/'+file;if(V1100.sha[k]===f.sha)return;const o=await swRaw(repo,dir+'/'+file);V1100.sha[k]=f.sha;swNeu(o)}
function swNeu(o){if(!o||!Array.isArray(o.w))return;const neu=[];for(const R of o.w){if(R&&R.id&&swAdd(R)&&R.ben!==V1100.ich&&R.t>V1100.t0-30000)neu.push(R)}neu.sort((a,b)=>a.t-b.t).forEach(R=>swToast(R,false))}
async function swPoll(jetzt){if(V1100.mode==='lokal'||V1100.poll)return;V1100.poll=true;V1100.last=Date.now();
 try{// offene Würfe und Stile
  const W=await swDir(V1100_TISCH,'wuerfe');for(const f of W){if(!/\.json$/.test(f.name))continue;const k=V1100_TISCH+'|wuerfe/'+f.name;if(V1100.sha[k]===f.sha)continue;const o=await swRaw(V1100_TISCH,'wuerfe/'+f.name);V1100.sha[k]=f.sha;swNeu(o)}
  const S=await swDir(V1100_TISCH,'stil');for(const f of S){const k=V1100_TISCH+'|stil/'+f.name;if(V1100.sha[k]===f.sha)continue;const o=await swRaw(V1100_TISCH,'stil/'+f.name);V1100.sha[k]=f.sha;if(o&&o.stil)V1100.stil[f.name.replace(/\.json$/,'')]=o.stil}
  if(V1100.mode==='spieler'){const R=swOwnRepo();await swLadeW(R,'wuerfe','verdeckt.json');const F=await swDir(R,'fluestern'),C=swChat(V1100.ich);
   for(const f of F){const k=R+'|fluestern/'+f.name;if(V1100.sha[k]===f.sha)continue;const o=await swRaw(R,'fluestern/'+f.name);V1100.sha[k]=f.sha;if(f.name==='sl.json'&&o)C.sl=swMix(C.sl,o);if(f.name==='spieler.json'&&o)C.sp=swMix(C.sp,o)}}
  if(V1100.mode==='sl'){await swLadeW(V1100_SL,'tisch','sl-verdeckt.json');if(typeof v1095SpListe==='function')try{await v1095SpListe()}catch(e){}
   await Promise.all(swListe().map(async sp=>{try{await swLadeW(sp.repo,'wuerfe','verdeckt.json');const F=await swDir(sp.repo,'fluestern'),C=swChat(sp.benutzer);
    for(const f of F){const k=sp.repo+'|fluestern/'+f.name;if(V1100.sha[k]===f.sha)continue;const o=await swRaw(sp.repo,'fluestern/'+f.name);V1100.sha[k]=f.sha;if(f.name==='sl.json'&&o)C.sl=swMix(C.sl,o);if(f.name==='spieler.json'&&o){const alt=swCut(C.sp.n).length;C.sp=swMix(C.sp,o);if(swCut(C.sp.n).length>alt&&V1100.ready)swToast({l:'Flüstern',x:'Neue Nachricht von '+sp.name})}}}catch(e){}}))}
  V1100.fehler=''}
 catch(e){V1100.fehler=String(e&&e.message||e)}
 finally{V1100.poll=false;V1100.ready=true;swUi()}}
function swSchritt(){clearTimeout(V1100.timer);const iv=swTakt()*1000;if(!document.hidden&&Date.now()-V1100.last>=iv)swPoll();V1100.timer=setTimeout(swSchritt,Math.min(iv,60000))}
/* ---------------- Würfel in den Bögen */
function swBtn(o){return '<button type="button" class="swdbtn" title="'+swE(o.l+' · '+o.f)+'" data-swd="'+swE(JSON.stringify(o))+'">'+V1100_ICON_W+'</button>'}
function swFrage(o){const w20=/^1W20([+-]\d+)?$/.test(String(o.f).replace(/\s/g,''));if(!w20&&!(o.zw&&o.zw.length>1)){swWurf(o);return}
 const d=document.createElement('div');d.className='swdlg';d.setAttribute('data-sw','tisch');let zw=0,m='n';
 const draw=()=>{d.innerHTML='<div><h4>'+swE((o.zw?o.zw[zw].l:o.l))+'</h4><div class="swmeta" style="color:#a8977a">'+swE(o.f)+'</div>'
  +(o.zw&&o.zw.length>1?'<div class="swrow"><span class="swseg">'+o.zw.map((z,i)=>'<button type="button" data-z="'+i+'" class="'+(i===zw?'on':'')+'">'+swE(z.t)+'</button>').join('')+'</span></div>':'')
  +(w20?'<div class="swrow"><span class="swseg">'+[['n','Normal'],['v','Vorteil'],['d','Nachteil']].map(([k,l])=>'<button type="button" data-m="'+k+'" class="'+(m===k?'on':'')+'">'+l+'</button>').join('')+'</span></div>':'')
  +'<div class="swrow">'+swVisHtml()+'</div><div class="swrow"><button type="button" class="swgo" data-go>Würfeln</button><button type="button" data-x style="background:none;border:1px solid #5a4a30;color:#e8d8b3;border-radius:6px;padding:7px 10px">Abbrechen</button></div></div>'};
 draw();document.body.appendChild(d);
 d.addEventListener('click',e=>{const b=e.target.closest('button');if(e.target===d||(b&&b.hasAttribute('data-x'))){d.remove();return}if(!b)return;
  if(b.dataset.z){zw=+b.dataset.z;draw();return}if(b.dataset.m){m=b.dataset.m;draw();return}if(b.dataset.swVis){V1100.vis=b.dataset.swVis;swLS('swWVis',V1100.vis);draw();return}
  if(b.hasAttribute('data-go')){d.remove();const z=o.zw?o.zw[zw]:{};swWurf(Object.assign({},o,{l:z.l||o.l,ziel:z.ziel||o.ziel,m}))}})}
function swSchiff(el){const sh=el&&el.querySelector('.v1086sheet');if(!sh||sh.dataset.swd)return;const s=typeof v1086Cur==='function'&&v1086Cur(),v=s&&v1086Calc(s);if(!s||!v)return;sh.dataset.swd='1';
 const nm=s.name||'Schiff',sg=x=>(x>=0?'+':'-')+Math.abs(x),cell=lab=>{for(const tr of sh.querySelectorAll('tr')){const th=tr.querySelector('th');if(th&&th.textContent.trim()===lab)return tr.querySelector('td')}return null},add=(td,o)=>{if(td)td.insertAdjacentHTML('beforeend',swBtn(o))};
 add(cell('Initiativwert'),{f:'1W20'+sg(v.ini),l:'Initiative '+nm,zw:[{t:'Initiative',l:'Initiative '+nm},{t:'Minen ausweichen',l:'Minen ausweichen '+nm,ziel:14}]});
 add(cell('Feuerleitwert'),{f:'1W20'+sg(v.feuer),l:'Rammen '+nm,zw:[{t:'Rammen',l:'Rammen '+nm},{t:'Abfangen',l:'Abfangen '+nm,ziel:15}]});
 add(cell('Enterwert'),{f:'1W20'+sg(v.enter),l:'Entern '+nm});
 if(swParse(v.ed))add(cell('Enterschaden'),{f:swFmt(swParse(v.ed)),l:'Enterschaden '+nm});
 const SY=['Rumpf','Segel','Crew'];
 sh.querySelectorAll('tr[data-v1086row]').forEach(tr=>{const w=v1086W((s.waffen||{})[tr.dataset.v1086row]);if(!w)return;const krit=/Kritisch 19/.test(w.e||'')?19:20;
  const A=tr.querySelectorAll('td[data-l="Angriff"] .v1086rsc>div'),D=tr.querySelectorAll('td[data-l="Schaden"] .v1086rsc>div');
  w.hit.forEach((x,i)=>{if(x!=null&&A[i])A[i].insertAdjacentHTML('beforeend',swBtn({f:'1W20'+sg(x+v.feuer),l:'Angriff '+w.n+' auf '+SY[i]+' · '+nm,krit}))});
  w.dmg.forEach((x,i)=>{const p=swParse(x);if(p&&D[i])D[i].insertAdjacentHTML('beforeend',swBtn({f:swFmt(p),l:'Schaden '+w.n+' ('+SY[i]+') · '+nm}))})})}
/* ---------------- Spielerbögen › Würfel (Stil) */
function swStilHtml(){const st=swMeinStil();let h=v1095Tabs()+'<div class="v1086sheet swst" style="max-width:720px"><div class="v1086box"><h4>Würfel gestalten</h4>'
 +'<p class="v1086n">Gilt für deine Würfel auf deinem Bildschirm und in den Einblendungen der anderen am Tisch.</p>'
 +'<table class="v1086t"><tr><th>Würfelfarbe</th><td><input type="color" data-sws="farbe" value="'+swE(st.farbe)+'"></td></tr><tr><th>Schriftfarbe</th><td><input type="color" data-sws="schrift" value="'+swE(st.schrift)+'"></td></tr>'
 +'<tr><th>Schriftart</th><td><select data-sws="font">'+Object.entries(V1100_FONTS).map(([k,f])=>'<option value="'+k+'"'+(k===st.font?' selected':'')+'>'+f[0]+'</option>').join('')+'</select></td></tr>'
 +'<tr><th>Bild oder Muster</th><td><input type="file" accept="image/png,image/jpeg,image/webp" data-sws-bild> '+(st.bild?'<button type="button" data-sws-weg>Bild entfernen</button>':'')+'<div class="v1086n">Wird auf 128 × 128 Bildpunkte verkleinert.</div></td></tr>'
 +'<tr><th>Deckkraft Bild</th><td><input type="range" min="0.1" max="1" step="0.05" data-sws="deck" value="'+(+st.deck||0.35)+'"></td></tr>'
 +'<tr><th>Animation</th><td><label><input type="checkbox" data-sws="anim"'+(st.anim?' checked':'')+'> Würfel rollen über den Bildschirm</label></td></tr></table>'
 +'<div class="swprev" id="swPrev"></div><div class="v1086act"><button type="button" data-sws-test>Testwurf</button><button type="button" data-sws-save>Speichern</button><span id="swStSt" class="v1086b"></span></div></div></div>';return h}
async function swStilPrev(){const p=document.getElementById('swPrev');if(!p)return;const st=V1100._stEdit||swMeinStil(),font=await swFont(st.font);p.innerHTML=V1100_ARTEN.map(s=>'<div title="W'+s+'">'+swDieSvg(s,s===100?'00':s,st,font,++V1100_UID)+'</div>').join('')}
function swStilRender(el){V1100._stEdit=swMeinStil();el.innerHTML=swStilHtml();swStilPrev()}
async function swBild(file){if(!file||!/^image\//.test(file.type))throw new Error('Nur Bilddateien');if(file.size>8e6)throw new Error('Datei zu groß');const url=URL.createObjectURL(file);
 try{const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Bild nicht lesbar'));i.src=url});const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),s=Math.min(img.width,img.height);
  g.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,128,128);let d=c.toDataURL('image/webp',0.8);if(!/^data:image\/webp/.test(d))d=c.toDataURL('image/jpeg',0.8);if(d.length>80000)throw new Error('Bild zu groß');return d}finally{URL.revokeObjectURL(url)}}
async function swStilSave(){const st=Object.assign({},V1100._stEdit||swMeinStil());swLS('swWStil',st);V1100.stil[V1100.ich]=st;const o=document.getElementById('swStSt');
 if(V1100.mode==='lokal'){if(o)o.textContent='Auf diesem Gerät gespeichert.';return}
 if(o)o.textContent='Speichert …';try{await v1097Mod(V1100_TISCH,'stil/'+V1100.ich+'.json',swTok(),()=>({v:1,ben:V1100.ich,name:V1100.name,stil:st,zeit:new Date().toISOString()}),'Würfelstil · '+V1100.name);if(o)o.textContent='Gespeichert.'}
 catch(e){if(o)o.textContent='Nicht gespeichert: '+(e.message||e)}}
/* ---------------- Ereignisse */
function swEvents(){
 document.addEventListener('click',e=>{const t=e.target;if(!t.closest)return;const db=t.closest('.swdbtn');if(db){e.preventDefault();e.stopPropagation();try{swFrage(JSON.parse(db.dataset.swd))}catch(x){}return}
  const P=t.closest('#swPanel');if(P){const b=t.closest('button,[data-sw-sp],[data-sw-r]');if(!b)return;
   if(b.hasAttribute('data-sw-x')){swOpen(null);return}if(b.dataset.swTab){V1100.tab=b.dataset.swTab;swUi();return}
   if(b.dataset.swS){V1100.form.s=+b.dataset.swS;V1100.form.f='';V1100._ui='';swUi();return}if(b.dataset.swM){V1100.form.m=b.dataset.swM;V1100._ui='';swUi();return}
   if(b.dataset.swVis){V1100.vis=b.dataset.swVis;swLS('swWVis',V1100.vis);V1100._ui='';swUi();return}
   if(b.hasAttribute('data-sw-go')){const F=V1100.form,f=F.f||(F.n+'W'+F.s+(F.b?(F.b>0?'+':'')+F.b:''));swWurf({f,l:F.l||'Freier Wurf',m:F.n===1&&F.s===20&&!F.f?F.m:'n'});return}
   if(b.dataset.swSp){V1100.chatSel=b.dataset.swSp;swUi();return}if(b.hasAttribute('data-sw-back')){V1100.chatSel=null;swUi();return}
   if(b.hasAttribute('data-sw-send')){const ta=P.querySelector('[data-sw-msg]');swSend(ta.value);return}
   if(b.dataset.swR){const R=swFind(b.dataset.swR);if(R){const r=b.getBoundingClientRect();swPop(R,r.left+r.width/2,r.top);setTimeout(swPopX,4000)}}return}
  const tt=t.closest('.swtoast[data-sw-r]');if(tt){const R=swFind(tt.dataset.swR);if(R){const r=tt.getBoundingClientRect();swPop(R,r.left+r.width/2,r.top);setTimeout(swPopX,4000)}return}
  const sb=t.closest('[data-sws-test],[data-sws-save],[data-sws-weg]');if(sb){if(sb.hasAttribute('data-sws-test')){const st=V1100._stEdit||swMeinStil();swAnim(swWuerfeln({f:'1W20+1W6+1W8',l:'Testwurf'}),st)}
   else if(sb.hasAttribute('data-sws-save'))swStilSave();else{V1100._stEdit.bild='';swStilRender($('tablesBody'))}}},true);
 document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.swF&&t.closest('#swPanel')){const k=t.dataset.swF;V1100.form[k]=k==='n'||k==='b'?(+t.value||0):t.value;if(k==='n'&&V1100.form.n<1)V1100.form.n=1;
   const g=document.querySelector('[data-sw-go]');if(g){const F=V1100.form;g.textContent='Würfeln '+(F.f?F.f:(F.n+'W'+F.s+(F.b?(F.b>0?'+':'')+F.b:'')))}}
  if(t.dataset&&t.dataset.sws){const st=V1100._stEdit=V1100._stEdit||swMeinStil();st[t.dataset.sws]=t.type==='checkbox'?t.checked:t.value;swStilPrev()}});
 document.addEventListener('change',async e=>{const t=e.target;if(t.dataset&&t.dataset.swF==='n'&&t.closest('#swPanel')){V1100._ui='';swUi()}
  if(t.hasAttribute&&t.hasAttribute('data-sws-bild')){const o=document.getElementById('swStSt');try{V1100._stEdit=V1100._stEdit||swMeinStil();V1100._stEdit.bild=await swBild(t.files[0]);swStilPrev();if(o)o.textContent='Bild übernommen – Speichern nicht vergessen.'}catch(x){if(o)o.textContent=String(x.message||x)}}});
 document.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&e.target.dataset&&e.target.hasAttribute('data-sw-msg')){e.preventDefault();swSend(e.target.value)}});
 document.addEventListener('pointerover',e=>{const li=e.target.closest&&e.target.closest('.swlog li[data-sw-r]');if(!li||e.pointerType==='touch')return;const R=swFind(li.dataset.swR);if(R){const r=li.getBoundingClientRect();swPop(R,r.left+r.width/2,r.top)}});
 document.addEventListener('pointerout',e=>{const li=e.target.closest&&e.target.closest('.swlog li[data-sw-r]');if(li&&!li.contains(e.relatedTarget))swPopX()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)swSchritt()})}
/* ---------------- Einbindung */
{const _t=v1095Tabs;v1095Tabs=function(){const h=_t.apply(this,arguments);return h.replace(/<\/div>$/,'<button data-v1095sub="wuerfel" class="'+(V1095.sub==='wuerfel'?'on':'')+'">Würfel</button></div>')}}
{const _r=v911Render;v911Render=function(){const el=$('tablesBody');if(el&&typeof V1M!=='undefined'&&V1M.top==='boegen'&&V1095.sub==='wuerfel'){swStilRender(el);return}return _r.apply(this,arguments)}}
{const _r=v1086Render;v1086Render=function(el){_r.apply(this,arguments);try{swSchiff(el)}catch(e){console.warn('Würfel im Schiffsbogen',e)}}}
function v1100Init(){try{swInit();swCss();swKnoepfe();swEvents();const L=swLS('swWuerfeLokal');if(V1100.mode==='lokal'&&Array.isArray(L))L.forEach(R=>swAdd(R));
 const st=swLS('swWStil');if(st)V1100.stil[V1100.ich]=st;if(V1100.mode!=='lokal')setTimeout(()=>{swPoll();swSchritt()},2500);swUi()}catch(e){console.warn('Stufe 6',e)}}
setTimeout(v1100Init,0);
