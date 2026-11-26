/* Scherbenwelt · Änderungslisten (V10.96). Gleiche Logik wie ops.py.
   Pfad: Liste aus Schlüsseln (Text), Positionen (Zahl) und {id:…} für Listen aus Objekten mit eindeutiger id.
   Op: {p:[…],v:Wert} setzt/ergänzt, {p:[…],d:1} löscht. */
function swOpsTyp(x){return x===null?'n':Array.isArray(x)?'a':typeof x==='object'?'o':typeof x}
function swOpsIds(a){if(!a.length)return false;const s=new Set();for(const x of a){if(!x||typeof x!=='object'||Array.isArray(x))return false;const t=typeof x.id;if(t!=='string'&&t!=='number')return false;if(s.has(x.id))return false;s.add(x.id)}return true}
function swOpsDiff(a,b,p,out){if(a===b)return out;const ta=swOpsTyp(a),tb=swOpsTyp(b);
 if(ta!==tb){out.push({p:p,v:b});return out}
 if(ta==='o'){for(const k of Object.keys(a))if(!Object.prototype.hasOwnProperty.call(b,k))out.push({p:p.concat([k]),d:1});
  for(const k of Object.keys(b)){if(!Object.prototype.hasOwnProperty.call(a,k))out.push({p:p.concat([k]),v:b[k]});else swOpsDiff(a[k],b[k],p.concat([k]),out)}return out}
 if(ta==='a'){if(swOpsIds(a)&&swOpsIds(b)){const ma=new Map(a.map(x=>[x.id,x])),mb=new Set(b.map(x=>x.id));
   for(const x of a)if(!mb.has(x.id))out.push({p:p.concat([{id:x.id}]),d:1});
   for(const x of b){if(!ma.has(x.id))out.push({p:p.concat([{id:x.id}]),v:x});else swOpsDiff(ma.get(x.id),x,p.concat([{id:x.id}]),out)}return out}
  if(a.length===b.length){for(let i=0;i<a.length;i++)swOpsDiff(a[i],b[i],p.concat([i]),out);return out}
  out.push({p:p,v:b});return out}
 if(ta==='number'&&tb==='number'&&isNaN(a)&&isNaN(b))return out;
 out.push({p:p,v:b});return out}
function swOpsSeg(c,s){if(c===null||typeof c!=='object')return {ok:false};
 if(s!==null&&typeof s==='object'){if(!Array.isArray(c))return {ok:false};const i=c.findIndex(x=>x&&typeof x==='object'&&x.id===s.id);return {ok:true,arr:true,i:i,id:true}}
 if(typeof s==='number'){if(!Array.isArray(c))return {ok:false};return {ok:true,arr:true,i:s}}
 if(Array.isArray(c))return {ok:false};return {ok:true,arr:false,k:s}}
function swOpsApply1(root,op){const p=op.p;if(!Array.isArray(p)||!p.length)return false;let c=root;
 for(let j=0;j<p.length-1;j++){const r=swOpsSeg(c,p[j]);if(!r.ok)return false;if(r.arr){if(r.i<0||r.i>=c.length)return false;c=c[r.i]}else{if(!Object.prototype.hasOwnProperty.call(c,r.k))return false;c=c[r.k]}}
 const r=swOpsSeg(c,p[p.length-1]);if(!r.ok)return false;const v=op.d?undefined:JSON.parse(JSON.stringify(op.v===undefined?null:op.v));
 if(r.arr){if(op.d){if(r.i>=0&&r.i<c.length)c.splice(r.i,1);return true}if(r.i>=0&&r.i<c.length)c[r.i]=v;else if(r.id||r.i===c.length)c.push(v);else return false;return true}
 if(op.d){delete c[r.k];return true}c[r.k]=v;return true}
function swOpsApply(root,ops){let n=0;for(const op of ops||[])if(swOpsApply1(root,op))n++;return n}
function swOpsSegEq(a,b){if(a!==null&&typeof a==='object')return b!==null&&typeof b==='object'&&a.id===b.id;return a===b}
function swOpsPrefix(pre,p){if(pre.length>p.length)return false;for(let i=0;i<pre.length;i++)if(!swOpsSegEq(pre[i],p[i]))return false;return true}
/* neue Ops anhängen; ältere Ops, deren Pfad unter einem neuen Pfad liegt, entfallen (werden überschrieben) */
function swOpsMerge(list,neu){let L=list.slice();for(const o of neu){L=L.filter(x=>!swOpsPrefix(o.p,x.p));L.push(o)}return L}
