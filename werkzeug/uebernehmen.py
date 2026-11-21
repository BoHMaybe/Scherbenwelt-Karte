# -*- coding: utf-8 -*-
"""Gebaute Web-Fassung in den Zweig gh-pages übernehmen.
Aufruf: python3 uebernehmen.py <gebauter Ordner> <Arbeitskopie gh-pages>
Übernimmt index.html, .nojekyll und den Ordner a/ (veraltete Dateien in a/ werden gelöscht).
Die Ordner panorama/ und darstellung/ und alle übrigen Dateien bleiben unberührt."""
import os,sys,shutil,filecmp
SRC,DST=sys.argv[1],sys.argv[2]
assert os.path.isfile(os.path.join(SRC,'index.html')),'index.html fehlt im gebauten Ordner'
assert os.path.isdir(os.path.join(DST,'.git')) or os.path.isfile(os.path.join(DST,'.git')),'Ziel ist keine Git-Arbeitskopie'
for f in ('index.html','.nojekyll'): shutil.copy2(os.path.join(SRC,f),os.path.join(DST,f))
sa,da=os.path.join(SRC,'a'),os.path.join(DST,'a');os.makedirs(da,exist_ok=True)
new=set(os.listdir(sa));old=set(os.listdir(da));add=rm=0
for f in new-old: shutil.copy2(os.path.join(sa,f),os.path.join(da,f));add+=1
for f in old-new: os.remove(os.path.join(da,f));rm+=1
for f in new&old:
    if not filecmp.cmp(os.path.join(sa,f),os.path.join(da,f),shallow=False): shutil.copy2(os.path.join(sa,f),os.path.join(da,f));add+=1
print('übernommen: index.html, a/ +%d -%d, panorama/ und darstellung/ unberührt'%(add,rm))
