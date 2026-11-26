# -*- coding: utf-8 -*-
"""Gebaute Web-Fassung in den Zweig gh-pages übernehmen.
Aufruf: python3 uebernehmen.py <gebauter Ordner> <Arbeitskopie gh-pages>
Übernimmt .nojekyll, index.html (nur solange keine Login-Hülle dort liegt) und den Ordner a/ (veraltete Dateien in a/ werden gelöscht) sowie neue Dateien in bilder/ (dort wird nie gelöscht).
Die Ordner panorama/ und darstellung/ und alle übrigen Dateien bleiben unberührt."""
import os,sys,shutil,filecmp
SRC,DST=sys.argv[1],sys.argv[2]
assert os.path.isfile(os.path.join(SRC,'index.html')),'index.html fehlt im gebauten Ordner'
assert os.path.isdir(os.path.join(DST,'.git')) or os.path.isfile(os.path.join(DST,'.git')),'Ziel ist keine Git-Arbeitskopie'
# Seit der Anmeldung (V10.95) ist gh-pages/index.html die Login-Hülle: die Spielerfassung NICHT unverschlüsselt dorthin kopieren.
# Die Spielerfassung kommt verschlüsselt über login_bauen.py (… live) nach daten/spieler.bin – danach immer ausführen.
di=os.path.join(DST,'index.html');LOGIN=os.path.exists(di) and 'Login-Hülle' in open(di,encoding='utf-8',errors='ignore').read(200000)
for f in ('.nojekyll',)+(() if LOGIN else ('index.html',)): shutil.copy2(os.path.join(SRC,f),os.path.join(DST,f))
if LOGIN: print('index.html ist die Login-Hülle und bleibt; jetzt login_bauen.py <webdir/index.html> <Arbeitsstand> <gh-pages> <scherbenwelt-sl> live ausführen')
sa,da=os.path.join(SRC,'a'),os.path.join(DST,'a');os.makedirs(da,exist_ok=True)
new=set(os.listdir(sa));old=set(os.listdir(da));add=rm=0
for f in new-old: shutil.copy2(os.path.join(sa,f),os.path.join(da,f));add+=1
for f in old-new: os.remove(os.path.join(da,f));rm+=1
for f in new&old:
    if not filecmp.cmp(os.path.join(sa,f),os.path.join(da,f),shallow=False): shutil.copy2(os.path.join(sa,f),os.path.join(da,f));add+=1
sb,db=os.path.join(SRC,'bilder'),os.path.join(DST,'bilder');nb=0
if os.path.isdir(sb):   # bilder/: nur hinzufügen, nie löschen (auch Bilder, die nur der Arbeitsstand verwendet, z. B. geschwärzte)
    os.makedirs(db,exist_ok=True)
    for f in os.listdir(sb):
        if not os.path.exists(os.path.join(db,f)): shutil.copy2(os.path.join(sb,f),os.path.join(db,f));nb+=1
print('übernommen: '+('' if LOGIN else 'index.html, ')+'a/ +%d -%d, bilder/ +%d (nichts gelöscht), panorama/ und darstellung/ unberührt'%(add,rm,nb))
