# -*- coding: utf-8 -*-
"""V11.00 · Stufe 6: Würfel, Protokoll, Würfelstil, Flüstern. Nur Programm (Atlasdaten unverändert).
Aufruf: python3 apply1100.py <Arbeitsstand_v10_99.html> <aus.html>; danach v1098/oeko_cache.py (Startspeicher neu).
Schriften für die Würfel (fonts/, SIL OFL 1.1) gehören nach gh-pages/medien/fonts/."""
import re,sys,os
HERE=os.path.dirname(os.path.abspath(__file__))
SRC,OUT=sys.argv[1:3]
s=open(SRC,encoding='utf-8').read()
s=re.sub(r'<script id="atlas-eco"[^>]*>.*?</script>\n?','',s,flags=re.S)
i=s.index('<script id="atlas-data" type="application/json">');j=s.index('</script>',i)
head,data,tail=s[:i],s[i:j],s[j:]
assert 'const V1100=' not in tail and 'const V1097=' in tail
js=open(os.path.join(HERE,'patch1100.js'),encoding='utf-8').read()
assert '</script' not in js.lower()
END='</script></body></html>';k=tail.rstrip().rfind(END);assert k>0
tail=tail[:k]+js+tail[k:]
b='<p><b>Spielerbögen Heere und Gebäude, Prüfstempel (V10.97):</b>'
assert head.count(b)==1
head=head.replace(b,'<p><b>Würfel und Flüstern (V11.00):</b> Unten rechts: <i>Würfel</i> (Anzahl, Art, Bonus, Wofür, Offen oder Für mich; bei W20 Normal/Vorteil/Nachteil; Protokoll mit Zusammensetzung beim Überfahren) und <i>Flüstern</i> (Spieler ↔ Spielleitung, ungelesene Nachrichten als Zahl; Nachrichten werden nach 90 Tagen gelöscht). In den Spielerbögen würfelt das Würfelsymbol neben einem Wert direkt (Anlass steht vor dem Ergebnis). Spielerbögen › Würfel: Farbe, Schrift, Bild und Animation der eigenen Würfel.</p>'+b)
open(OUT,'w',encoding='utf-8').write(head+data+tail);print('V11.00 eingebaut')
