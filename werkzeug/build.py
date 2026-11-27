# -*- coding: utf-8 -*-
"""Web-Fassung der Spielerkarte: eine Startseite (index.html) + ausgelagerte Bilder/Musik (Ordner a/).
Inhalt und Programm bleiben unverändert; ersetzt werden nur eingebettete Daten-URIs durch Dateiverweise.
Aufruf: python3 build.py <Spielerkarte.html> <Zielordner> [Bilderordner]
Seit V10.94 verweist die Spielerkarte auf ausgelagerte Bilder 'bilder/<name>' (Ordner bilder/ im Zweig gh-pages).
Verwiesene Dateien werden aus dem Bilderordner (Vorgabe: ../scherbenwelt-karte/bilder) nach <Zielordner>/bilder kopiert."""
import re,sys,os,io,base64,hashlib,collections,shutil,zlib,json
from PIL import Image
SRC,OUT=sys.argv[1],sys.argv[2]
BILD=sys.argv[3] if len(sys.argv)>3 else os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','scherbenwelt-karte','bilder')
MIN=20000   # kleinere Einbettungen (Symbole) bleiben in der Seite
EXT={'image/jpeg':'jpg','image/webp':'webp','image/png':'png','audio/mpeg':'mp3','image/gif':'gif'}
s=open(SRC,encoding='utf-8').read()
m=re.search(r'(<script id="atlas-data" type="application/json">)(.*?)(</script>)',s,re.S)
head,raw,tail=s[:m.start(2)],m.group(2),s[m.end(2):]
A=os.path.join(OUT,'a');os.makedirs(A,exist_ok=True)
# V10.98: SL-exklusive Bilder, die inzwischen für Spieler sichtbar sind (freigegebene Inhalte), aus dem SL-Bilderordner einbetten;
# sie werden unten wie alle Einbettungen als öffentliche Datei (a/) abgelegt. Ordner: Umgebungsvariable SW_SLBILDER.
_SLB=os.environ.get('SW_SLBILDER') or os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','scherbenwelt-sl','bilder')
def _slb(mm):
    f=os.path.join(_SLB,mm.group(1))
    if not os.path.exists(f): return mm.group(0)
    st['slbild_eingebettet']+=1;return 'data:'+{'webp':'image/webp','jpg':'image/jpeg','png':'image/png','gif':'image/gif'}[mm.group(2)]+';base64,'+base64.b64encode(open(f,'rb').read()).decode()
raw=re.sub(r'slbild:([0-9a-f]{16}\.(webp|jpg|png|gif))',_slb,raw)
keep=set();st=collections.Counter();cache={}
def rep(mm):
    mime,b=mm.group(1),mm.group(2)
    if mime not in EXT or len(b)<MIN: st['inline']+=len(mm.group(0));return mm.group(0)
    k=hashlib.sha1(b.encode()).hexdigest()[:16]
    if k in cache: return cache[k]
    d=base64.b64decode(b);ext=EXT[mime];st['in_'+mime]+=len(d)
    if mime=='image/jpeg':
        try:
            im=Image.open(io.BytesIO(d));buf=io.BytesIO();im.save(buf,'WEBP',quality=80,method=6)
            if len(buf.getvalue())<len(d)*0.95: d=buf.getvalue();ext='webp'
        except Exception as e: print('Bild unverändert',k,e)
    name=k+'.'+ext;p=os.path.join(A,name)
    if not os.path.exists(p): open(p,'wb').write(d)
    keep.add(name);st['out_'+mime]+=len(d);st['n']+=1;cache[k]='a/'+name;return cache[k]
raw2=re.sub(r'data:([a-z]+/[a-z0-9+.-]+);base64,([A-Za-z0-9+/=]+)',rep,raw)
for f in os.listdir(A):
    if f not in keep: os.remove(os.path.join(A,f))
# Programmstellen, die eingebettete Daten voraussetzen, auf Dateiverweise erweitern (nur Web-Fassung)
def patch(old,new,n,done=None):
    global head,tail
    c=head.count(old)+tail.count(old)
    if c==0 and done and (head+tail).count(done)>=1: return   # seit V10.94 im Arbeitsstand bereits erweitert
    assert c==n,('Programmstelle nicht gefunden',old[:60],c)
    head=head.replace(old,new); tail=tail.replace(old,new)
REF=r'a\/[0-9a-f]{16}\.(?:webp|jpg|png|gif)'
patch(r"/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(b.src||'')", r"/^(?:data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+|"+REF+r")$/.test(b.src||'')",1,done=r"slbild:[0-9a-f]{16}")
patch(r"/^data:image\/(jpeg|png|webp);base64,/.test(b.src||'')", r"/^(?:data:image\/(jpeg|png|webp);base64,|"+REF+r")/.test(b.src||'')",1,done=r"slbild:[0-9a-f]{16}")
patch("const p=new Promise((res,rej)=>{try{const bin=atob(src.slice(src.indexOf(',')+1))", "const p=!/^data:/.test(src)?fetch(src).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.arrayBuffer()}).then(b=>new Promise((res,rej)=>V923.ctx.decodeAudioData(b,res,rej))):new Promise((res,rej)=>{try{const bin=atob(src.slice(src.indexOf(',')+1))",1,done='fetch(swMedia(src))')
# V10.98: Excel-Bibliothek nur im lokalen Arbeitsstand (Excel-Import); Web-Fassung ohne
_xi=head.find('/*! xlsx.js')
if _xi<0: _xi=tail.find('/*! xlsx.js');_T='tail'
else: _T='head'
if _xi>=0:
    _t=head if _T=='head' else tail;_a=_t.rfind('<script',0,_xi);_b=_t.find('</script>',_xi)+9;_t=_t[:_a]+_t[_b:]
    if _T=='head': head=_t
    else: tail=_t
    print('Excel-Bibliothek entfernt')
assert head.count('<meta name="viewport"')==1
head=head.replace('<meta name="viewport"','<meta name="robots" content="noindex,nofollow">\n<meta name="viewport"',1)
# Voreinstellung der Boxen beim Öffnen (nur Web-Fassung): nur KEEP bleibt angewählt, alles andere startet aus und bleibt einschaltbar
START=r"""<script>/* Web-Fassung: Voreinstellung der Boxen beim Öffnen */
(function(){var KEEP={showRegions:1,showCities:1,showVillages:1,v10Crests:1,v1zuShow:1,v99Show:1,relLocal:1,poiShowVerborgen:1,poiShowEntdeckt:1,poiShowAbsolviert:1,tpPub:1,tpLost:1,tpOrg:1,tpLB:1,tpOpen:1,rel_alliance:1,rel_rivalry:1,relgCiv:1,relgMil:1,wklRouteFeed:1,wklRouteVoid:1,wklRoadGeo:1,wwRelCiv:1,wwRelMil:1,wwUseTele:1,travWater:1},touched=false,done=0;
function reach(e){for(var a=e.parentElement;a&&a!==document.body;a=a.parentElement){if(getComputedStyle(a).display==='none')return false}return true}
function run(){if(touched&&done)return;var s=document.querySelector('aside');if(!s)return;done++;[].forEach.call(s.querySelectorAll('input[type=checkbox]'),function(e){var want=!!KEEP[e.id];if(e.checked===want||e.disabled)return;e.checked=want;try{e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}catch(x){}})}
document.addEventListener('pointerdown',function(e){if(e.target&&e.target.closest&&e.target.closest('aside'))touched=true},true);
function go(){setTimeout(run,300);setTimeout(run,2200)}
if(document.readyState==='complete')go();else addEventListener('load',go)})();</script>"""
_i=tail.rfind('</body>');assert _i>0
tail=tail[:_i]+START+'\n'+tail[_i:]
# Teleportverbindungen (nur Web-Fassung): sichtbar nur, wenn (beide Orte besucht ODER ein Ort "Widerstand") UND kein Ende "Tendenz Loyal"/"Imperiumstreu"
import json
_D=json.loads(raw2);_hits=[]
for _m in re.finditer(r'"tp":\[',raw2):
    try: _v,_e=json.JSONDecoder().raw_decode(raw2,_m.end()-1)
    except Exception: continue
    if isinstance(_v,list) and _v and isinstance(_v[0],dict) and 'tg' in _v[0] and 'sid' in _v[0]: _hits.append((_m.end()-1,_e,_v))
assert len(_hits)==1,('Teleportliste nicht eindeutig',len(_hits))
_a,_e,_T=_hits[0]
_byId={t['id']:t for t in _T};_pub={t['sid']:t for t in _T if t['status']=='Öffentlich'}
_cb={(c['shard'],c.get('sourceId')):c for c in _D['cities']};_vis=set(_D.get('visited') or [])
_LO={'Tendenz Loyal','Imperiumstreu'};_n0=_n1=_un=0
def _ok(t,g):
    global _un
    u=_byId.get(g) or _pub.get(g)
    if not u: _un+=1;return True
    a,b=_cb.get((t['shard'],t['sid'])),_cb.get((u['shard'],u['sid']));la,lb=(a or {}).get('loyalty'),(b or {}).get('loyalty')
    if la in _LO or lb in _LO: return False
    return la=='Widerstand' or lb=='Widerstand' or bool(a and b and a['id'] in _vis and b['id'] in _vis)
for t in _T:
    _n0+=len(t.get('tg') or []);t['tg']=[g for g in (t.get('tg') or []) if _ok(t,g)];_n1+=len(t['tg'])
raw2=raw2[:_a]+json.dumps(_T,ensure_ascii=False,separators=(',',':'))+raw2[_e:]
json.loads(raw2)
print('Teleportziele: %d -> %d (nicht auflösbar, unverändert: %d)'%(_n0,_n1,_un))
# Reisejournal (nur Web-Fassung): Bilder an Einträgen "Legendäre Kreatur" entfernen (Fremdillustrationen); Text der Einträge bleibt
_J=json.loads(raw2)['sl7']['journal'];_rm=[e['img'] for e in _J['e'] if e.get('t')=='legend' and e.get('img')]
assert not (set(_rm)&set([_J.get('vstart')]+list(_J.get('mp3') or []))) and len(set(_rm))==len(_rm)
assert not any(e.get('img') in _rm for e in _J['e'] if e.get('t')!='legend')
for _id in _rm:
    raw2,_c=re.subn(r',"img":"%s"(?:,"imgS":[0-9.]+)?'%_id,'',raw2);assert _c==1,('Bildverweis',_id,_c)
    _k='"%s":{'%_id;assert raw2.count(_k)==1,('Medium',_id);_p=raw2.index(_k);_v,_q=json.JSONDecoder().raw_decode(raw2,_p+len(_k)-1)
    assert _v.get('k')=='img'
    if raw2[_q]==',': _q+=1
    elif raw2[_p-1]==',': _p-=1
    raw2=raw2[:_p]+raw2[_q:]
_J2=json.loads(raw2)['sl7']['journal'];assert not any(k in _J2['media'] for k in _rm)
print('Journalbilder entfernt:',_rm,'verbleibende Medien:',sorted(_J2['media']))
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'pano_inject.py'),encoding='utf-8').read())
# V10.98 Punkt 6: Compendium-Seiten je Eintrag als Text; die Spielerfassung wandelt sie erst beim ersten Lesen um (lazy98.js)
if 'function swLazyPages' in head+tail:
    _D=json.loads(raw2);_n=0;_chk={}
    for _a in (_D.get('compendium') or {}).get('articles') or []:
        if isinstance(_a.get('pages'),list):
            _chk[_a['id']]=json.dumps(_a['pages'],sort_keys=True);_t=json.dumps(_a['pages'],ensure_ascii=False,separators=(',',':'))
            _co=zlib.compressobj(9,zlib.DEFLATED,-15);_z=_co.compress(_t.encode('utf-8'))+_co.flush()
            _a['pages']=('z1:' if 'slbild:' in _t else 'z0:')+base64.b64encode(_z).decode();_n+=1
    raw2=json.dumps(_D,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    _D2=json.loads(raw2)
    assert all(json.dumps(json.loads(zlib.decompress(base64.b64decode(_a['pages'][3:]),-15).decode('utf-8')),sort_keys=True)==_chk[_a['id']] for _a in _D2['compendium']['articles'] if _a['id'] in _chk),'Compendium-Seiten nicht verlustfrei'
    print('Compendium: Seiten von %d Einträgen gepackt (bei Bedarf gelesen)'%_n);del _D,_D2,_chk
html=head+raw2+tail
assert 'slbild:' not in raw2,'SL-exklusiver Bildverweis in der Spielerkarte'
BO=os.path.join(OUT,'bilder');os.makedirs(BO,exist_ok=True);_bm=[]
if BILD=='-': print('Bilderordner übersprungen (-)')
for f in (sorted(set(re.findall(r'bilder/([0-9a-f]{16}\.(?:webp|jpg|png|gif))',raw2))) if BILD!='-' else []):
    q=os.path.join(BILD,f)
    if os.path.isfile(q): shutil.copy2(q,os.path.join(BO,f))
    else: _bm.append(f)
assert not _bm,('Bilder fehlen im Bilderordner',BILD,_bm[:5])
print('Bilder (bilder/): %d Dateien'%len(os.listdir(BO)))
for f in os.listdir(A):
    if ('a/'+f) not in html: os.remove(os.path.join(A,f));print('Datei entfernt',f)
open(os.path.join(OUT,'index.html'),'w',encoding='utf-8').write(html);open(os.path.join(OUT,'.nojekyll'),'w').write('')
keep=set(os.listdir(A))
big=max(os.path.getsize(os.path.join(A,f)) for f in keep)
print('Quelle %.1f MB -> index.html %.1f MB + %d Dateien %.1f MB (größte %.1f MB)'%(len(s.encode())/1e6,len(html.encode())/1e6,len(keep),sum(os.path.getsize(os.path.join(A,f)) for f in keep)/1e6,big/1e6))
for k,v in sorted(st.items()): print('  ',k,round(v/1e6,2) if k!='n' else v)
