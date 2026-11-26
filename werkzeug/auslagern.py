# -*- coding: utf-8 -*-
"""V10.94 · Bilder aus dem Arbeitsstand auslagern (wiederholbar, idempotent).
Aufruf: python3 auslagern.py <Arbeitsstand_ein.html> <Arbeitsstand_aus.html> <Spielerdatei.html> <gh-pages-Arbeitskopie> <scherbenwelt-sl-Arbeitskopie> <patch1094.js>
- Compendium-Bildblöcke (ohne Wappen) und Scherbenkarten ab 20 KB werden als Datei abgelegt.
- Öffentlich (gh-pages/bilder/, Verweis 'bilder/<name>'): Bilder in Einträgen, die in der Spielerdatei stehen (auch geschwärzt), sichtbare Karten, Weltkarte.
- SL-exklusiv (scherbenwelt-sl/bilder/, Verweis 'slbild:<name>'): Bilder in Einträgen und Karten, die nicht in der Spielerdatei stehen.
- Dateiname = erste 16 Zeichen SHA-1 des Base64-Inhalts + Endung (gleiches Bild = gleiche Datei). Inhalt bleibt unverändert (keine Neukodierung).
- Kleine Einbettungen (Symbole, Wappen, Siegel, Musik, Journal, Startbild) bleiben in der Datei."""
import re,sys,os,json,base64,hashlib,collections
SRC,OUT,PLAYER,PUB,SL,PATCH=sys.argv[1:7]
MIN=20000;EXT={'image/jpeg':'jpg','image/webp':'webp','image/png':'png','image/gif':'gif'}
R=r'^data:(image/[a-z+]+);base64,([A-Za-z0-9+/=]+)$'
def load(f):
    s=open(f,encoding='utf-8').read();m=re.search(r'(<script id="atlas-data" type="application/json">)(.*?)(</script>)',s,re.S)
    return s,m,json.loads(m.group(2))
H,M,A=load(SRC);_,_,P=load(PLAYER)
vis={a['id'] for a in P['compendium']['articles']};visMap={m['id'] for m in P.get('maps',[])}
for d in (os.path.join(PUB,'bilder'),os.path.join(SL,'bilder')): os.makedirs(d,exist_ok=True)
st=collections.Counter()
def out(src,public,where):
    m=re.match(R,src)
    if not m or len(src)<MIN or m.group(1) not in EXT: return src
    b=m.group(2);name=hashlib.sha1(b.encode()).hexdigest()[:16]+'.'+EXT[m.group(1)]
    p=os.path.join(PUB if public else SL,'bilder',name)
    if not os.path.exists(p): open(p,'wb').write(base64.b64decode(b));st['neu_'+('pub' if public else 'sl')]+=1
    st[('pub_' if public else 'sl_')+where]+=1;st['mb_'+('pub' if public else 'sl')]+=len(b)*3/4/2**20
    return ('bilder/' if public else 'slbild:')+name
for a in A['compendium']['articles']:
    pub=a['id'] in vis
    for p in a.get('pages',[]):
        for b in p.get('blocks',[]):
            if b.get('t')=='img' and b.get('cls')!='wappen' and isinstance(b.get('src'),str) and b['src'].startswith('data:'):
                b['src']=out(b['src'],pub,'compendium')
for m in A.get('maps',[]):
    if isinstance(m.get('image'),str) and m['image'].startswith('data:'): m['image']=out(m['image'],m['id'] in visMap,'karte')
if isinstance(A.get('world'),dict) and isinstance(A['world'].get('image'),str) and A['world']['image'].startswith('data:'):
    A['world']['image']=out(A['world']['image'],True,'welt')
# SL-Verweise dürfen in sichtbaren Einträgen nicht vorkommen
leak=[a['id'] for a in A['compendium']['articles'] if a['id'] in vis and 'slbild:' in json.dumps(a)]
assert not leak,('SL-Bild in sichtbarem Eintrag',leak[:5])
data=json.dumps(A,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
head,tail=H[:M.start(2)],H[M.end(2):]
# Programmstellen: Bildprüfung im Compendium und bei Wappen auf Dateiverweise erweitern
REF=r'(?:bilder|a)\/[0-9a-f]{16}\.(?:webp|jpg|png|gif)|slbild:[0-9a-f]{16}\.(?:webp|jpg|png|gif)'
REP=[(r"/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(b.src||'')", r"/^(?:data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+|"+REF+r")$/.test(b.src||'')"),
     (r"/^data:image\/(jpeg|png|webp);base64,/.test(b.src||'')", r"/^(?:data:image\/(jpeg|png|webp);base64,|"+REF+r")/.test(b.src||'')")]
for o,n in REP:
    c=tail.count(o)+head.count(o)
    if c==0: assert (tail+head).count(n)==1,('Programmstelle fehlt',o[:50]);continue
    assert c==1,('Programmstelle mehrdeutig',o[:50],c);head=head.replace(o,n);tail=tail.replace(o,n)
if 'var V1094=' not in tail:
    END='</script></body></html>';k=tail.rstrip().rfind(END);assert k>0
    tail=tail[:k]+open(PATCH,encoding='utf-8').read()+tail[k:]
    b='<p><b>Tabellen · Schiffsbogen (V10.86'
    if b in tail: tail=tail.replace(b,'<p><b>Bilder (V10.94):</b> Große Bilder (Compendium, Scherbenkarten) liegen nicht mehr in der Datei, sondern im Repo der Webseite (Ordner bilder/) und SL-exklusive Bilder im privaten Repo scherbenwelt-sl. Der lokal geöffnete Arbeitsstand lädt sie über das Internet; SL-exklusive Bilder erst nach Eingabe des SL-Schlüssels (Schaltfläche unten links), der nur im Browser gespeichert wird.</p>'+b,1)
open(OUT,'w',encoding='utf-8').write(head+data+tail)
print({k:(round(v,1) if isinstance(v,float) else v) for k,v in sorted(st.items())})
print('Größe %.1f MB -> %.1f MB'%(len(H.encode())/2**20,len((head+data+tail).encode())/2**20))
