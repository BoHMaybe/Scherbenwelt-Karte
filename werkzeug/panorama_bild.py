# -*- coding: utf-8 -*-
"""Panoramabild für die Web-Karte aufbereiten und ablegen.
Aufruf: python3 panorama_bild.py <Bilddatei> <Siedlungs-ID> <Arbeitskopie gh-pages> [Breite=2400]
Ergebnis: panorama/<SIEDLUNGS-ID>.webp (Kennung in Großbuchstaben, WebP, höchstens 2400 px breit, Ziel 200-400 KB)."""
import sys,os,io,re
from PIL import Image,ImageOps
src,sid,dst=sys.argv[1],sys.argv[2].strip().upper(),sys.argv[3];W=int(sys.argv[4]) if len(sys.argv)>4 else 2400
assert re.fullmatch(r'[A-Z]{2,4}-[A-Z0-9-]+',sid),'Siedlungs-ID unplausibel: '+sid
im=ImageOps.exif_transpose(Image.open(src)).convert('RGB')
if im.width>W: im=im.resize((W,round(im.height*W/im.width)),Image.LANCZOS)
q=82
while True:
    b=io.BytesIO();im.save(b,'WEBP',quality=q,method=6)
    if b.tell()<=400*1024 or q<=60: break
    q-=6
os.makedirs(os.path.join(dst,'panorama'),exist_ok=True)
for f in os.listdir(os.path.join(dst,'panorama')):
    if os.path.splitext(f)[0].upper()==sid and f!=sid+'.webp': os.remove(os.path.join(dst,'panorama',f));print('ersetzt:',f)
p=os.path.join(dst,'panorama',sid+'.webp');open(p,'wb').write(b.getvalue())
print('%s  %dx%d  %d KB  Qualität %d'%(p,im.width,im.height,b.tell()//1024,q))
