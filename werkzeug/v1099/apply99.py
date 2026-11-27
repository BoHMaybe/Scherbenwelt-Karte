# -*- coding: utf-8 -*-
"""Scherbenwelt · V10.99: kleine Korrekturen (nur Programm/Darstellung, keine Daten).
Aufruf: python3 apply99.py <Arbeitsstand_v10_98.html> <aus.html>
1. Reisejournal: Überschrift des Bereichs zeigt „Reisejournal“ statt „Tabellen“.
2. iPhone/Handy (Touch-Darstellung, Breite ≤ 560 px): Reiterleiste bricht in zwei Zeilen um, alle Reiter ohne Wischen erreichbar.
Danach: v1098/oeko_cache.py (Startspeicher neu aufzeichnen, da das Programm geändert ist)."""
import sys,re
IN,OUT=sys.argv[1:3]
s=open(IN,encoding='utf-8').read()
s=re.sub(r'<script id="atlas-eco"[^>]*>.*?</script>\n?','',s,flags=re.S)
def rep(a,b,n=1):
    global s;c=s.count(a);assert c==n,(a[:70],c);s=s.replace(a,b)
rep("const h=document.querySelector('#tablesView h2');if(h&&V1M.top!=='journal')h.textContent=b?'Spielerbögen':'Tabellen'",
    "const h=document.querySelector('#tablesView h2');if(h)h.textContent=V1M.top==='journal'?'Reisejournal':b?'Spielerbögen':'Tabellen'")
i=s.index('</head>');assert i<s.index('<script id="atlas-data"')
s=s[:i]+'<style id="v1099css">@media (max-width:560px){html.v1t header nav.apptabs{flex-wrap:wrap;overflow-x:visible;row-gap:0}}</style>\n'+s[i:]
open(OUT,'w',encoding='utf-8').write(s);print('V10.99 eingebaut')
