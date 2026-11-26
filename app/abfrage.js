/* Scherbenwelt Atlas · Abfrage auf neue Fassungen (V10.95, Stufe 2b).
   Liest den Zeitplan (scherbenwelt-sl/steuerung/zeitplan.json, Zeitzone Europe/Berlin) und fragt im jeweiligen Takt
   scherbenwelt-sl/steuerung/stand.json ab. Ist eine neuere Fassung hochgeladen, erscheint oben ein Hinweis zum Neuladen.
   Bedingte Abfragen (ETag): unveränderte Antworten (304) zählen nicht gegen das GitHub-Abfragekontingent.
   Im Hintergrund (Tab nicht sichtbar) wird nicht abgefragt; beim Zurückkehren wird nachgeholt, falls fällig. */
(function(){
var L=window.SW_LOGIN;if(!L||window.SW_ABFRAGE)return;
var API='https://api.github.com/repos/BoHMaybe/scherbenwelt-sl/contents/steuerung/';
var DEF={zeitzone:'Europe/Berlin',abschnitte:[{von:'So 22:00',bis:'Fr 15:00',takt:'täglich'},{von:'Fr 15:00',bis:'Sa 14:00',sekunden:60},{von:'Sa 14:00',bis:'So 02:00',sekunden:20},{von:'So 02:00',bis:'So 22:00',sekunden:60}]};
var TAG={So:0,Mo:1,Di:2,Mi:3,Do:4,Fr:5,Sa:6},EN={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
var A=window.SW_ABFRAGE={plan:DEF,last:Date.now(),planAt:0,timer:null,neu:false,fehler:0,letzte:null};
function woche(){try{var p={};new Intl.DateTimeFormat('en-GB',{timeZone:A.plan.zeitzone||'Europe/Berlin',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).forEach(function(x){p[x.type]=x.value});
 return EN[p.weekday]*1440+(+p.hour%24)*60+(+p.minute)}catch(e){var d=new Date();return d.getDay()*1440+d.getHours()*60+d.getMinutes()}}
function zeit(s){var m=/^\s*(So|Mo|Di|Mi|Do|Fr|Sa)\s+(\d{1,2}):(\d{2})\s*$/.exec(s||'');return m?TAG[m[1]]*1440+(+m[2])*60+(+m[3]):null}
function takt(){var t=woche(),ab=(A.plan&&A.plan.abschnitte)||DEF.abschnitte;
 for(var i=0;i<ab.length;i++){var a=ab[i],v=zeit(a.von),b=zeit(a.bis);if(v==null||b==null)continue;
  if(v<b?(t>=v&&t<b):(t>=v||t<b))return a.takt==='täglich'?86400:Math.max(10,+a.sekunden||60)}
 return 60}
function get(n){return fetch(API+n,{cache:'no-cache',headers:{Authorization:'Bearer '+((L.tokens||{}).sl||''),Accept:'application/vnd.github.raw+json'}}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})}
function hinweis(){if(A.neu)return;A.neu=true;var d=document.createElement('div');d.id='swNeu';
 d.style.cssText='position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:9500;background:#1f1b16;color:#f6e7c4;border:1px solid #c9a24a;border-radius:8px;padding:8px 12px;font:14px system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.5);display:flex;gap:10px;align-items:center;max-width:calc(100vw - 32px)';
 var s=document.createElement('span');s.textContent='Neue Atlas-Fassung verfügbar.';var b=document.createElement('button');b.textContent='Neu laden';
 b.style.cssText='font:600 14px system-ui,sans-serif;background:#c9a24a;color:#1b1712;border:0;border-radius:5px;padding:6px 10px;cursor:pointer';b.onclick=function(){location.reload()};
 var x=document.createElement('button');x.textContent='Später';x.style.cssText='font:14px system-ui,sans-serif;background:none;color:#c9b48a;border:1px solid #6b5a3a;border-radius:5px;padding:6px 10px;cursor:pointer';x.onclick=function(){d.remove()};
 d.appendChild(s);d.appendChild(b);d.appendChild(x);document.body.appendChild(d)}
function pruefen(){A.last=Date.now();var p=(Date.now()-A.planAt>3600000)?get('zeitplan.json').then(function(z){if(z&&z.abschnitte)A.plan=z;A.planAt=Date.now()}).catch(function(){}):Promise.resolve();
 return p.then(function(){return get('stand.json')}).then(function(s){A.fehler=0;A.letzte=new Date();if(L.rolle==='sl'){if(s.sl&&L.stand&&s.sl!==L.stand)hinweis()}else if(s.spieler&&L.stand&&(s.spieler!==L.stand||(s.spieler_v||0)>(L.v||0)))hinweis()})
  .catch(function(){A.fehler++;if(L.rolle!=='sl')return fetch((L.root||'')+'daten/stand.json',{cache:'no-store'}).then(function(r){return r.json()}).then(function(s){if(s.stand&&L.stand&&s.stand!==L.stand)hinweis()}).catch(function(){})})}
function schritt(){clearTimeout(A.timer);var iv=takt()*1000;
 if(!document.hidden&&!A.neu&&Date.now()-A.last>=iv)pruefen();
 A.timer=setTimeout(schritt,Math.min(iv,60000))}
document.addEventListener('visibilitychange',function(){if(!document.hidden)schritt()});
get('zeitplan.json').then(function(z){if(z&&z.abschnitte)A.plan=z;A.planAt=Date.now()}).catch(function(){}).then(schritt);
})();
