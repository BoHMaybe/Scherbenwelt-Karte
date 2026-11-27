# -*- coding: utf-8 -*-
"""V10.98 Teil A: Musik und große Krankheitsbilder aus dem Arbeitsstand auslagern; Excel-Import-Schutz für Web-Fassungen.
Aufruf: python3 auslagern98.py <Arbeitsstand_ein.html> <Arbeitsstand_aus.html> <gh-pages-Arbeitskopie>
- atlas.music[*] (Musik, öffentlich) und atlas.diseaseArt[*].z (Krankheitsstudien, öffentlich) ab 20 KB -> gh-pages/medien/<sha1[:16]>.<ext>,
  Verweis 'medien/<name>'. Bleiben eingebettet: Startbild, Krankheitssymbole, Reisejournal (werden in Zeichenflächen verarbeitet).
- Programm: swMedia() (lokal geöffnet -> Adresse der Webseite), Musik lädt Dateiverweise per fetch, Bildbeobachter kennt medien/,
  Excel-Import meldet in Web-Fassungen (ohne Excel-Bibliothek) „nur im lokalen Arbeitsstand“."""
import re,sys,os,json,base64,hashlib
SRC,OUT,PUB=sys.argv[1:4]
s=open(SRC,encoding='utf-8').read()
m=re.search(r'(<script id="atlas-data" type="application/json">)(.*?)(</script>)',s,re.S)
head,data,tail=s[:m.start(2)],m.group(2),s[m.end(2):];A=json.loads(data)
EXT={'audio/mpeg':'mp3','image/webp':'webp','image/jpeg':'jpg','image/png':'png'}
MD=os.path.join(PUB,'medien');os.makedirs(MD,exist_ok=True);st={'n':0,'mb':0.0,'neu':0}
def out(v):
    mm=re.match(r'^data:([a-z]+/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$',v or '')
    if not mm or len(v)<20000 or mm.group(1) not in EXT: return v
    b=mm.group(2);name=hashlib.sha1(b.encode()).hexdigest()[:16]+'.'+EXT[mm.group(1)];p=os.path.join(MD,name)
    if not os.path.exists(p): open(p,'wb').write(base64.b64decode(b));st['neu']+=1
    st['n']+=1;st['mb']+=len(v)/2**20;return 'medien/'+name
for k in list((A.get('music') or {}).keys()): A['music'][k]=out(A['music'][k])
for k,X in (A.get('diseaseArt') or {}).items():
    if isinstance(X,dict) and isinstance(X.get('z'),str): X['z']=out(X['z'])
data=json.dumps(A,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
def rep(old,new,where='tail'):
    global head,tail
    t=head if where=='head' else tail
    if t.count(new.split('\x00')[0])>=1 and t.count(old)==0: return
    assert t.count(old)==1,(old[:80],t.count(old))
    t=t.replace(old,new)
    if where=='head': head=t
    else: tail=t
# swMedia im frühen Programmteil (vor dem Atlas)
rep('<script id="atlas-ops">\n','<script id="atlas-ops">\n/* V10.98: ausgelagerte Medien – lokal geöffnet von der Webseite laden */\nfunction swMedia(u){try{if(typeof u===\'string\'&&/^(?:bilder|medien)\\//.test(u)&&location.protocol===\'file:\'){var b=\'https://bohmaybe.github.io/Scherbenwelt-Karte/\';try{b=(localStorage.getItem(\'scherbenweltBildBasis\')||b).replace(/\\/?$/,\'/\')}catch(e){}return b+u}}catch(e){}return u}\n')
# Musik: Dateiverweise per fetch (wie in der Web-Fassung), lokal über swMedia
rep("const p=new Promise((res,rej)=>{try{const bin=atob(src.slice(src.indexOf(',')+1))",
    "const p=!/^data:/.test(src)?fetch(swMedia(src)).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.arrayBuffer()}).then(b=>new Promise((res,rej)=>V923.ctx.decodeAudioData(b,res,rej))):new Promise((res,rej)=>{try{const bin=atob(src.slice(src.indexOf(',')+1))")
# Bildbeobachter (V10.94): medien/ wie bilder/ behandeln
rep("if(/^bilder\\//.test(v)&&location.protocol==='file:')return V1094.base+v;","if(/^(?:bilder|medien)\\//.test(v)&&location.protocol==='file:')return V1094.base+v;")
rep("if(st&&/url\\([\"']?(bilder\\/|slbild:)/.test(st)){const s2=st.replace(/url\\(([\"']?)((?:bilder\\/|slbild:)[^\"')]+)\\1\\)/g,",
    "if(st&&/url\\([\"']?(bilder\\/|medien\\/|slbild:)/.test(st)){const s2=st.replace(/url\\(([\"']?)((?:bilder\\/|medien\\/|slbild:)[^\"')]+)\\1\\)/g,")
c=tail.count("querySelectorAll('img,image,[style*=\"bilder/\"],[style*=\"slbild:\"]')");assert c==2,c
tail=tail.replace("querySelectorAll('img,image,[style*=\"bilder/\"],[style*=\"slbild:\"]')","querySelectorAll('img,image,[style*=\"bilder/\"],[style*=\"medien/\"],[style*=\"slbild:\"]')")
# Excel-Import: ohne Excel-Bibliothek (Web-Fassungen) sauber melden
rep("const bytes=await file.arrayBuffer();const workbook=XLSX.read(","if(typeof XLSX==='undefined'){status('Excel-Import ist nur im lokal geöffneten Arbeitsstand möglich.',true);button.disabled=false;return}const bytes=await file.arrayBuffer();const workbook=XLSX.read(")
open(OUT,'w',encoding='utf-8').write(head+data+tail)
print('ausgelagert %d (%.1f MB), neue Dateien %d · Größe %.1f MB -> %.1f MB'%(st['n'],st['mb'],st['neu'],len(s.encode())/2**20,len((head+data+tail).encode())/2**20))
