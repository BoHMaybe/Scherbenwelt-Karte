/* V10.98: Startspeicher der Wirtschaftsrechnung (nur Spielleitung).
   Beim Öffnen rechnet der Atlas die Lieferketten (v1zcChain); das dauert lange. Die Ergebnisse für den unveränderten Stand liegen
   vorberechnet im Dokument (Datenblock „atlas-eco“, beim Speichern und beim Spielerexport entfernt). Sie werden NUR verwendet, wenn
   1. Programm, Atlasdaten und Online-Änderungen genau dem aufgezeichneten Stand entsprechen,
   2. der gesamte Zustand unmittelbar vor der Rechnung (ganzer Atlas, Faktoren, Ausgangswerte) Bit für Bit gleich ist,
   3. die Rechenumgebung dieselben Ergebnisse liefert (Chromium, Prüfwert der Exponentialfunktion),
   4. noch keine Bedienung stattfand (nur beim Start) und die Reihenfolge der Rechnungen gleich ist,
   5. die entpackten Werte den Prüfwert der Aufzeichnung ergeben.
   Sonst rechnet der Atlas wie bisher. Nach jeder Änderung rechnet der Atlas immer selbst. */
var SWECO={open:true,used:0,miss:'',ms:0,rec:null,D:null,out:[],alle:false};
(function(){var module={exports:{}},exports=module.exports;
@@FFLATE@@
;SWECO.inflate=module.exports.inflateSync})();
['pointerdown','mousedown','keydown','touchstart','wheel'].forEach(function(t){try{window.addEventListener(t,function(){if(SWECO.open)swEcoClose('Bedienung')},{capture:true,passive:true})}catch(e){}});
function swEcoClose(g){SWECO.open=false;if(!SWECO.miss)SWECO.miss=g||'';SWECO.D=null}
function swEcoHasher(){var a=-2128831035|0,b=-1756908916|0,f=new Float64Array(1),u=new Uint32Array(f.buffer),seen=new Map();
 function w(x){a=Math.imul(a^x,16777619);b=Math.imul(b^x,1540483477);b^=b>>>13}
 function s(t){var n=t.length,A,B,i,c;w(n);A=a;B=b;for(i=0;i<n;i++){c=t.charCodeAt(i);A=Math.imul(A^c,16777619);B=Math.imul(B^c,1540483477);B^=B>>>13}a=A;b=B}
 function ta(v){s(v.constructor.name);w(v.length);var n=v.byteLength,o=v.byteOffset,A,B,i,c,q;if(n%4===0&&o%4===0){q=new Int32Array(v.buffer,o,n>>2)}else{q=new Uint8Array(v.buffer,o,n)}A=a;B=b;for(i=0;i<q.length;i++){c=q[i];A=Math.imul(A^c,16777619);B=Math.imul(B^c,1540483477);B^=B>>>13}a=A;b=B}
 function num(v){f[0]=v;w(u[0]);w(u[1])}
 function val(v){if(v===null){w(1);return}var t=typeof v,i,K,p;
  if(t==='undefined'){w(2);return}if(t==='boolean'){w(v?4:3);return}if(t==='number'){w(5);num(v);return}if(t==='string'){w(6);s(v);return}
  if(t==='bigint'){w(7);s(String(v));return}if(t!=='object'){w(8);return}
  if(seen.has(v)){w(15);w(seen.get(v));return}seen.set(v,seen.size);
  if(ArrayBuffer.isView(v)){w(9);ta(v);return}if(v instanceof ArrayBuffer){w(16);ta(new Uint8Array(v));return}
  if(typeof v.nodeType==='number'&&typeof v.nodeName==='string'){w(14);return}
  if(v instanceof Map){w(10);w(v.size);v.forEach(function(x,k){val(k);val(x)});return}
  if(v instanceof Set){w(11);w(v.size);v.forEach(function(x){val(x)});return}
  if(Array.isArray(v)){w(12);w(v.length);for(i=0;i<v.length;i++)val(v[i]);return}
  w(13);p=Object.getPrototypeOf(v);s(p===null?'':(p.constructor&&p.constructor.name)||'?');K=Object.keys(v);w(K.length);for(i=0;i<K.length;i++){s(K[i]);val(v[K[i]])}}
 function hex(){return ('0000000'+(a>>>0).toString(16)).slice(-8)+('0000000'+(b>>>0).toString(16)).slice(-8)}
 return {w:w,s:s,num:num,val:val,hex:hex}}
function swEcoHash(v){var H=swEcoHasher();H.val(v);return H.hex()}
function swEcoHead(){var H=swEcoHasher(),L=document.querySelectorAll('script'),i,e,c,d;for(i=0;i<L.length;i++){e=L[i];if(e.src||e.hasAttribute('data-sw')||e.id==='atlas-data'||e.id==='atlas-eco')continue;H.s(e.id||'');H.s(e.textContent||'')}c=H.hex();
 H=swEcoHasher();e=document.getElementById('atlas-data');H.s(e?e.textContent:'');d=H.hex();
 return {code:c,data:d,ops:swEcoHash([window.SW_OPS&&window.SW_OPS.ops&&window.SW_OPS.ops.length?window.SW_OPS.ops:null,window.SW_OPS_APPLIED===undefined?null:window.SW_OPS_APPLIED,window.SW_IMPORT_DONE===undefined?null:window.SW_IMPORT_DONE,window.SW_OPS_ERR||null])}}
function swEcoProbe(){var H=swEcoHasher(),i;for(i=0;i<200000;i++)H.num(Math.exp(-(i*0.000731)-(i%113)*1.3e-9));return H.hex()}
function swEcoChromium(){try{var u=navigator.userAgentData;return !!(u&&u.brands&&u.brands.some(function(b){return /Chromium/.test(b.brand)}))}catch(e){return false}}
function swEcoFp(k,init){var H=swEcoHasher(),K=Object.keys(atlas),i,j;H.s(String(k));H.w(K.length);
 for(i=0;i<K.length;i++){H.s(K[i]);j=JSON.stringify(atlas[K[i]]);H.s(j===undefined?'\u0000':j)}
 H.val(V99FX);H.val(typeof V1K_NR!=='undefined'?V1K_NR:null);H.val(V1ZC.auto);H.w(V1ZC.p1?1:0);H.w(V1ZC.useCR?1:0);H.val(V1ZC.cur);H.val(init);return H.hex()}
function swEcoInit(init){if(init===undefined||init===null)return -1;var i=SWECO.out.indexOf(init);return i<0?-2:i}
var SWECO_TA={Float32Array:Float32Array,Float64Array:Float64Array,Int32Array:Int32Array,Uint32Array:Uint32Array,Int16Array:Int16Array,Uint16Array:Uint16Array,Int8Array:Int8Array,Uint8Array:Uint8Array,Uint8ClampedArray:Uint8ClampedArray};
/* Vorberechnete Werte laden und vollständig entpacken (vor der ersten Verwendung, damit Bezüge auf frühere Einträge unverändert sind) */
function swEcoLoad(){var el=document.getElementById('atlas-eco'),D,h,bin,u,i,ei,E,r,C,buf,o,ref,x,y;if(!el)return null;
 try{D=JSON.parse(el.textContent)}catch(e){SWECO.miss='Lesefehler';return null}
 if(!D||D.v!==1||!Array.isArray(D.e)||!D.e.length){SWECO.miss='Format';return null}
 h=swEcoHead();if(h.code!==D.head.code){SWECO.miss='Programm';return null}if(h.data!==D.head.data){SWECO.miss='Daten';return null}if(h.ops!==D.head.ops){SWECO.miss='Online-Änderungen';return null}
 if(!SWECO.alle&&(!swEcoChromium()||!D.chromium)){SWECO.miss='Browser';return null}
 if(swEcoProbe()!==D.probe){SWECO.miss='Rechenumgebung';return null}
 bin=atob(D.b);u=new Uint8Array(bin.length);for(i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);bin=null;D.b=null;
 try{for(ei=0;ei<D.e.length;ei++){E=D.e[ei];E.a=[];
   for(r=0;r<E.t.length;r++){x=E.t[r];C=SWECO_TA[x[2]];if(!C)throw new Error('Typ');buf=new Uint8Array(x[3]*C.BYTES_PER_ELEMENT);
    o=SWECO.inflate(u.subarray(x[4],x[4]+x[5]),{out:buf});if(o.length!==buf.length||o.buffer!==buf.buffer)throw new Error('Länge');
    if(x[6]){ref=D.e[x[6][0]].a[x[6][1]];if(!ref||ref.byteLength!==buf.byteLength)throw new Error('Bezug');y=new Uint8Array(ref.buffer,ref.byteOffset,ref.byteLength);for(i=0;i<buf.length;i++)buf[i]^=y[i]}
    E.a.push(new C(buf.buffer))}
   E.r=swEcoBuild(E);if(swEcoHash(E.r)!==E.h)throw new Error('Prüfwert')}}
 catch(e){SWECO.miss='Entpacken: '+(e&&e.message||e);return null}
 return D}
function swEcoBuild(E){var out={},ri=0,i,k,c;for(i=0;i<E.keys.length;i++){k=E.keys[i][0];if(E.keys[i][1]==='j'){out[k]=E.j[k];continue}c={};while(ri<E.t.length&&E.t[ri][0]===k){c[E.t[ri][1]]=E.a[ri];ri++}out[k]=c}if(ri!==E.t.length)throw new Error('Felder');return out}
/* Zwischenspeicher der Rechnung (nur Hilfswerte, aus festen Daten): welche vorhanden sind. Die Lieferkettenrechnung legt einige an;
   bei Verwendung des Startspeichers werden genau diese in gleicher Reihenfolge angelegt. */
function swEcoMemo(){var L=[],SH=typeof WKL_SHARDS!=='undefined'?WKL_SHARDS:[],i,sh,m,r;
 function obj(t,s,O){if(!O)return;L.push(t+'|'+s);Object.keys(O).forEach(function(f){if(f==='clsB'&&O.clsB)L.push('clsB|'+t+'|'+s);else if(f==='lq'&&O.lq){L.push('lq0|'+t+'|'+s);O.lq.forEach(function(v,w){L.push('lq|'+t+'|'+s+'|'+(typeof w==='number'?'n':'s')+w)})}})}
 for(i=0;i<SH.length;i++){sh=SH[i];obj('BS',sh,V912BS[sh]);m=V1ZP.bm[sh];if(m&&m.Bm&&m.Bm!==m.B0)obj('BM',sh,m.Bm);else if(m)L.push('BMs|'+sh);
  if(V1ZP.ar[sh])L.push('AR|'+sh);if(V912AB[sh])L.push('AB|'+sh);r=V1ZC.ro[sh];if(r){L.push('RO|'+sh);if(r.f)L.push('ROF|'+sh)}if(wklGraphCache.has(sh))L.push('GC|'+sh)}
 if(V912FAC)L.push('FAC');if(V912VI)L.push('VI');if(wklIdx)L.push('IDX');return L}
function swEcoWarm(W){var i,p,O,w;for(i=0;i<W.length;i++){p=W[i].split('|');
 switch(p[0]){case 'BS':case 'BM':case 'BMs':case 'AR':case 'GC':v912Base(p[1]);break;case 'AB':v912AB(p[1]);break;case 'RO':v1zcRecIdx(p[1]);break;case 'ROF':v1zcFlat(p[1]);break;
  case 'FAC':v912Fac();break;case 'VI':v912VoidIdx();break;case 'IDX':wklIndex();break;
  case 'clsB':case 'lq0':case 'lq':O=p[1]==='BS'?V912BS[p[2]]:(V1ZP.bm[p[2]]||{}).Bm;if(!O)throw new Error('Basis '+p[2]);if(p[0]==='clsB')v912ClsB(O);else if(p[0]==='lq0'){if(!O.lq)O.lq=new Map()}else{w=p[3].slice(1);v912Loc(O,p[3][0]==='n'?Number(w):w)}break;
  default:throw new Error('Hilfswert '+p[0])}}}
/* Aufruf aus v1zcGet: {r} = vorberechnetes Ergebnis, {rec} = Aufzeichnung (Werkzeug), null = selbst rechnen */
function swEcoTake(k,init){var S=SWECO,t0=performance.now(),D,E,fp,r;
 if(window.SW_ECO_REC){if(!S.rec)S.rec={head:swEcoHead(),probe:swEcoProbe(),chromium:swEcoChromium(),e:[],fail:''};return {rec:true,k:k,fp:swEcoFp(k,init),init:swEcoInit(init),m0:swEcoMemo(),ms:performance.now()-t0}}
 if(!S.open||atlas.player)return null;
 if(!S.D){S.D=swEcoLoad();if(!S.D){swEcoClose(S.miss||'keine Werte');S.ms+=performance.now()-t0;return null}}
 D=S.D;E=D.e[S.used];
 if(!E||E.k!==k){swEcoClose('Reihenfolge');return null}
 if(swEcoInit(init)!==E.init){swEcoClose('Ausgangswerte');return null}
 fp=swEcoFp(k,init);if(fp!==E.fp){swEcoClose('Zustand');S.ms+=performance.now()-t0;return null}
 if(swEcoHash(swEcoMemo())!==E.m0){swEcoClose('Hilfswerte');S.ms+=performance.now()-t0;return null}
 try{swEcoWarm(E.warm)}catch(e){swEcoClose('Hilfswerte: '+(e&&e.message||e));S.ms+=performance.now()-t0;return null}
 if(swEcoHash(swEcoMemo())!==E.m1){swEcoClose('Hilfswerte danach');S.ms+=performance.now()-t0;return null}
 r=E.r;E.r=null;E.a=null;S.out.push(r);S.used++;
 /* wie am Ende von v1zcChain */
 V1ZC.cur=r;V912R=null;
 if(S.used>=D.e.length)swEcoClose('fertig');S.ms+=performance.now()-t0;return {r:r}}
function swEcoRec(R,c){var S=SWECO,E={k:R.k,fp:R.fp,init:R.init,keys:[],t:[],j:{},h:swEcoHash(c)},K=Object.keys(c),i,k,v,L,j,back,bufs=[];
 for(i=0;i<K.length;i++){k=K[i];v=c[k];L=v&&typeof v==='object'&&!Array.isArray(v)&&!ArrayBuffer.isView(v)?Object.keys(v):null;
  if(L&&L.length&&L.every(function(x){return ArrayBuffer.isView(v[x])&&SWECO_TA[v[x].constructor.name]===v[x].constructor})){E.keys.push([k,'c']);L.forEach(function(x){E.t.push([k,x,v[x].constructor.name,v[x].length]);bufs.push(v[x].slice())})}
  else{j=JSON.stringify(v);back=j===undefined?undefined:JSON.parse(j);if(swEcoHash(back)!==swEcoHash(v))S.rec.fail='nicht exakt speicherbar: '+k;E.keys.push([k,'j']);E.j[k]=back}}
 var m1=swEcoMemo(),s0=new Set(R.m0),s1=new Set(m1);E.warm=m1.filter(function(x){return !s0.has(x)});if(R.m0.some(function(x){return !s1.has(x)}))S.rec.fail='Hilfswerte entfernt';
 E.m0=swEcoHash(R.m0);E.m1=swEcoHash(m1);E.bufs=bufs;E.ms=R.ms;S.rec.e.push(E);S.out.push(c)}
