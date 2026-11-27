
/* ---------------- V10.97: Spielerbögen Heere und Gebäude, Prüfstempel
   Heere: Besitzer je Heer (SL, atlas.sl7.owner). Der Spieler sieht seine Heere vollständig (alle Modellwerte, Qualitätsklasse, Lage am
   Heimatort) und stellt Anträge (Werte, Stärke/Reserve, Sold/Nachschub, Verlegen, freier Antrag; bei regulären Heeren nur Verlegen/frei).
   Anträge liegen im Repo des Spielers (boegen/heere.json); Genehmigung/Ablehnung durch die SL im SL-Repo (online/freigaben.json).
   Genehmigt übernimmt die SL-Fassung die Änderung ins Heer (wie im Heer-Editor) – der Online-Abgleich veröffentlicht sie automatisch.
   Gebäude: eigener Bogen je Spieler (boegen/gebaeude.json), keine Wirkung auf die Wirtschaft; Menge und Gewinn folgen der Lage am Ort
   (Produktion × Lieferkette; Gewinn zusätzlich Handel × Aufstand; mit Fixkostenanteil).
   Prüfstempel (Schiffe, Gebäude): Fingerabdruck der prüfpflichtigen Werte, Freigabe nur im SL-Repo (fälschungssicher); jede spätere
   Änderung daran nimmt den Stempel weg. Laufwerte (LP, Bruchstufen …), Name, Kapitän, Hafen, Notiz sind frei. */
const V1097={fr:null,frT:0,offen:null,offenT:0,heer:{form:null,liste:null,sha:null,ben:null,alle:null},geb:{list:[],cur:null,base:'',dirty:false,sha:null,timer:null,ziel:null,geladen:null,busy:false,fehler:'',zeit:null}};
const V1097_SL='BoHMaybe/scherbenwelt-sl',V1097_K=0.15,V1097_W=['Ausbildung','Waffen','Rüstungen','Führung','Ausrüstung','Versorgung','Transport','Magie','Moral','Disziplin'],V1097_RES=['7','14','30','60','90','180'];
const V1097_ART=['Schmiede','Mühle','Brauerei','Bäckerei','Gerberei','Weberei','Töpferei','Sägewerk','Mine','Steinbruch','Hof','Weingut','Fischerei','Werft','Lagerhaus','Handelskontor','Taverne','Gasthaus','Werkstatt','Alchemistenlabor','Tempel','Stall'];
function v1097TokSL(){const L=v1095L();if(L)return (L.tokens||{}).sl||'';return v1095Tok()}
function v1097TokRepo(){const L=v1095L();if(L&&L.rolle==='spieler')return (L.tokens||{}).eigen||'';return v1097TokSL()}
function v1097Sl(){return V1095.mode==='sl'}
async function v1097Get(repo,path,tok){const r=await fetch('https://api.github.com/repos/'+repo+'/contents/'+path,{cache:'no-store',headers:{Authorization:'Bearer '+tok,Accept:'application/vnd.github+json'}});
 if(r.status===404)return {sha:null,obj:null};if(r.status===401||r.status===403)throw new Error('kein Zugriff (Schlüssel prüfen)');if(!r.ok)throw new Error('HTTP '+r.status);
 const j=await r.json();let t=j.content?v1095B64d(j.content):'';if(!t&&j.size>0){const r2=await fetch('https://api.github.com/repos/'+repo+'/contents/'+path,{cache:'no-store',headers:{Authorization:'Bearer '+tok,Accept:'application/vnd.github.raw+json'}});t=await r2.text()}
 return {sha:j.sha,obj:t?JSON.parse(t):null}}
async function v1097Put(repo,path,tok,obj,sha,msg){const who={name:'Scherbenwelt Atlas · '+v1095Wer(),email:'atlas@scherbenwelt.invalid'},body={message:msg,committer:who,author:who,content:v1095B64e(JSON.stringify(obj,null,1))};if(sha)body.sha=sha;
 const r=await fetch('https://api.github.com/repos/'+repo+'/contents/'+path,{method:'PUT',cache:'no-store',headers:{Authorization:'Bearer '+tok,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify(body)});
 if(r.status===409||r.status===422){const e=new Error('Konflikt');e.konflikt=1;throw e}if(r.status===401||r.status===403||r.status===404)throw new Error('kein Schreibrecht (Schlüssel prüfen)');if(!r.ok)throw new Error('HTTP '+r.status);
 const j=await r.json();return j&&j.content&&j.content.sha}
/* Datei lesen-ändern-schreiben mit Wiederholung bei Konflikt */
async function v1097Mod(repo,path,tok,fn,msg){for(let i=0;i<3;i++){const g=await v1097Get(repo,path,tok);const o=fn(g.obj);try{const sha=await v1097Put(repo,path,tok,o,g.sha,msg);return {sha,obj:o}}catch(e){if(!e.konflikt)throw e}}throw new Error('Konflikt')}
function v1097Sp(b){if(V1095.mode==='spieler'){const L=v1095L();return {benutzer:b,name:L.name||b,repo:L.repo}}const L=V1095.liste||V1095_DEF;return L.find(x=>x.benutzer===b)||{benutzer:b,name:b,repo:'BoHMaybe/scherbenwelt-'+b}}
function v1097Fmt(x,d){const n=+x;if(!Number.isFinite(n))return esc(String(x==null?'–':x));return n.toLocaleString('de-DE',{maximumFractionDigits:d==null?2:d})}
function v1097Dt(x){return v1095Dt(x)}
/* ---------------- Freigaben (SL-Repo) */
function v1097FrLeer(){return {v:1,boegen:{},antraege:{}}}
async function v1097Fr(force){if(!force&&V1097.fr&&Date.now()-V1097.frT<60000)return V1097.fr;if(V1095.mode==='lokal'){V1097.fr=V1097.fr||v1097FrLeer();return V1097.fr}
 try{const g=await v1097Get(V1097_SL,'online/freigaben.json',v1097TokSL());V1097.fr=g.obj||v1097FrLeer()}catch(e){V1097.fr=V1097.fr||v1097FrLeer()}V1097.frT=Date.now();return V1097.fr}
async function v1097FrSet(fn){const r=await v1097Mod(V1097_SL,'online/freigaben.json',v1097TokSL(),o=>{o=o||v1097FrLeer();o.boegen=o.boegen||{};o.antraege=o.antraege||{};fn(o);return o},'Freigabe · Spielerbögen');V1097.fr=r.obj;V1097.frT=Date.now();V1097.offenT=0}
function v1097Canon(x){if(Array.isArray(x))return '['+x.map(v1097Canon).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+v1097Canon(x[k])).join(',')+'}';return JSON.stringify(x===undefined?null:x)}
async function v1097Fp(o){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v1097Canon(o)));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,24)}
const V1097_PF={schiffe:s=>({typ:s.typ||'',gr:+s.gr||0,waffen:s.waffen||{},module:s.module||{}}),
 gebaeude:g=>({ort:g.ort||'',art:g.art||'',ware:g.ware||'',stufe:+g.stufe||0,menge:+g.menge||0,gewinn:+g.gewinn||0,baukosten:+g.baukosten||0,unterhalt:+g.unterhalt||0,bauzeit:String(g.bauzeit||'')})};
async function v1097StampState(kind,ben,item){const fr=await v1097Fr(),e=(((fr.boegen||{})[ben]||{})[kind+':'+item.id])||null,fp=await v1097Fp(V1097_PF[kind](item));return {ok:!!(e&&e.fp===fp),e,fp}}
async function v1097Stamp(box,kind,ben,item){if(!box)return;if(!ben||ben==='lokal'||V1095.mode==='lokal'){box.innerHTML='';return}let st;try{st=await v1097StampState(kind,ben,item)}catch(e){box.innerHTML='';return}
 let h=st.ok?'<div class="v1097stamp ok">SL freigegeben<small>'+esc(v1097Dt(st.e.zeit))+'</small></div>':'<div class="v1097stamp wait">'+(st.e?'Geändert – Prüfung ausstehend':'Prüfung ausstehend')+'</div>';
 if(st.e&&st.e.hinweis)h+='<div class="v1097hinw">Hinweis SL: '+esc(st.e.hinweis)+'</div>';
 if(v1097Sl())h+='<div class="v1097slbox"><input type="text" data-v1097hinw placeholder="Hinweis an Spieler (optional)" value="'+esc((st.e&&st.e.hinweis)||'')+'"><button type="button" data-v1097a="frei" data-k="'+kind+'" data-b="'+esc(ben)+'" data-id="'+esc(item.id)+'"'+(st.ok?' title="Bereits freigegeben; Hinweis aktualisieren"':'')+'>'+(st.ok?'Hinweis speichern':'Freigeben')+'</button><button type="button" data-v1097a="hinweis" data-k="'+kind+'" data-b="'+esc(ben)+'" data-id="'+esc(item.id)+'">Nur Hinweis</button></div>';
 box.innerHTML=h;box.dataset.fp=st.fp}
async function v1097FreiSetzen(kind,ben,id,hinweis,frei){const item=kind==='schiffe'?(V1086.list||[]).find(x=>x.id===id):(V1097.geb.list||[]).find(x=>x.id===id);if(!item)return;
 if(kind==='schiffe'&&V1095.dirty)await v1095Speichern();if(kind==='gebaeude'&&V1097.geb.dirty)await v1097GebSave();
 const fp=await v1097Fp(V1097_PF[kind](item));
 await v1097FrSet(o=>{const B=o.boegen[ben]=o.boegen[ben]||{},k=kind+':'+id,old=B[k]||null;if(frei||(old&&old.fp===fp))B[k]={fp,zeit:new Date().toISOString(),hinweis:hinweis||''};else B[k]={fp:old?old.fp:null,zeit:old?old.zeit:null,hinweis:hinweis||''}});
 status(frei?'Freigegeben: '+(item.name||id):'Hinweis gespeichert.');v911Render()}
/* ---------------- Prüfliste (SL): offene Bögen und Anträge aller Spieler */
async function v1097Offen(force){if(!v1097Sl())return null;if(!force&&V1097.offen&&Date.now()-V1097.offenT<60000)return V1097.offen;const L=await v1095SpListe(),fr=await v1097Fr(true),o={schiffe:0,gebaeude:0,heere:0,alle:{}};
 await Promise.all(L.map(async sp=>{const tok=v1097TokSL(),a={schiffe:[],gebaeude:[],antraege:[]};
  try{const g=await v1097Get(sp.repo,'boegen/schiffe.json',tok);for(const s of ((g.obj||{}).schiffe||[])){const st=await v1097StampState('schiffe',sp.benutzer,s);if(!st.ok){a.schiffe.push(s.name||s.id);o.schiffe++}}}catch(e){}
  try{const g=await v1097Get(sp.repo,'boegen/gebaeude.json',tok);for(const s of ((g.obj||{}).gebaeude||[])){const st=await v1097StampState('gebaeude',sp.benutzer,s);if(!st.ok){a.gebaeude.push(s.name||s.id);o.gebaeude++}}}catch(e){}
  try{const g=await v1097Get(sp.repo,'boegen/heere.json',tok);for(const x of ((g.obj||{}).antraege||[])){x._b=sp.benutzer;x._n=sp.name;a.antraege.push(x);if(!(((fr.antraege||{})[sp.benutzer]||{})[x.id]))o.heere++}}catch(e){}
  o.alle[sp.benutzer]=a}));
 V1097.offen=o;V1097.offenT=Date.now();v1097TabZahl();return o}
function v1097TabZahl(){const b=$('tabSheets');if(!b)return;const o=V1097.offen,n=o?o.schiffe+o.gebaeude+o.heere:0;b.textContent='Spielerbögen'+(n?' ('+n+')':'')}
/* ---------------- Unterreiter */
v1095Tabs=function(){const o=v1097Sl()?V1097.offen:null,z=k=>o&&o[k]?' ('+o[k]+')':'';
 return '<div class="v911-modes v914sub v1095sub">'+[['schiffe','Schiffe'],['heere','Heere'],['gebaeude','Gebäude']].map(([k,n])=>'<button data-v1095sub="'+k+'" class="'+(V1095.sub===k?'on':'')+'">'+n+z(k)+'</button>').join('')+'</div>'};
{const _r=v911Render;v911Render=function(){const el=$('tablesBody');if(el&&V1M.top==='boegen'){if(v1097Sl()&&(!V1097.offen||Date.now()-V1097.offenT>60000)&&!V1097._lade){V1097._lade=1;v1097Offen(true).then(()=>{V1097._lade=0;if(V1M.top==='boegen')v911Render()}).catch(()=>{V1097._lade=0})}
  if(V1095.sub==='heere'){v1097HeerRender(el);return}if(V1095.sub==='gebaeude'){v1097GebRender(el);return}}return _r.apply(this,arguments)}}
/* Stempel im Schiffsbogen */
{const _r=v1086Render;v1086Render=function(el){_r.apply(this,arguments);const s=v1086Cur(),sh=el.querySelector('.v1086sheet');if(!s||!sh||V1095.ziel==='lokal'||V1095.mode==='lokal')return;sh.classList.add('v1097rel');
  const b=document.createElement('div');b.className='v1097stampbox';sh.prepend(b);v1097Stamp(b,'schiffe',V1095.ziel,s)}}
/* ---------------- Heere */
function v1097Owner(){const S=v7S();S.owner=S.owner||{};return S.owner}
function v1097City(id){return (atlas.cities||[]).find(c=>c.id===id||c.sourceId===id)||null}
function v1097Lage(homeId){const fx=(typeof v99Fx==='function'?v99Fx(homeId):null)||((atlas.v99&&atlas.v99.fx)||{})[homeId]||{},st=(typeof v99Stats==='function'?v99Stats()[homeId]:null)||fx.st||{};
 return {st:Object.assign({},st),fP:fx.fP==null?1:fx.fP,tf:fx.tf==null?1:fx.tf,cr:fx.cr==null?1:fx.cr,rt:fx.rt==null?1:fx.rt,fD:fx.fD==null?1:fx.fD}}
function v1097HeerDaten(a){const S=atlas.sl7||{},C=(S.cust||{}).a||{},cu=C[a.id]?JSON.parse(JSON.stringify(C[a.id])):null,pos=(typeof forcePos==='function'?forcePos(a):null)||(S.pos||{})[a.id]||null,away=(S.away||{})['army:'+a.id]||null;
 return {army:{id:a.id,name:a.name,type:a.type,shard:a.shard,homeId:a.homeId,homeName:a.homeName,leader:a.leader,loyalty:a.loyalty,authority:a.authority,standing:a.standing,mobil:a.mobil,vals:(a._b&&!a.vals.some(x=>x!==''&&x!=null))?a._b.vals:a.vals,_qk:a._qk||null,_mv0:a._mv0||null,custom:!!a.custom},
  cust:cu,pos,away,lage:v1097Lage(a.homeId),qk:typeof v999QKText==='function'?v999QKText(a):'',heads:((atlas.forceHeads||{}).army)||(typeof FORCE_COLS!=='undefined'?FORCE_COLS.army:[])}}
function v1097Besitz(A){const O=((A&&A.sl7)||{}).owner||{},out={};for(const [id,b] of Object.entries(O)){const a=(A.armies||[]).find(x=>x.id===id);if(!a||!b)continue;(out[b]=out[b]||{heere:[]}).heere.push(v1097HeerDaten(a))}return out}
{const _pp=playerPayload;playerPayload=function(input){const r=_pp.apply(this,arguments);try{r.besitz=v1097Besitz(input||atlas)}catch(e){console.warn('Besitz',e)}return r}}
function v1097MeineHeere(b){if(atlas.player)return (((atlas.besitz||{})[b]||{}).heere)||[];return v1097Besitz(atlas)[b]?v1097Besitz(atlas)[b].heere:[]}
function v1097StName(k){const x=(typeof V99_ST!=='undefined'?V99_ST:[]).find(s=>s[0]===k);return x?x[1]:k}
function v1097StLv(k,l){try{return v1kLv(k,l)}catch(e){return String(l)}}
function v1097HeerCard(h,ben,offen){const a=h.army,cu=h.cust,L=h.lage||{},H=h.heads||[],v=a.vals||[],idx=n=>H.indexOf(n),val=n=>{const i=idx(n);return i>=0?v[i]:''};
 const wv=cu?cu.v||{}:Object.fromEntries(V1097_W.map(k=>[k,val(k+' 0–100')])),st=Object.entries(L.st||{}).filter(([k,l])=>+l>0);
 let x='<div class="v1097card"><div class="v1097hd"><b>'+esc(a.name)+'</b><span>'+esc(a.type||'')+' · '+esc(a.shard||'')+'</span></div>'
  +'<table class="v1097t"><tr><th>Heimatort</th><td>'+esc(a.homeName||a.homeId||'')+'</td><th>Führung</th><td>'+esc(a.leader||'')+'</td></tr>'
  +'<tr><th>Haltung</th><td>'+esc(a.loyalty||'')+'</td><th>Position</th><td>'+(h.away?'auf '+esc(h.away.shard):(h.pos?'Karte '+esc(h.pos.join(' / ')):'am Heimatort'))+'</td></tr>'
  +'<tr><th>Stehend</th><td>'+v1097Fmt(a.standing,0)+'</td><th>Mobilisierbar</th><td>'+v1097Fmt(a.mobil,0)+'</td></tr>'
  +'<tr><th>Sold GP/Tag</th><td>'+v1097Fmt(cu?cu.sold:val('Sold GP/Tag (Modell)'))+'</td><th>Nachschub GP/Tag</th><td>'+v1097Fmt(cu?cu.nach:val('Nachschub GP/Tag (Modell)'))+'</td></tr></table>'
  +'<div class="v1097sub">Werte (0–100)</div><table class="v1097t v1097w"><tr>'+V1097_W.map(k=>'<th>'+esc(k)+'</th>').join('')+'</tr><tr>'+V1097_W.map(k=>'<td>'+v1097Fmt(wv[k],0)+'</td>').join('')+'</tr></table>'
  +(cu?'<div class="v1097sub">Reserve (einziehbar nach Tagen) · Miliz '+v1097Fmt(cu.miliz,0)+'</div><table class="v1097t v1097w"><tr>'+V1097_RES.map(k=>'<th>'+k+' T</th>').join('')+'</tr><tr>'+V1097_RES.map(k=>'<td>'+v1097Fmt((cu.res||{})[k],0)+'</td>').join('')+'</tr></table>':'')
  +'<div class="v1097sub">Qualitätsklasse</div><p class="v911-note">'+esc(val('Qualitätsklasse')||'')+(h.qk?' · '+esc(h.qk):'')+'</p>'
  +'<div class="v1097sub">Lage am Heimatort</div><p class="v911-note">'+(st.length?st.map(([k,l])=>esc(v1097StName(k))+' ('+esc(v1097StLv(k,l))+')').join(', '):'keine Kriegsfolgen')+' · Produktion '+v1097Fmt(L.fP*100,0)+' % · Lieferkette '+v1097Fmt(L.cr*100,0)+' % · Handel '+v1097Fmt(L.tf*100,0)+' % · Steuern/Aufstand '+v1097Fmt(L.rt*100,0)+' % · Nachfrage '+v1097Fmt(L.fD*100,0)+' %</p>'
  +(a._mv0&&a._mv0.kw!==''&&a._mv0.kw!=null?'<p class="v911-note">Kampfwert '+v1097Fmt(a._mv0.kw)+(a._mv0.reg!=null?' · regulär bewaffnet '+v1097Fmt(a._mv0.reg,0):'')+'</p>':'')
  +'<details class="v1097det"><summary>Alle Modellwerte ('+H.length+')</summary><table class="v1097t">'+H.map((n,i)=>(v[i]===''||v[i]==null)?'':'<tr><th>'+esc(n)+'</th><td>'+(typeof v[i]==='number'?v1097Fmt(v[i]):esc(String(v[i])))+'</td></tr>').join('')+'</table></details>';
 if(offen)x+='<div class="v1086bar"><button type="button" data-v1097a="antrag" data-id="'+esc(a.id)+'">Antrag stellen</button></div>';
 return x+'</div>'}
function v1097AntragForm(h){const a=h.army,cu=h.cust,cs=(atlas.cities||[]).filter(c=>c.shard===a.shard).sort((x,y)=>x.name.localeCompare(y.name,'de'));
 let x='<form class="v1097card v1097form" data-v1097form="'+esc(a.id)+'"><div class="v1097hd"><b>Antrag · '+esc(a.name)+'</b></div><p class="v911-note">Nur geänderte Felder werden beantragt. Wirksam erst nach Genehmigung durch die Spielleitung.</p>';
 if(cu){x+='<div class="v1097sub">Werte (0–100)</div><div class="v1097grid">'+V1097_W.map(k=>'<label>'+esc(k)+'<input type="number" min="0" max="100" data-f="v.'+esc(k)+'" value="'+(+((cu.v||{})[k])||0)+'"></label>').join('')+'</div>'
  +'<div class="v1097sub">Stärke</div><div class="v1097grid"><label>Miliz<input type="number" min="0" data-f="miliz" value="'+(+cu.miliz||0)+'"></label>'+V1097_RES.map(k=>'<label>Reserve '+k+' T<input type="number" min="0" data-f="res.'+k+'" value="'+(+((cu.res||{})[k])||0)+'"></label>').join('')+'</div>'
  +'<div class="v1097sub">Kosten</div><div class="v1097grid"><label>Sold GP/Tag<input type="number" min="0" step="any" data-f="sold" value="'+(+cu.sold||0)+'"></label><label>Nachschub GP/Tag<input type="number" min="0" step="any" data-f="nach" value="'+(+cu.nach||0)+'"></label></div>'}
 x+='<div class="v1097sub">Verlegen</div><label class="v1097wide">Ziel (Ort auf '+esc(a.shard)+')<select data-f="ziel"><option value="">– nicht verlegen –</option>'+cs.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('')+'</select></label>'
  +'<label class="v1097wide">Begründung / freier Antrag<textarea data-f="text" rows="3"></textarea></label><div class="v1086bar"><button type="submit">Antrag senden</button><button type="button" data-v1097a="abbruch">Abbrechen</button></div></form>';return x}
function v1097AntragLesen(form,h){const cu=h.cust,neu={},alt={};let n=0;
 for(const el of form.querySelectorAll('[data-f]')){const f=el.dataset.f,raw=el.value;if(f==='text'||f==='ziel')continue;const val=+raw||0;
  let old;if(f.startsWith('v.'))old=+((cu.v||{})[f.slice(2)])||0;else if(f.startsWith('res.'))old=+((cu.res||{})[f.slice(4)])||0;else old=+cu[f]||0;
  if(val!==old){neu[f]=f.startsWith('v.')?Math.max(0,Math.min(100,val)):Math.max(0,val);alt[f]=old;n++}}
 const z=form.querySelector('[data-f="ziel"]').value;if(z){const c=v1097City(z);neu.ziel=z;neu.zielName=c?c.name:z;alt.ziel=h.army.homeId;n++}
 const text=form.querySelector('[data-f="text"]').value.trim();return {n,neu,alt,text}}
async function v1097HeerLaden(ben){const sp=v1097Sp(ben);try{const g=await v1097Get(sp.repo,'boegen/heere.json',v1097TokRepo());V1097.heer.liste=((g.obj||{}).antraege)||[];V1097.heer.sha=g.sha;V1097.heer.ben=ben}catch(e){V1097.heer.liste=[];V1097.heer.fehler=e.message}}
function v1097AntragZeile(x,fr,ben,sl){const s=(((fr||{}).antraege||{})[ben]||{})[x.id],stat=s?(s.status==='genehmigt'?'<span class="v1097ok">genehmigt '+esc(v1097Dt(s.zeit))+'</span>':'<span class="v1097no">abgelehnt '+esc(v1097Dt(s.zeit))+'</span>'):'<span class="v1097wt">offen</span>';
 const lbl=k=>k.startsWith('v.')?k.slice(2):k.startsWith('res.')?'Reserve '+k.slice(4)+' T':k==='miliz'?'Miliz':k==='sold'?'Sold GP/Tag':k==='nach'?'Nachschub GP/Tag':k==='ziel'?'Verlegen nach':k;
 const rows=Object.keys(x.neu||{}).filter(k=>k!=='zielName').map(k=>'<tr><th>'+esc(lbl(k))+'</th><td>'+(k==='ziel'?esc((v1097City(x.alt.ziel)||{}).name||x.alt.ziel||''):v1097Fmt(x.alt[k]))+'</td><td>→</td><td><b>'+(k==='ziel'?esc(x.neu.zielName||x.neu.ziel):v1097Fmt(x.neu[k]))+'</b></td></tr>').join('');
 let h='<div class="v1097card v1097ant"><div class="v1097hd"><b>'+esc(x.heerName||x.heer)+'</b><span>'+(sl?esc(x._n||ben)+' · ':'')+esc(v1097Dt(x.zeit))+' · '+stat+'</span></div>'+(rows?'<table class="v1097t">'+rows+'</table>':'')+(x.text?'<p class="v911-note">„'+esc(x.text)+'“</p>':'')+(s&&s.hinweis?'<div class="v1097hinw">Hinweis SL: '+esc(s.hinweis)+'</div>':'');
 if(sl&&!s)h+='<div class="v1097slbox"><input type="text" data-v1097hinw placeholder="Hinweis an Spieler (optional)"><button type="button" data-v1097a="genehmigen" data-b="'+esc(ben)+'" data-id="'+esc(x.id)+'">Genehmigen</button><button type="button" data-v1097a="ablehnen" data-b="'+esc(ben)+'" data-id="'+esc(x.id)+'">Ablehnen</button></div>';
 if(!sl&&!s)h+='<div class="v1086bar"><button type="button" data-v1097a="zurueck" data-id="'+esc(x.id)+'">Antrag zurückziehen</button></div>';return h+'</div>'}
async function v1097HeerRender(el){const sl=v1097Sl(),ich=V1095.mode==='spieler'?v1095Ich():null;let h=v1095Tabs();
 if(V1095.mode==='lokal'){el.innerHTML=h+'<p class="v911-note">Heere der Spieler erscheinen im Web-Atlas nach der Anmeldung'+(atlas.player?'':' bzw. hier mit SL-Schlüssel')+'.</p>'+(atlas.player?'':'<div class="v1086bar"><button type="button" data-v1095a="key">SL-Schlüssel eingeben</button></div>');return}
 if(!sl){const L=v1097MeineHeere(ich);h+='<p class="v911-note">Deine Heere mit allen Werten. Änderungen beantragst du hier; wirksam werden sie erst nach Genehmigung durch die Spielleitung.</p>';
  if(V1097.heer.form){const hh=L.find(x=>x.army.id===V1097.heer.form);if(hh){el.innerHTML=h+v1097AntragForm(hh);return}V1097.heer.form=null}
  el.innerHTML=h+(L.length?L.map(x=>v1097HeerCard(x,ich,true)).join(''):'<p>Dir sind noch keine Heere zugeordnet.</p>')+'<div class="v1097sub">Deine Anträge</div><div id="v1097ant">Lade …</div>';
  await v1097HeerLaden(ich);const fr=await v1097Fr(true),box=$('v1097ant');if(box)box.innerHTML=(V1097.heer.liste||[]).length?V1097.heer.liste.slice().reverse().map(x=>v1097AntragZeile(x,fr,ich,false)).join(''):'<p class="v911-note">Keine Anträge.</p>';return}
 /* Spielleitung */
 const O=v1097Owner(),L=V1095.liste||V1095_DEF,nm=b=>(L.find(x=>x.benutzer===b)||{}).name||b;
 h+='<p class="v911-note">Anträge der Spieler prüfen, Besitzer zuweisen und die Heere so ansehen, wie der Spieler sie sieht. Genehmigte Änderungen gehen wie eine eigene Änderung automatisch an die Spieler.</p><div class="v1097sub">Anträge</div><div id="v1097ant">Lade …</div>';
 h+='<div class="v1097sub">Besitz</div><table class="v1097t">'+Object.entries(O).map(([id,b])=>{const a=(atlas.armies||[]).find(x=>x.id===id);return '<tr><td>'+esc(a?a.name:id)+' <small>'+esc(id)+'</small></td><td>'+esc(nm(b))+'</td><td><button type="button" data-v1097a="zeigen" data-id="'+esc(id)+'">Ansehen</button> <button type="button" data-v1097a="besitzweg" data-id="'+esc(id)+'">Entfernen</button></td></tr>'}).join('')+'</table>'
  +'<div class="v1086bar"><input list="v1097arl" id="v1097ar" placeholder="Heer suchen (Name oder Kennung)" style="min-width:240px"><datalist id="v1097arl">'+(atlas.armies||[]).map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name+' · '+a.shard)+'</option>').join('')+'</datalist><select id="v1097arb">'+L.map(x=>'<option value="'+esc(x.benutzer)+'">'+esc(x.name)+'</option>').join('')+'</select><button type="button" data-v1097a="besitz">Zuweisen</button></div>';
 if(V1097.heer.zeigen){const a=(atlas.armies||[]).find(x=>x.id===V1097.heer.zeigen);if(a)h+='<div class="v1097sub">Ansicht des Spielers</div>'+v1097HeerCard(v1097HeerDaten(a),O[a.id],false)}
 el.innerHTML=h;const o=await v1097Offen(),fr=V1097.fr||{},box=$('v1097ant');if(!box)return;const all=[];for(const [b,x] of Object.entries((o&&o.alle)||{}))for(const an of x.antraege)all.push([b,an]);
 all.sort((p,q)=>{const sp=!!(((fr.antraege||{})[p[0]]||{})[p[1].id]),sq=!!(((fr.antraege||{})[q[0]]||{})[q[1].id]);return sp-sq||String(q[1].zeit).localeCompare(String(p[1].zeit))});
 box.innerHTML=all.length?all.slice(0,60).map(([b,x])=>v1097AntragZeile(x,fr,b,true)).join(''):'<p class="v911-note">Keine Anträge.</p>'}
function v1097Anwenden(x){const S=v7S(),id=x.heer,C=((S.cust||{}).a)||{},d=C[id],N=x.neu||{};let n=0;
 for(const [k,v] of Object.entries(N)){if(k==='zielName')continue;
  if(k==='ziel'){const c=v1097City(v);if(c&&c.xy){S.pos=S.pos||{};S.pos[id]=[Math.round(c.xy[0]),Math.round(c.xy[1])];if(S.away)delete S.away['army:'+id];n++}continue}
  if(!d)continue;if(k.startsWith('v.')){d.v=d.v||{};d.v[k.slice(2)]=v;n++}else if(k.startsWith('res.')){d.res=d.res||{};d.res[k.slice(4)]=v;n++}else if(k==='miliz'||k==='sold'||k==='nach'){d[k]=v;n++}}
 v7Dirty++;try{V99META=null}catch(e){}try{v9aApply()}catch(e){}try{buildForceIndex()}catch(e){}try{refreshLayers()}catch(e){}return n}
/* ---------------- Gebäude */
function v1097GebNeu(){return {id:'gb'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:'Neues Gebäude',notiz:'',ort:'',art:'',ware:'',stufe:1,menge:0,gewinn:0,baukosten:0,unterhalt:0,bauzeit:''}}
function v1097GebCalc(g){const L=v1097Lage(g.ort),mf=L.fP*L.cr,f=mf*L.tf*L.rt,menge=(+g.menge||0)*mf,gewinn=(+g.gewinn||0)*((1+V1097_K)*f-V1097_K);return {L,mf,f,menge,gewinn}}
function v1097GebCalcHtml(g){const c=v1097GebCalc(g),st=Object.entries(c.L.st||{}).filter(([k,l])=>+l>0);
 return '<table class="v1097t"><tr><th>Lage</th><td colspan="3">'+(g.ort?(st.length?st.map(([k,l])=>esc(v1097StName(k))+' ('+esc(v1097StLv(k,l))+')').join(', '):'keine Kriegsfolgen'):'Ort wählen')+'</td></tr>'
  +'<tr><th>Produktion</th><td>'+v1097Fmt(c.L.fP*100,0)+' %</td><th>Lieferkette</th><td>'+v1097Fmt(c.L.cr*100,0)+' %</td></tr><tr><th>Handel</th><td>'+v1097Fmt(c.L.tf*100,0)+' %</td><th>Steuern/Aufstand</th><td>'+v1097Fmt(c.L.rt*100,0)+' %</td></tr>'
  +'<tr><th>Menge je Monat</th><td><b>'+v1097Fmt(c.menge,1)+'</b>'+(g.ware?' × '+esc(g.ware):'')+'</td><th>Gewinn GP je Monat</th><td><b class="'+(c.gewinn<0?'v1097no':'')+'">'+v1097Fmt(c.gewinn,0)+'</b></td></tr></table>'}
function v1097GebSnap(){return JSON.stringify(V1097.geb.list)}
function v1097GebZiel(){if(V1095.mode==='spieler')return v1095Ich();if(V1095.mode==='sl')return V1097.geb.ziel||((V1095.liste||V1095_DEF)[0]||{}).benutzer;return 'lokal'}
async function v1097GebLaden(z){const G=V1097.geb;if(G.dirty&&G.ziel&&G.ziel!=='lokal')await v1097GebSave();G.ziel=z;G.geladen=z;G.fehler='';G.zeit=null;G.dirty=false;G.list=[];G.cur=null;
 if(z==='lokal'){try{const o=JSON.parse(localStorage.getItem('scherbenweltGebaeude')||'{}');G.list=Array.isArray(o.list)?o.list:[];G.cur=o.cur||null}catch(e){}G.base=v1097GebSnap();v911Render();return}
 G.busy=true;v911Render();try{const g=await v1097Get(v1097Sp(z).repo,'boegen/gebaeude.json',v1097TokRepo());G.list=((g.obj||{}).gebaeude)||[];G.sha=g.sha;G.zeit=(g.obj||{}).geaendert||null}catch(e){G.fehler='Online nicht erreichbar ('+e.message+')';const sn=atlas.online&&atlas.online.gebaeude&&atlas.online.gebaeude[z];G.list=sn?JSON.parse(JSON.stringify(sn.liste||[])):[]}
 G.base=v1097GebSnap();G.cur=(G.list[0]||{}).id||null;G.busy=false;v911Render()}
function v1097GebChanged(){const G=V1097.geb;if(G.ziel==='lokal'){try{localStorage.setItem('scherbenweltGebaeude',JSON.stringify({list:G.list,cur:G.cur}))}catch(e){}return}
 G.dirty=v1097GebSnap()!==G.base;clearTimeout(G.timer);G.timer=G.dirty?setTimeout(v1097GebSave,10000):null;v1097GebSt()}
async function v1097GebSave(){const G=V1097.geb;clearTimeout(G.timer);G.timer=null;if(!G.dirty||G.ziel==='lokal'||G.busy)return;const z=G.ziel,snap=v1097GebSnap(),liste=JSON.parse(snap);G.busy=true;G.fehler='';v1097GebSt();
 try{const sp=v1097Sp(z),o={format:'scherbenwelt-spielerboegen',v:1,geaendert:new Date().toISOString(),von:v1095Wer(),gebaeude:liste};let sha;
  try{sha=await v1097Put(sp.repo,'boegen/gebaeude.json',v1097TokRepo(),o,G.sha,'Gebäude · '+v1095Wer())}catch(e){if(!e.konflikt)throw e;const g=await v1097Get(sp.repo,'boegen/gebaeude.json',v1097TokRepo());sha=await v1097Put(sp.repo,'boegen/gebaeude.json',v1097TokRepo(),o,g.sha,'Gebäude · '+v1095Wer())}
  G.sha=sha;G.base=snap;G.dirty=v1097GebSnap()!==snap;G.zeit=o.geaendert}catch(e){G.fehler='Nicht gespeichert: '+e.message+' – neuer Versuch in 1 Minute.';G.timer=setTimeout(v1097GebSave,60000)}
 G.busy=false;if(G.dirty&&!G.timer)G.timer=setTimeout(v1097GebSave,10000);v1097GebSt()}
function v1097GebStHtml(){const G=V1097.geb;if(G.ziel==='lokal')return '<span class="v1095t">Nur in diesem Browser gespeichert.</span>';const t=G.busy?'Speichere …':G.fehler?G.fehler:G.dirty?'Ungespeicherte Änderungen – werden in Kürze gespeichert.':G.zeit?'Gespeichert · '+v1097Dt(G.zeit):'Online-Speicher bereit.';
 return '<span class="v1095t'+(G.fehler?' err':G.dirty?' dirty':'')+'">'+esc(t)+'</span><button type="button" data-v1097a="gsave"'+(G.dirty&&!G.busy?'':' disabled')+'>Jetzt speichern</button>'}
function v1097GebSt(){const e=$('v1097gst');if(e)e.innerHTML=v1097GebStHtml()}
function v1097GebRender(el){const G=V1097.geb,z=v1097GebZiel();if(G.geladen!==z&&!G.busy){v1097GebLaden(z);return}
 let h=v1095Tabs()+'<p class="v911-note">'+(V1095.mode==='sl'?'Gebäude der Spieler: Spieler wählen, prüfen und freigeben. Gebäude wirken nicht auf die Wirtschaft, Menge und Gewinn folgen aber der Lage am Ort.':'Deine Gebäude: Menge und Gewinn folgen der Lage am Ort (Kriegsfolgen, Lieferketten, Hungersnot, Aufstand). Ort, Art, Ware, Stufe und Grundwerte prüft die Spielleitung; danach erscheint der Stempel.')+'</p>';
 if(V1095.mode==='sl'){const L=V1095.liste||V1095_DEF,o=V1097.offen;h+='<div class="v1086bar v1095ctl"><label>Gebäude von <select id="v1097gz">'+L.map(x=>{const a=o&&o.alle[x.benutzer],n=a?a.gebaeude.length:0;return '<option value="'+esc(x.benutzer)+'"'+(z===x.benutzer?' selected':'')+'>'+esc(x.name)+(n?' · '+n+' offen':'')+'</option>'}).join('')+'</select></label></div>'}
 if(G.busy&&!G.list.length){el.innerHTML=h+'<p>Gebäude werden geladen …</p>';return}
 const g=G.list.find(x=>x.id===G.cur)||G.list[0]||null;if(g)G.cur=g.id;
 h+='<div class="v1086bar"><select id="v1097gsel">'+(G.list.length?G.list.map(x=>'<option value="'+esc(x.id)+'"'+(g&&x.id===g.id?' selected':'')+'>'+esc(x.name||'Ohne Namen')+(x.ort?' · '+esc((v1097City(x.ort)||{}).name||x.ort):'')+'</option>').join(''):'<option value="">– kein Gebäude –</option>')+'</select>'
  +'<button type="button" data-v1097a="gneu">Neues Gebäude</button><button type="button" data-v1097a="gdel"'+(g?'':' disabled')+'>Löschen</button></div><div class="v1086bar v1095st" id="v1097gst">'+v1097GebStHtml()+'</div>';
 if(!g){el.innerHTML=h+'<p>Noch kein Gebäude angelegt. „Neues Gebäude“ legt eines an.</p>';return}
 const c=v1097GebCalc(g),cities=(atlas.cities||[]).slice().sort((a,b)=>(a.shard+a.name).localeCompare(b.shard+b.name,'de')),sh=[...new Set(cities.map(x=>x.shard))],wares=((atlas.wkl||{}).wares||[]).map(w=>w.n);
 const inp=(f,t,ex)=>'<input type="'+t+'" data-gf="'+f+'" value="'+esc(g[f]==null?'':String(g[f]))+'"'+(ex||'')+'>';
 h+='<div class="v1086sheet v1097rel v1097geb"><div class="v1097stampbox" id="v1097gstamp"></div><div class="v1086hd"><b>'+esc(g.name||'')+'</b><span>'+esc(g.art||'')+(g.ort?' · '+esc((v1097City(g.ort)||{}).name||g.ort):'')+'</span></div>'
  +'<div class="v1097grid"><label>Name (frei)'+inp('name','text')+'</label><label>Art<input type="text" list="v1097artl" data-gf="art" value="'+esc(g.art||'')+'"><datalist id="v1097artl">'+V1097_ART.map(a=>'<option value="'+esc(a)+'">').join('')+'</datalist></label>'
  +'<label>Ort<select data-gf="ort"><option value="">– wählen –</option>'+sh.map(s=>'<optgroup label="'+esc(s)+'">'+cities.filter(x=>x.shard===s).map(x=>'<option value="'+esc(x.id)+'"'+(g.ort===x.id?' selected':'')+'>'+esc(x.name)+'</option>').join('')+'</optgroup>').join('')+'</select></label>'
  +'<label>Ware<input type="text" list="v1097warel" data-gf="ware" value="'+esc(g.ware||'')+'"><datalist id="v1097warel">'+wares.map(w=>'<option value="'+esc(w)+'">').join('')+'</datalist></label>'
  +'<label>Stufe'+inp('stufe','number',' min="0"')+'</label><label>Grundmenge je Monat'+inp('menge','number',' min="0" step="any"')+'</label><label>Grundgewinn GP je Monat'+inp('gewinn','number',' step="any"')+'</label>'
  +'<label>Baukosten GP'+inp('baukosten','number',' min="0" step="any"')+'</label><label>Unterhalt GP je Monat'+inp('unterhalt','number',' min="0" step="any"')+'</label><label>Bauzeit'+inp('bauzeit','text',' placeholder="z. B. 3 Monate"')+'</label></div>'
  +'<label class="v1097wide">Notiz (frei)<textarea data-gf="notiz" rows="2">'+esc(g.notiz||'')+'</textarea></label>'
  +'<div class="v1097sub">Aktuell (Lage am Ort)</div><div id="v1097gcalc">'+v1097GebCalcHtml(g)+'</div></div>';
 el.innerHTML=h;v1097Stamp($('v1097gstamp'),'gebaeude',z,g)}
/* ---------------- Ereignisse */
function v1097Init(){const root=$('tablesView');if(!root||V1097._init)return;V1097._init=1;
 if(!atlas.player&&atlas.sl7){const O=v1097Owner();if(!Object.keys(O).length&&(atlas.armies||[]).some(a=>a.id==='CU-A01')&&!O._init){}}
 root.addEventListener('click',async e=>{const b=e.target.closest&&e.target.closest('[data-v1097a]');if(!b||V1M.top!=='boegen')return;e.preventDefault();const a=b.dataset.v1097a;
  try{if(a==='frei'||a==='hinweis'){const box=b.closest('.v1097slbox'),hw=box&&box.querySelector('[data-v1097hinw]');b.disabled=true;await v1097FreiSetzen(b.dataset.k,b.dataset.b,b.dataset.id,hw?hw.value.trim():'',a==='frei');return}
   if(a==='antrag'){V1097.heer.form=b.dataset.id;v911Render();return}if(a==='abbruch'){V1097.heer.form=null;v911Render();return}
   if(a==='zurueck'){const ich=v1095Ich(),sp=v1097Sp(ich);await v1097Mod(sp.repo,'boegen/heere.json',v1097TokRepo(),o=>{o=o||{antraege:[]};o.antraege=(o.antraege||[]).filter(x=>x.id!==b.dataset.id);return o},'Antrag zurückgezogen');status('Antrag zurückgezogen.');v911Render();return}
   if(a==='genehmigen'||a==='ablehnen'){const box=b.closest('.v1097slbox'),hw=box&&box.querySelector('[data-v1097hinw]'),ben=b.dataset.b,an=((((V1097.offen||{}).alle||{})[ben]||{}).antraege||[]).find(x=>x.id===b.dataset.id);if(!an)return;b.disabled=true;
    let n=0;if(a==='genehmigen')n=v1097Anwenden(an);
    await v1097FrSet(o=>{const A=o.antraege[ben]=o.antraege[ben]||{};A[an.id]={status:a==='genehmigen'?'genehmigt':'abgelehnt',zeit:new Date().toISOString(),hinweis:hw?hw.value.trim():'',n}});
    status(a==='genehmigen'?'Antrag genehmigt: '+n+' Änderung(en) übernommen'+(v1095L()?' – wird automatisch veröffentlicht.':' – Arbeitsstand speichern.'):'Antrag abgelehnt.');V1097.offenT=0;v911Render();return}
   if(a==='besitz'){const id=($('v1097ar').value||'').trim(),ben=$('v1097arb').value;if(!(atlas.armies||[]).some(x=>x.id===id)){status('Heer „'+id+'“ nicht gefunden (Kennung aus der Liste wählen).',true);return}v1097Owner()[id]=ben;v7Dirty++;status('Besitzer gesetzt.');v911Render();return}
   if(a==='besitzweg'){delete v1097Owner()[b.dataset.id];v7Dirty++;v911Render();return}
   if(a==='zeigen'){V1097.heer.zeigen=V1097.heer.zeigen===b.dataset.id?null:b.dataset.id;v911Render();return}
   const G=V1097.geb;
   if(a==='gneu'){const n=v1097GebNeu();G.list.push(n);G.cur=n.id;v1097GebChanged();v911Render();return}
   if(a==='gdel'){const g=G.list.find(x=>x.id===G.cur);if(!g||!confirm('Gebäude „'+(g.name||'')+'“ löschen?'))return;G.list=G.list.filter(x=>x!==g);G.cur=(G.list[0]||{}).id||null;v1097GebChanged();v911Render();return}
   if(a==='gsave'){v1097GebSave();return}}
  catch(err){status('Nicht ausgeführt: '+err.message,true);b.disabled=false}});
 root.addEventListener('submit',async e=>{const f=e.target.closest&&e.target.closest('[data-v1097form]');if(!f)return;e.preventDefault();const id=f.dataset.v1097form,ich=v1095Ich(),h=v1097MeineHeere(ich).find(x=>x.army.id===id);if(!h)return;
  const r=v1097AntragLesen(f,h);if(!r.n&&!r.text){status('Nichts beantragt: Felder ändern oder Begründung eintragen.',true);return}
  const an={id:'an'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),heer:id,heerName:h.army.name,zeit:new Date().toISOString(),neu:r.neu,alt:r.alt,text:r.text,custom:!!h.cust};
  try{const sp=v1097Sp(ich);await v1097Mod(sp.repo,'boegen/heere.json',v1097TokRepo(),o=>{o=o||{format:'scherbenwelt-spielerboegen',v:1,antraege:[]};o.antraege=o.antraege||[];o.antraege.push(an);return o},'Antrag · '+h.army.name);V1097.heer.form=null;status('Antrag gesendet.');v911Render()}
  catch(err){status('Antrag nicht gesendet: '+err.message,true)}});
 const gIn=e=>{const t=e.target;if(!t.dataset||!t.dataset.gf||V1095.sub!=='gebaeude')return;const G=V1097.geb,g=G.list.find(x=>x.id===G.cur);if(!g)return;const f=t.dataset.gf;g[f]=t.type==='number'?(t.value===''?0:+t.value):t.value;v1097GebChanged();
  const cb=$('v1097gcalc');if(cb)cb.innerHTML=v1097GebCalcHtml(g);if(e.type==='change'){const hd=document.querySelector('.v1097geb .v1086hd');if(hd)hd.innerHTML='<b>'+esc(g.name||'')+'</b><span>'+esc(g.art||'')+(g.ort?' · '+esc((v1097City(g.ort)||{}).name||g.ort):'')+'</span>';v1097Stamp($('v1097gstamp'),'gebaeude',V1097.geb.ziel,g)}};
 root.addEventListener('input',gIn);root.addEventListener('change',e=>{if(e.target.id==='v1097gsel'){V1097.geb.cur=e.target.value;v911Render();return}if(e.target.id==='v1097gz'){v1097GebLaden(e.target.value);return}gIn(e)});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&V1097.geb.dirty)v1097GebSave()});
 try{document.head.insertAdjacentHTML('beforeend','<style id="v1097css">.v1097rel{position:relative}.v1097stampbox{float:right;margin:0 0 8px 12px;text-align:right;max-width:260px}.v1097stamp{display:inline-block;border:3px double;border-radius:6px;padding:4px 10px;font:700 13px system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;transform:rotate(-4deg)}.v1097stamp small{display:block;font-weight:400;letter-spacing:0;text-transform:none;font-size:11px}.v1097stamp.ok{color:#1f6b2a;border-color:#1f6b2a;background:rgba(31,107,42,.06)}.v1097stamp.wait{color:#8a6a22;border-color:#c9a24a;transform:none;font-size:11px}.v1097hinw{font-size:12px;color:#7a3a10;margin-top:4px}.v1097slbox{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end;margin-top:6px}.v1097slbox input{flex:1;min-width:140px;font-size:12px}.v1097card{border:1px solid #c9b48a;border-radius:6px;padding:8px 10px;margin:8px 0;background:rgba(255,250,240,.6)}.v1097hd{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;border-bottom:1px solid #c9b48a;margin-bottom:6px;padding-bottom:4px}.v1097hd span{font-size:12px;color:#6b5a3a}.v1097t{border-collapse:collapse;font-size:13px;margin:4px 0;max-width:100%}.v1097t th{text-align:left;font-weight:600;color:#5a4a30;padding:2px 8px 2px 0}.v1097t td{padding:2px 10px 2px 0}.v1097w th,.v1097w td{text-align:center;padding:2px 5px;font-size:12px}.v1097w{display:block;overflow-x:auto;max-width:100%}.v1097card{overflow-x:hidden}.v1097sub{font:600 12px system-ui,sans-serif;text-transform:uppercase;letter-spacing:.05em;color:#8a6a22;margin:10px 0 2px}.v1097det summary{cursor:pointer;font-size:12px;color:#6b5a3a;margin-top:6px}.v1097grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px 10px}.v1097grid label,.v1097wide{display:flex;flex-direction:column;font-size:12px;color:#5a4a30}.v1097wide{margin-top:6px}.v1097grid input,.v1097grid select,.v1097wide select,.v1097wide textarea{font-size:14px}.v1097ok{color:#1f6b2a;font-weight:600}.v1097no{color:#a33;font-weight:600}.v1097wt{color:#8a6a22;font-weight:600}@media(max-width:600px){.v1097stampbox{float:none;text-align:left;max-width:none}}</style>')}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v1097Init);else v1097Init();
{const _i=v1095Import;v1095Import=async function(){await _i.apply(this,arguments);try{const L=await v1095SpListe(),now=new Date().toISOString();atlas.online=atlas.online||{};atlas.online.gebaeude=atlas.online.gebaeude||{};atlas.online.heere=atlas.online.heere||{};
 for(const sp of L){try{const g=await v1097Get(sp.repo,'boegen/gebaeude.json',v1097TokSL());atlas.online.gebaeude[sp.benutzer]={name:sp.name,abgerufen:now,liste:((g.obj||{}).gebaeude)||[]}}catch(e){}
  try{const g=await v1097Get(sp.repo,'boegen/heere.json',v1097TokSL());atlas.online.heere[sp.benutzer]={name:sp.name,abgerufen:now,antraege:((g.obj||{}).antraege)||[]}}catch(e){}}
 const fr=await v1097Fr(true);atlas.online.freigaben=JSON.parse(JSON.stringify(fr))}catch(e){}}}
