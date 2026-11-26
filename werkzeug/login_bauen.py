# -*- coding: utf-8 -*-
"""V10.95 · Login-Fassung bauen (Stufe 2a).
Aufruf: python3 login_bauen.py <webdir/index.html> <Arbeitsstand.html> <gh-pages-Arbeitskopie> <scherbenwelt-sl-Arbeitskopie> [ziel]
  ziel = test (Standard: Hülle nach gh-pages/test/index.html, Live-index.html bleibt unberührt)
       | live (Hülle ersetzt gh-pages/index.html; erst nach Freigabe durch den SL)
Erzeugt:
  gh-pages/daten/spieler.bin   AES-256-GCM (IV 12 Byte + Chiffrat) der gzip-komprimierten Spieler-Webfassung
  gh-pages/daten/stand.json    {stand, pruef}  (pruef = Kennung des Datenschlüssels, verrät ihn nicht)
  sl/sl/teile/                 gzip des Arbeitsstands in Teilen zu 2 MB + index.json (privates Repo, nur mit SL-Schlüssel)
  sl/zugang/spielerschluessel.txt  Datenschlüssel (Base64). Wird einmal erzeugt und danach wiederverwendet,
                                   damit bestehende Zugänge gültig bleiben.
Die Datei zugang/zugaenge.json erzeugt das Zugangswerkzeug (Zugangswerkzeug.html) – sie wird hier nicht verändert."""
import sys,os,gzip,json,base64,hashlib,secrets
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
WEB,ARB,PUB,SL=sys.argv[1:5];ZIEL=sys.argv[5] if len(sys.argv)>5 else 'test'
assert ZIEL in('test','live')
HERE=os.path.dirname(os.path.abspath(__file__))
web=open(WEB,'rb').read();arb=open(ARB,'rb').read()
assert b'slbild:' not in web or not __import__('re').search(rb'slbild:[0-9a-f]{16}\.',web),'SL-Bildverweis in Spielerfassung'
assert b'id="atlas-data"' in web and b'id="atlas-data"' in arb
# Datenschlüssel
kf=os.path.join(SL,'zugang','spielerschluessel.txt');os.makedirs(os.path.dirname(kf),exist_ok=True)
if os.path.exists(kf): key=base64.b64decode(open(kf).read().strip())
else:
    key=secrets.token_bytes(32);open(kf,'w').write(base64.b64encode(key).decode()+'\n');print('neuer Datenschlüssel erzeugt')
assert len(key)==32
pruef=hashlib.sha256(b'scherbenwelt-pruef'+key).hexdigest()[:12]
# Spielerdaten verschlüsseln
gz=gzip.compress(web,9,mtime=0);iv=secrets.token_bytes(12)
os.makedirs(os.path.join(PUB,'daten'),exist_ok=True)
open(os.path.join(PUB,'daten','spieler.bin'),'wb').write(iv+AESGCM(key).encrypt(iv,gz,None))
stand=hashlib.sha1(web).hexdigest()[:12]
json.dump({'stand':stand,'pruef':pruef},open(os.path.join(PUB,'daten','stand.json'),'w'))
# SL-Fassung
# in Teile zu 2 MB (GitHub bricht API-Abrufe nach etwa 10 s ab; große Einzeldatei scheitert mobil)
TD=os.path.join(SL,'sl','teile');os.makedirs(TD,exist_ok=True)
for f in os.listdir(TD): os.remove(os.path.join(TD,f))
alt=os.path.join(SL,'sl','arbeitsstand.html.gz')
if os.path.exists(alt): os.remove(alt)
sgz=gzip.compress(arb,6,mtime=0);T=2*2**20;n=0
for i in range(0,len(sgz),T): open(os.path.join(TD,'a%03d.bin'%n),'wb').write(sgz[i:i+T]);n+=1
json.dump({'teile':n,'groesse':len(sgz),'sha1':hashlib.sha1(sgz).hexdigest(),'stand':hashlib.sha1(arb).hexdigest()[:12]},open(os.path.join(TD,'index.json'),'w'))
# Hülle
h=open(os.path.join(HERE,'login_huelle.html'),encoding='utf-8').read()
assert h.count("'__ROOT__'")==1
if ZIEL=='test':
    os.makedirs(os.path.join(PUB,'test'),exist_ok=True);out=os.path.join(PUB,'test','index.html');h=h.replace("'__ROOT__'","'../'")
else:
    out=os.path.join(PUB,'index.html');h=h.replace("'__ROOT__'","'./'")
open(out,'w',encoding='utf-8').write(h)
zf=os.path.join(PUB,'zugang','zugaenge.json')
mb=lambda p:os.path.getsize(p)/2**20
print('spieler.bin %.1f MB · SL %.1f MB in %d Teilen · Hülle %s · stand %s · pruef %s · zugaenge.json %s'%(
    mb(os.path.join(PUB,'daten','spieler.bin')),len(sgz)/2**20,n,out,stand,pruef,'vorhanden' if os.path.exists(zf) else 'fehlt (Zugangswerkzeug)'))

