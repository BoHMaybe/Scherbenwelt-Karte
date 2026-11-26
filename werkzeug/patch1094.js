
/* V10.94: Ausgelagerte Bilder.
   bilder/<name>  – öffentlich im Repo der Webseite (Ordner bilder/). Auf der Webseite relativ geladen; im lokal geöffneten Arbeitsstand (file:) von der Webseite.
   slbild:<name>  – SL-exklusiv im privaten Repo scherbenwelt-sl (Ordner bilder/); nur mit SL-Schlüssel ladbar, nie in der Spielerdatei. */
var V1094={base:'https://bohmaybe.github.io/Scherbenwelt-Karte/',repo:'BoHMaybe/scherbenwelt-sl',blob:new Map(),want:new Set(),busy:false,err:''};
try{const b=localStorage.getItem('scherbenweltBildBasis');if(b)V1094.base=b.replace(/\/?$/,'/')}catch(e){}
function v1094Fix(v){if(typeof v!=='string')return null;
 if(/^bilder\//.test(v)&&location.protocol==='file:')return V1094.base+v;
 if(/^slbild:/.test(v)){const n=v.slice(7);if(V1094.blob.has(n))return V1094.blob.get(n);V1094.want.add(n);return null}
 return null}
function v1094El(el){if(!el||el.nodeType!==1)return;
 const at=el.tagName==='IMG'?'src':(el.tagName==='image'||el.tagName==='IMAGE')?(el.hasAttribute('href')?'href':'xlink:href'):null;
 if(at){const v=el.getAttribute(at);const f=v1094Fix(v);if(f&&f!==v)el.setAttribute(at,f);else if(v&&/^slbild:/.test(v))el.dataset.v1094=v}
 const st=el.getAttribute&&el.getAttribute('style');if(st&&/url\(["']?(bilder\/|slbild:)/.test(st)){const s2=st.replace(/url\((["']?)((?:bilder\/|slbild:)[^"')]+)\1\)/g,(m,q,u)=>{const f=v1094Fix(u);return f?'url('+q+f+q+')':m});if(s2!==st)el.setAttribute('style',s2)}}
function v1094Scan(root){try{(root||document).querySelectorAll('img,image,[style*="bilder/"],[style*="slbild:"]').forEach(v1094El);(root||document).querySelectorAll('[data-v1094]').forEach(el=>{const n=el.dataset.v1094.slice(7);if(V1094.blob.has(n)){el.setAttribute(el.tagName==='IMG'?'src':'href',V1094.blob.get(n));delete el.dataset.v1094}})}catch(e){}}
try{new MutationObserver(ms=>{for(const m of ms){if(m.type==='attributes')v1094El(m.target);else for(const n of m.addedNodes)if(n.nodeType===1){v1094El(n);if(n.querySelectorAll)n.querySelectorAll('img,image,[style*="bilder/"],[style*="slbild:"]').forEach(v1094El)}}}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','href','xlink:href','style']})}catch(e){}
function v1094Refs(){const L=new Set();try{for(const a of (atlas.compendium&&atlas.compendium.articles)||[])for(const p of a.pages||[])for(const b of p.blocks||[])if(b.t==='img'&&typeof b.src==='string'&&b.src.startsWith('slbild:'))L.add(b.src.slice(7));
 for(const m of atlas.maps||[])if(typeof m.image==='string'&&m.image.startsWith('slbild:'))L.add(m.image.slice(7))}catch(e){}return [...L]}
function v1094Tok(){try{return localStorage.getItem('scherbenweltSLSchluessel')||''}catch(e){return ''}}
async function v1094Load(){const L=v1094Refs().filter(n=>!V1094.blob.has(n));const tok=v1094Tok();v1094Ui();if(!L.length||!tok||V1094.busy)return;V1094.busy=true;V1094.err='';v1094Ui();
 let i=0,bad=0;const one=async n=>{try{const r=await fetch('https://api.github.com/repos/'+V1094.repo+'/contents/bilder/'+encodeURIComponent(n),{headers:{Authorization:'Bearer '+tok,Accept:'application/vnd.github.raw+json'}});
   if(r.status===401||r.status===403){V1094.err='Schlüssel ungültig oder ohne Zugriff';bad++;return}if(!r.ok){bad++;return}
   const b=await r.blob();const t=/\.webp$/.test(n)?'image/webp':/\.png$/.test(n)?'image/png':/\.gif$/.test(n)?'image/gif':'image/jpeg';V1094.blob.set(n,URL.createObjectURL(new Blob([b],{type:t})))}catch(e){bad++;V1094.err=V1094.err||'Keine Verbindung'}};
 const run=async()=>{while(i<L.length){const n=L[i++];await one(n);if(V1094.err==='Schlüssel ungültig oder ohne Zugriff')return}};
 await Promise.all([run(),run(),run(),run(),run(),run()]);V1094.busy=false;
 if(bad&&!V1094.err)V1094.err=bad+' SL-Bilder nicht geladen';v1094Scan();v1094Rerender();v1094Ui()}
function v1094Rerender(){try{const m=typeof currentMap==='function'&&currentMap();if(m&&typeof m.image==='string'&&m.image.startsWith('slbild:')&&typeof imageLayer!=='undefined'&&imageLayer){const n=m.image.slice(7);if(V1094.blob.has(n))imageLayer.setUrl(V1094.blob.get(n))}}catch(e){}}
function v1094Ui(){const n=v1094Refs().length;let el=document.getElementById('v1094sl');if(!n){if(el)el.remove();return}
 if(!el){el=document.createElement('div');el.id='v1094sl';el.style.cssText='position:fixed;left:8px;bottom:8px;z-index:9000;font:12px system-ui,sans-serif;background:#1f1b16;color:#f6e7c4;border:1px solid #6b5a3a;border-radius:6px;padding:4px 8px;cursor:pointer;opacity:.85';
  el.addEventListener('click',v1094Ask);document.body.appendChild(el)}
 const got=v1094Refs().filter(x=>V1094.blob.has(x)).length;
 el.textContent=V1094.busy?'SL-Bilder werden geladen …':!v1094Tok()?'SL-Bilder: Schlüssel eingeben':V1094.err?'SL-Bilder: '+V1094.err+' (Klick: Schlüssel ändern)':got>=n?'SL-Bilder geladen ('+got+')':'SL-Bilder: '+got+'/'+n;
 el.style.display=got>=n&&!V1094.err?'none':''}
function v1094Ask(){if(document.getElementById('v1094ask'))return;const d=document.createElement('div');d.id='v1094ask';d.style.cssText='position:fixed;left:8px;bottom:40px;z-index:9001;background:#fffaf0;color:#2a2116;border:1px solid #7a5a2a;border-radius:6px;padding:10px;box-shadow:0 6px 18px rgba(0,0,0,.3);font:13px system-ui,sans-serif;width:300px';
 d.innerHTML='<b>SL-Schlüssel</b><div style="margin:4px 0 6px;font-size:12px">GitHub-Schlüssel mit Lesezugriff auf scherbenwelt-sl. Er bleibt nur in diesem Browser gespeichert, nicht in der Datei.</div><input type="password" id="v1094tok" style="width:100%;box-sizing:border-box" autocomplete="off"><div style="display:flex;gap:6px;margin-top:8px"><button type="button" id="v1094ok">Speichern und laden</button><button type="button" id="v1094del">Schlüssel löschen</button><button type="button" id="v1094x">×</button></div>';
 document.body.appendChild(d);d.querySelector('#v1094x').onclick=()=>d.remove();
 d.querySelector('#v1094del').onclick=()=>{try{localStorage.removeItem('scherbenweltSLSchluessel')}catch(e){}V1094.err='';d.remove();v1094Ui()};
 d.querySelector('#v1094ok').onclick=()=>{const t=d.querySelector('#v1094tok').value.trim();if(!t)return;try{localStorage.setItem('scherbenweltSLSchluessel',t)}catch(e){}V1094.err='';d.remove();v1094Load()}}
{const go=()=>{v1094Scan();setTimeout(v1094Load,1500)};if(document.readyState==='complete')go();else addEventListener('load',go)}
