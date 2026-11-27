# -*- coding: utf-8 -*-
"""Scherbenwelt · V10.98 Punkte 4 und 6: Programmteile einbauen (nur Programm, keine Daten).
Aufruf: python3 oeko98_einbauen.py <Arbeitsstand_ein.html> <Arbeitsstand_aus.html>
- oeko98.js (mit fflate 0.8.2 inflateSync, MIT) an den Anfang von <script id="atlas-ops">
- v1zcGet: vor der eigenen Rechnung swEcoTake() fragen; sonst unverändert rechnen (bei Aufzeichnung swEcoRec).
- lazy98.js (Punkt 6): Compendium-Seiten als Text (nur Spieler-Webfassung, build.py) erst bei Bedarf umwandeln; vor hook1096."""
import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
IN,OUT=sys.argv[1:3]
s=open(IN,encoding='utf-8').read()
assert 'function swEcoTake' not in s,'Startspeicher bereits eingebaut'
js=open(os.path.join(HERE,'oeko98.js'),encoding='utf-8').read()
ff=open(os.path.join(HERE,'fflate-0.8.2.umd.js'),encoding='utf-8').read()
assert '</script' not in ff.lower() and '<!--' not in ff
lic='/* fflate 0.8.2 – MIT License – Copyright (c) 2023 Arjun Barrett – https://github.com/101arrowz/fflate */\n'
js=js.replace('@@FFLATE@@',lic+ff.strip())
lz=open(os.path.join(HERE,'lazy98.js'),encoding='utf-8').read()
js=js+'\n'+lz
assert '</script' not in js.lower() and '<script' not in js.lower()
a='<script id="atlas-ops">\n';assert s.count(a)==1;s=s.replace(a,a+js+'\n')
old='function v1zcGet(k,init){if(V1ZC.cache.has(k))return V1ZC.cache.get(k);const c=v1zcChain(init);V1ZC.cache.set(k,c);'
new=("function v1zcGet(k,init){if(V1ZC.cache.has(k))return V1ZC.cache.get(k);let _w=null;try{_w=typeof swEcoTake==='function'?swEcoTake(k,init):null}catch(e){_w=null;try{swEcoClose('Fehler')}catch(e2){}}"
     "let c;if(_w&&_w.r)c=_w.r;else{c=v1zcChain(init);if(_w&&_w.rec)try{swEcoRec(_w,c)}catch(e){if(SWECO.rec)SWECO.rec.fail=String(e&&e.message||e)}}V1ZC.cache.set(k,c);")
assert s.count(old)==1,('v1zcGet',s.count(old));s=s.replace(old,new)
# Punkt 6: SL-Bildsuche (V10.94) prüft noch nicht gelesene Compendium-Seiten am Text (enthält er „slbild:“ nicht, steht dort kein SL-Bild)
old="for(const a of (atlas.compendium&&atlas.compendium.articles)||[])for(const p of a.pages||[])for(const b of p.blocks||[])if(b.t==='img'&&typeof b.src==='string'&&b.src.startsWith('slbild:'))L.add(b.src.slice(7));"
new="for(const a of (atlas.compendium&&atlas.compendium.articles)||[])if(!(typeof swLazyNo==='function'&&swLazyNo(a,'slbild:')))for(const p of a.pages||[])for(const b of p.blocks||[])if(b.t==='img'&&typeof b.src==='string'&&b.src.startsWith('slbild:'))L.add(b.src.slice(7));"
assert s.count(old)==1,('v1094Refs',s.count(old));s=s.replace(old,new)
open(OUT,'w',encoding='utf-8').write(s)
print('Startspeicher-Programm eingebaut:',round(len(s)/2**20,1),'MB')
