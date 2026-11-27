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
import sys,os,gzip,json,base64,hashlib,secrets,re
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
WEB,ARB,PUB,SL=sys.argv[1:5];ZIEL=sys.argv[5] if len(sys.argv)>5 else 'test'
assert ZIEL in('test','live')
HERE=os.path.dirname(os.path.abspath(__file__))
web=open(WEB,'rb').read();arb=open(ARB,'rb').read()
assert b'slbild:' not in web or not __import__('re').search(rb'slbild:[0-9a-f]{16}\.',web),'SL-Bildverweis in Spielerfassung'
assert b'id="atlas-data"' in web and b'id="atlas-data"' in arb
# V10.98: alle Verweise auf medien/ müssen auf der Webseite liegen (Musik, Krankheitsstudien)
_mref=set(re.findall(rb'medien/([0-9a-f]{16}\.(?:mp3|webp|jpg|png))',web+arb))
_mfehlt=[x.decode() for x in _mref if not os.path.exists(os.path.join(PUB,'medien',x.decode()))]
assert not _mfehlt,('medien/ fehlt auf der Webseite',_mfehlt[:5])
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
# SL-Webfassung: eingebettete Musik/Bilder ab 20 KB, die bereits öffentlich in gh-pages/a/ liegen, durch Verweise ersetzen
# (weniger Speicher im Browser, v. a. iPhone). Nicht öffentliche Einbettungen bleiben eingebettet. Arbeitsstand selbst unverändert.
import re
def slweb(b):
    t=b.decode('utf-8');m=re.search(r'(<script id="atlas-data" type="application/json">)(.*?)(</script>)',t,re.S)
    hd,raw,tl=t[:m.start(2)],m.group(2),t[m.end(2):]
    AD=os.path.join(PUB,'a');pa={f.split('.')[0]:f for f in os.listdir(AD)} if os.path.isdir(AD) else {}
    st={'ref':0,'mb':0.0,'eingebettet':0}
    def rep(mm):
        x=mm.group(2)
        if len(x)<20000: return mm.group(0)
        k=hashlib.sha1(x.encode()).hexdigest()[:16]
        if k in pa: st['ref']+=1;st['mb']+=len(x)*3/4/2**20;return 'a/'+pa[k]
        st['eingebettet']+=1;return mm.group(0)
    raw2=re.sub(r'data:([a-z]+/[a-z0-9+.-]+);base64,([A-Za-z0-9+/=]+)',rep,raw)
    old="const p=new Promise((res,rej)=>{try{const bin=atob(src.slice(src.indexOf(',')+1))"
    new="const p=!/^data:/.test(src)?fetch(src).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.arrayBuffer()}).then(b=>new Promise((res,rej)=>V923.ctx.decodeAudioData(b,res,rej))):new Promise((res,rej)=>{try{const bin=atob(src.slice(src.indexOf(',')+1))"
    c=(hd+tl).count(old)
    if c: assert c==1;hd=hd.replace(old,new);tl=tl.replace(old,new)
    # Touch-Bedienung (V10.67) ist im Arbeitsstand nur für die Spielerdatei aktiv; in der SL-Webfassung auch für den SL (nur bei Touchscreen, PC unverändert)
    o2="function v1thInit(){if(V1TH.on||!atlas||!atlas.player)return;";n2="function v1thInit(){if(V1TH.on||!atlas)return;"
    c=(hd+tl).count(o2);assert c==1,('v1thInit',c);hd=hd.replace(o2,n2);tl=tl.replace(o2,n2)
    # V10.98: Excel-Bibliothek nur im lokalen Arbeitsstand
    for _k in ('hd','tl'):
        _t=hd if _k=='hd' else tl;_xi=_t.find('/*! xlsx.js')
        if _xi>=0:
            _a=_t.rfind('<script',0,_xi);_b=_t.find('</script>',_xi)+9;_t=_t[:_a]+_t[_b:]
            if _k=='hd': hd=_t
            else: tl=_t
    json.loads(raw2)
    print('SL-Webfassung: %d Verweise auf a/ (%.1f MB), %d nicht öffentliche Einbettungen bleiben'%(st['ref'],st['mb'],st['eingebettet']))
    return (hd+raw2+tl).encode('utf-8')
arbw=slweb(arb)
# V10.98 Punkt 4: Wirtschafts-Startspeicher der SL-Webfassung (eigene Aufzeichnung und Prüfung, Programm/Daten weichen vom Arbeitsstand ab).
# Rückgabe 2 = Prüfung nicht bestanden: Fassung ohne Startspeicher (rechnet wie bisher). SW_OEKO=0 überspringt (Startspeicher entfernt).
import subprocess,tempfile,shutil as _sh
_td=tempfile.mkdtemp(prefix='slweb-');_ei,_ao=os.path.join(_td,'ein.html'),os.path.join(_td,'aus.html');open(_ei,'wb').write(arbw)
if os.environ.get('SW_OEKO','1')=='0':
    arbw=re.sub(rb'<script id="atlas-eco"[^>]*>.*?</script>\n?',b'',arbw,flags=re.S);print('SL-Webfassung: ohne Wirtschafts-Startspeicher (SW_OEKO=0)')
else:
    _r=subprocess.run([sys.executable,os.path.join(HERE,'v1098','oeko_cache.py'),_ei,_ao,'--slweb'],capture_output=True,text=True)
    print('SL-Webfassung, Wirtschafts-Startspeicher:\n'+_r.stdout.strip()[-2500:]);assert _r.returncode in (0,2) and os.path.exists(_ao),('Startspeicher',_r.returncode,_r.stderr[-1500:])
    arbw=open(_ao,'rb').read()
_sh.rmtree(_td,ignore_errors=True)
sgz=gzip.compress(arbw,6,mtime=0);T=2*2**20;n=0
for i in range(0,len(sgz),T): open(os.path.join(TD,'a%03d.bin'%n),'wb').write(sgz[i:i+T]);n+=1
# V10.96: Kennung des Master-Arbeitsstands (SHA-1 des Atlas-Datentexts) – Basis der Online-Änderungen
_am=re.search(r'(<script id="atlas-data" type="application/json">)(.*?)(</script>)',arb.decode('utf-8'),re.S)
basis=hashlib.sha1(_am.group(2).encode('utf-8')).hexdigest()[:12]
json.dump({'teile':n,'groesse':len(sgz),'sha1':hashlib.sha1(sgz).hexdigest(),'stand':hashlib.sha1(arbw).hexdigest()[:12],'mb':round(len(arbw)/2**20,1),'basis':basis},open(os.path.join(TD,'index.json'),'w'))
# Master-Arbeitsstand (vollständig, für den Veröffentlichungs-Ablauf auf GitHub)
MD=os.path.join(SL,'master','teile');os.makedirs(MD,exist_ok=True)
_mi=None
try: _mi=json.load(open(os.path.join(MD,'index.json')))
except Exception: pass
if not _mi or _mi.get('basis')!=basis:
    for f in os.listdir(MD): os.remove(os.path.join(MD,f))
    mgz=gzip.compress(arb,6,mtime=0);mn=0
    for i in range(0,len(mgz),T): open(os.path.join(MD,'a%03d.bin'%mn),'wb').write(mgz[i:i+T]);mn+=1
    json.dump({'teile':mn,'groesse':len(mgz),'sha1':hashlib.sha1(mgz).hexdigest(),'basis':basis},open(os.path.join(MD,'index.json'),'w'))
    print('Master-Arbeitsstand: %.1f MB in %d Teilen · Basis %s'%(len(mgz)/2**20,mn,basis))
# Spielerfassung als Vergleichsbasis für die Veröffentlichungen (privat)
_wm=re.search(r'(<script id="atlas-data" type="application/json">)(.*?)(</script>)',web.decode('utf-8'),re.S)
os.makedirs(os.path.join(SL,'daten'),exist_ok=True)
with gzip.open(os.path.join(SL,'daten','spieler-basis.json.gz'),'wt',encoding='utf-8',compresslevel=6) as _f: _f.write('{"stand":'+json.dumps(stand)+',"atlas":'+_wm.group(2).replace('\\u003c','<')+'}')
json.load(gzip.open(os.path.join(SL,'daten','spieler-basis.json.gz'),'rt',encoding='utf-8'))
# Online-Dateien: bei neuer Basis zurücksetzen (offene Änderungen vorher mit online_uebernehmen.py in den Arbeitsstand holen!)
OD=os.path.join(SL,'online');os.makedirs(OD,exist_ok=True)
def _rj(f,d):
    try: return json.load(open(os.path.join(OD,f),encoding='utf-8'))
    except Exception: return d
_A=_rj('aenderungen.json',{});seq=_A.get('seq',0)
if _A.get('basis')!=basis:
    assert not _A.get('ops') or os.environ.get('SW_OPS_UEBERNOMMEN')=='1',('Offene Online-Änderungen zu Basis',_A.get('basis'),len(_A.get('ops') or []),'zuerst online_uebernehmen.py, dann SW_OPS_UEBERNOMMEN=1')
    json.dump({'basis':basis,'seq':seq,'zeit':None,'ops':[]},open(os.path.join(OD,'aenderungen.json'),'w'))
    json.dump({'basis':basis,'verarbeitet':seq,'ok':True,'meldung':'','zeit':None},open(os.path.join(OD,'status.json'),'w'),indent=1)
_P=_rj('spieler-ops.json',{})
if _P.get('basis')!=stand: json.dump({'basis':stand,'v':seq,'ops':[]},open(os.path.join(OD,'spieler-ops.json'),'w'))
if not os.path.exists(os.path.join(OD,'veroeffentlichen.json')): json.dump({'seq':0},open(os.path.join(OD,'veroeffentlichen.json'),'w'))
# Werkzeuge und Ablauf für die automatische Veröffentlichung ins private Repo
import shutil
WD=os.path.join(SL,'werkzeug');os.makedirs(WD,exist_ok=True)
for f in ('ops.py','online_veroeffentlichen.py','exp.py'): shutil.copy2(os.path.join(HERE,'online',f),os.path.join(WD,f))
for f in ('build.py','pano_inject.py'): shutil.copy2(os.path.join(HERE,f),os.path.join(WD,f))
os.makedirs(os.path.join(SL,'.github','workflows'),exist_ok=True)
shutil.copy2(os.path.join(HERE,'online','veroeffentlichen.yml'),os.path.join(SL,'.github','workflows','veroeffentlichen.yml'))
# Stufe 2b: Stand und Zeitplan im privaten Repo (Abfrage durch die geöffneten Atlanten), App-Dateien auf der Webseite
SD=os.path.join(SL,'steuerung');os.makedirs(SD,exist_ok=True)
json.dump({'spieler':stand,'sl':hashlib.sha1(arbw).hexdigest()[:12],'spieler_v':_rj('spieler-ops.json',{}).get('v',0) if _rj('spieler-ops.json',{}).get('basis')==stand else 0,'sl_v':seq,'basis':basis},open(os.path.join(SD,'stand.json'),'w'))
zp=os.path.join(SD,'zeitplan.json')
if not os.path.exists(zp):
    open(zp,'w',encoding='utf-8').write('''{
 "hinweis": "Abfrage-Zeitplan des Web-Atlas. Zeiten in deutscher Zeit (Europe/Berlin). Tage: So Mo Di Mi Do Fr Sa. takt \\"täglich\\" = einmal am Tag, sonst sekunden (mindestens 10). Änderungen wirken spätestens nach einer Stunde.",
 "zeitzone": "Europe/Berlin",
 "abschnitte": [
  {"von": "So 22:00", "bis": "Fr 15:00", "takt": "täglich"},
  {"von": "Fr 15:00", "bis": "Sa 14:00", "sekunden": 60},
  {"von": "Sa 14:00", "bis": "So 02:00", "sekunden": 20},
  {"von": "So 02:00", "bis": "So 22:00", "sekunden": 60}
 ]
}
''')
json.load(open(zp,encoding='utf-8'))
sp=os.path.join(SD,'spieler.json')
if not os.path.exists(sp):
    json.dump({'hinweis':'Spieler für die Spielerbögen der Spielleitung (Benutzername, Anzeigename, privates Repo). Bearbeitbar.',
               'spieler':[{'benutzer':b,'name':n,'repo':'BoHMaybe/scherbenwelt-'+b} for b,n in [('bernd','Bernd'),('drew','Drew'),('tink','Tink'),('slevin','Slevin'),('haraku','Haraku'),('blutaar','Blutaar'),('gast1','Gast 1'),('gast2','Gast 2')]]},
              open(sp,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
import shutil
AP=os.path.join(PUB,'app');os.makedirs(AP,exist_ok=True)
for f in os.listdir(os.path.join(HERE,'app')):
    if f!='sw.js': shutil.copy2(os.path.join(HERE,'app',f),os.path.join(AP,f))
shutil.copy2(os.path.join(HERE,'app','sw.js'),os.path.join(PUB,'sw.js'))
av=hashlib.sha1(open(os.path.join(HERE,'app','abfrage.js'),'rb').read()).hexdigest()[:10]
# Hülle
h=open(os.path.join(HERE,'login_huelle.html'),encoding='utf-8').read()
assert h.count('__AV__')==1;h=h.replace('__AV__',av)
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

