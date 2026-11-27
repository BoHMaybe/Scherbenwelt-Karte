# -*- coding: utf-8 -*-
"""V10.97: Spielerbögen Heere/Gebäude, Prüfstempel. Aufruf: python3 apply97.py <v10_96.html> <online-Ordner> <v10_97.html>"""
import re,sys,json,os
SRC,D,OUT=sys.argv[1:4]
s=open(SRC,encoding='utf-8').read()
m=re.search(r'(<script id="atlas-data" type="application/json">)(.*?)(</script>)',s,re.S)
head,data,tail=s[:m.start(2)],m.group(2),s[m.end(2):];A=json.loads(data)
assert 'const V1097=' not in tail and 'const V1096=' in tail
# Besitzer: Orden der Roten Hand -> Blutaar (vom SL festgelegt)
assert any(a['id']=='CU-A01' for a in A['armies'])
A['sl7'].setdefault('owner',{})['CU-A01']='blutaar'
data=json.dumps(A,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
END='</script></body></html>';k=tail.rstrip().rfind(END);assert k>0
tail=tail[:k]+open(os.path.join(D,'patch1097.js'),encoding='utf-8').read()+tail[k:]
b='<p><b>Online-Abgleich (V10.96):</b>'
assert head.count(b)==1
head=head.replace(b,'<p><b>Spielerbögen Heere und Gebäude, Prüfstempel (V10.97):</b> <i>Heere</i>: In der SL-Fassung jedem Heer einen Besitzer zuweisen (Orden der Roten Hand: Blutaar). Der Spieler sieht seine Heere mit allen Werten, Qualitätsklasse und Lage am Heimatort und stellt Anträge (Werte, Miliz/Reserve, Sold/Nachschub, Verlegen, freier Antrag; bei regulären Heeren nur Verlegen und frei). Die SL genehmigt (die Änderung wird ins Heer übernommen und automatisch veröffentlicht) oder lehnt ab, jeweils mit optionalem Hinweis. <i>Gebäude</i>: eigener Bogen je Spieler ohne Wirkung auf die Wirtschaft; Menge und Gewinn folgen der Lage am Ort (Produktion, Lieferkette, Handel, Aufstand) und können bei schlechter Lage ins Minus gehen. <i>Prüfstempel</i>: Schiffe und Gebäude erhalten nach Prüfung „SL freigegeben“; jede spätere Änderung an Typ, Größe, Geschützen, Modulen bzw. Ort, Art, Ware, Stufe und Grundwerten nimmt den Stempel weg. Laufwerte, Name und Notizen sind frei. Freigaben liegen im SL-Repo und sind für Spieler nicht änderbar. Am Reiter zeigt die Zahl in Klammern offene Prüfungen.</p>'+b,1)
open(OUT,'w',encoding='utf-8').write(head+data+tail)
print('ok',round(len((head+data+tail).encode())/2**20,1),'MB')
