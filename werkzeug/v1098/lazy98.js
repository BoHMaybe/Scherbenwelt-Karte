/* V10.98 Punkt 6: Compendium-Seiten erst bei Bedarf lesen (nur Spieler-Webfassung; dort liegen die Seiten je Eintrag gepackt vor:
   „z0:“/„z1:“ + Base64 von Deflate(UTF-8-JSON); z1 = enthält „slbild:“, z0 = nicht; oder ungepackter JSON-Text „[…“).
   Beim Laden wird für jeden Eintrag ein Zugriff angelegt, der die Seiten beim ersten Lesen von „pages“ genau einmal
   entpackt und umwandelt (danach gewöhnliches Feld). Jede Stelle, die Seiten liest (Anzeige, Suche, Verweise, Wappen, Druck,
   Schwärzungen), erhält dieselben Daten wie bisher. Lokaler Arbeitsstand und SL-Fassung: Seiten liegen vollständig vor, hier geschieht nichts. */
var SWLAZY={n:0,p:0,P:JSON.parse,T:new WeakMap()};
function swLazyPages(a,txt){SWLAZY.T.set(a,txt);Object.defineProperty(a,'pages',{configurable:true,enumerable:true,
 get:function(){var v=SWLAZY.P.call(JSON,swLazyText(txt));SWLAZY.T.delete(a);Object.defineProperty(a,'pages',{value:v,writable:true,enumerable:true,configurable:true});SWLAZY.p++;txt=null;return v},
 set:function(x){swLazySet(a,x)}})}
function swLazyText(t){if(t.charAt(0)==='[')return t;var bin=atob(t.slice(3)),u=new Uint8Array(bin.length),i;for(i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new TextDecoder('utf-8',{fatal:true}).decode(SWECO.inflate(u))}
function swLazyIs(x){return typeof x==='string'&&(x.charAt(0)==='['||/^z[01]:/.test(x))}
/* true, wenn die Seiten des Eintrags noch als Text vorliegen und der Text die Zeichenfolge nicht enthält (dann kann sie in keinem Feld der Seiten stehen) */
function swLazyNo(a,s){var t=SWLAZY.T.get(a),d=a&&Object.getOwnPropertyDescriptor(a,'pages');if(typeof t!=='string'||!d||typeof d.get!=='function')return false;if(t.charAt(0)==='[')return t.indexOf(s)<0;return s==='slbild:'&&t.charAt(1)==='0'}
function swLazySet(a,x){SWLAZY.T.delete(a);if(swLazyIs(x))swLazyPages(a,x);else Object.defineProperty(a,'pages',{value:x,writable:true,enumerable:true,configurable:true})}
(function(){var P=JSON.parse;JSON.parse=function(t,r){var o=P.call(JSON,t,r),L,i,a;
 if(typeof t==='string'&&t.length>1000000&&o&&typeof o==='object'&&Array.isArray(o.maps)&&o.compendium&&Array.isArray(o.compendium.articles)){L=o.compendium.articles;
  for(i=0;i<L.length;i++){a=L[i];if(a&&swLazyIs(a.pages)){swLazyPages(a,a.pages);SWLAZY.n++}}}
 return o}})();
