# -*- coding: utf-8 -*-
"""V10.96: Online-Abgleich (automatisch). Aufruf: python3 apply96.py <v10_95.html> <online-Ordner> <v10_96.html>"""
import re,sys,json,os
SRC,D,OUT=sys.argv[1:4]
s=open(SRC,encoding='utf-8').read()
m=re.search(r'(<script id="atlas-data" type="application/json">)(.*?)(</script>)',s,re.S)
head,data,tail=s[:m.start(2)],m.group(2),s[m.end(2):];json.loads(data)
assert 'function swOpsDiff' not in s
def rep(old,new):
    global tail
    assert tail.count(old)==1,(old[:70],tail.count(old));tail=tail.replace(old,new)
r=lambda f:open(os.path.join(D,f),encoding='utf-8').read()
rep('<script id="atlas-app">','<script id="atlas-ops">\n'+r('ops.js')+'\n'+r('hook1096.js')+'</script>\n<script id="atlas-app">')
rep("const doc=new DOMParser().parseFromString('<!doctype html>'+originalDocument,'text/html');","const doc=new DOMParser().parseFromString('<!doctype html>'+originalDocument,'text/html');doc.querySelectorAll('[data-sw]').forEach(e=>e.remove());")
rep("delete r.online;return r}","delete r.online;delete r.onlineImport;return r}")
END='</script></body></html>';k=tail.rstrip().rfind(END);assert k>0
tail=tail[:k]+r('patch1096.js')+tail[k:]
b='<p><b>Spielerbögen (V10.95):</b>'
assert head.count(b)==1
head=head.replace(b,'<p><b>Online-Abgleich (V10.96):</b> In der SL-Fassung des Web-Atlas wird jede inhaltliche Änderung (Heere, Freischaltungen, Schwärzungen, Labels, Quests, Reisejournal, POIs …) automatisch erkannt, nach etwa 10 Sekunden online gespeichert und etwa 2 Minuten nach der letzten Änderung für die Spieler veröffentlicht (Durchlauf auf GitHub, einige Minuten; danach sehen die Spieler „Neue Atlas-Fassung verfügbar“). Statuszeile unten: gespeichert, Veröffentlichung läuft, für Spieler sichtbar. „Veröffentlichung pausieren“: es wird weiter gespeichert, aber nichts an die Spieler gegeben, bis der Schalter gelöst ist. Ansichtseinstellungen werden nicht übertragen. Lokal geöffneter Arbeitsstand mit SL-Schlüssel: offene Online-Änderungen werden beim Öffnen automatisch übernommen, wenn die Datei der veröffentlichte Stand ist; dauerhaft mit „Arbeitsstand speichern“. Sonst übernimmt Claude sie beim nächsten Hochladen; bei Widerspruch gewinnt der Arbeitsstand.</p>'+b,1)
open(OUT,'w',encoding='utf-8').write(head+data+tail)
print('ok',round(len((head+data+tail).encode())/2**20,1),'MB')
