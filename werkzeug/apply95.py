# -*- coding: utf-8 -*-
"""V10.95: Hauptreiter Spielerbögen (Schiffe, online je Spieler). Aufruf: python3 apply95.py <v10_94.html> <patch1095.js> <v10_95.html>"""
import re,sys,json
SRC,PATCH,OUT=sys.argv[1:4]
s=open(SRC,encoding='utf-8').read()
m=re.search(r'(<script id="atlas-data" type="application/json">)(.*?)(</script>)',s,re.S)
head,data,tail=s[:m.start(2)],m.group(2),s[m.end(2):]
json.loads(data)
def rep(old,new,n=1,cnt=None):
    global tail
    c=tail.count(old);assert c==(cnt if cnt else n),(old[:70],c);tail=tail.replace(old,new)
# 1) Schiffsbogen-Unterreiter aus Tabellen entfernen
i=tail.find("{const _t=v914Tabs;v914Tabs=function(){let h=_t.apply(this,arguments);const on=V911.tab==='ship';")
j=tail.find("</button>')}}",i);assert i>0 and j>i and j-i<700;tail=tail[:i]+"/* V10.95: Schiffsbogen steht unter dem Hauptreiter „Spielerbögen“ (nicht mehr unter Tabellen) */"+tail[j+len("</button>')}}"):]
# 2) Wrapper und Ereignisse auf Spielerbögen umstellen
rep("if(el&&V911.tab==='ship'&&V1M.top!=='journal'){v1086Render(el);return}","if(el&&v1095IsShip()){v1086Render(el);return}")
c=tail.count("V911.tab!=='ship'");assert c>=6,c;tail=tail.replace("V911.tab!=='ship'","!v1095IsShip()")
assert "V911.tab==='ship'" not in tail.replace("if(typeof V911!=='undefined'&&V911.tab==='ship')","")
# 3) Online-Bestand nie in die Spielerdatei
rep("if(r.compendium)v9cPlayer(r);v7Player(r);v9bExportPlayer(r);return r}","if(r.compendium)v9cPlayer(r);v7Player(r);v9bExportPlayer(r);delete r.online;return r}")
# 4) Patch anhängen
END='</script></body></html>';k=tail.rstrip().rfind(END);assert k>0
assert 'const V1095=' not in tail
tail=tail[:k]+open(PATCH,encoding='utf-8').read()+tail[k:]
# 5) Hilfe
b='<p><b>Tabellen · Schiffsbogen (V10.86'
assert head.count(b)==1 and tail.count(b)==0
head=head.replace(b,'<p><b>Spielerbögen (V10.95):</b> Eigener Hauptreiter neben Tabellen; Unterreiter <i>Schiffe</i> (weitere Bögen wie Heere und Gebäude folgen). Der Schiffsbogen steht jetzt hier statt unter Tabellen. Im Web-Atlas mit Anmeldung legt jeder Spieler beliebig viele Schiffe an, bearbeitet und löscht sie; gespeichert wird im privaten Speicher des Spielers (automatisch kurz nach jeder Änderung oder mit „Jetzt speichern“), andere Spieler sehen sie nicht. Spielleitung: oben den Spieler wählen, ansehen, bearbeiten, löschen; „Eigene Bögen“ liegen nur im Browser; „Online-Stand übernehmen“ legt alle Spielerschiffe im Arbeitsstand ab (dauerhaft mit „Arbeitsstand speichern“, nie in der Spielerdatei). Im lokal geöffneten Arbeitsstand dafür einmal den SL-Schlüssel eingeben.</p>'+b,1)
open(OUT,'w',encoding='utf-8').write(head+data+tail)
print('ok',round(len((head+data+tail).encode())/2**20,1),'MB')
