/* Scherbenwelt Atlas · Service Worker (V10.95). Nur für die App-Installation; leitet nichts um und speichert nichts
   (der Atlas wird von der Anmeldeseite selbst im Gerätespeicher gehalten). */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
