# -*- coding: utf-8 -*-
"""Scherbenwelt · Veröffentlichen (V10.96) – läuft im GitHub-Ablauf des privaten Repos scherbenwelt-sl (Arbeitsverzeichnis = Repo).
1. Master-Arbeitsstand aus master/teile/ zusammensetzen, Online-Änderungen der Spielleitung (online/aenderungen.json) anwenden.
2. Spielerdatei exportieren (exp.py, wie „Spielerdatei exportieren“) und Web-Fassung bauen (build.py, ohne Bilderordner).
3. Unterschied zur hochgeladenen Spielerfassung (daten/spieler-basis.json.gz) als online/spieler-ops.json ablegen; die Spieler-Atlanten
   wenden ihn beim Laden an. Neue Bilder (noch nicht auf der Webseite) bleiben eingebettet.
4. steuerung/stand.json (spieler_v) und online/status.json schreiben. Bei Fehlern: status ok=false mit Meldung, nichts veröffentlicht.
Aufruf: python3 werkzeug/online_veroeffentlichen.py [Arbeitsordner]"""
import os,sys,json,gzip,re,base64,hashlib,subprocess,time,datetime,copy,shutil,traceback
HERE=os.path.dirname(os.path.abspath(__file__));sys.path.insert(0,HERE);import ops
TMP=sys.argv[1] if len(sys.argv)>1 else '/tmp/sw-veroeff';T0=time.time()
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')
def rj(p,d=None):
    try: return json.load(open(p,encoding='utf-8'))
    except FileNotFoundError: return d
def wj(p,o,pretty=False):
    os.makedirs(os.path.dirname(p) or '.',exist_ok=True)
    json.dump(o,open(p,'w',encoding='utf-8'),ensure_ascii=False,**({'indent':1} if pretty else {'separators':(',',':')}))
RX=re.compile(r'(<script id="atlas-data" type="application/json">)(.*?)(</script>)',re.S)
A=rj('online/aenderungen.json');MI=rj('master/teile/index.json');ST=rj('online/status.json',{}) or {}
def status(ok,meldung='',**kw):
    o={'basis':MI.get('basis') if MI else None,'verarbeitet':(A or {}).get('seq',0) if ok else ST.get('verarbeitet',0),'ok':ok,'meldung':meldung,'zeit':now(),'dauer_s':round(time.time()-T0)}
    o.update(kw);wj('online/status.json',o,True);print('STATUS',json.dumps(o,ensure_ascii=False))
def main():
    if not MI: status(False,'Kein Master-Arbeitsstand im Repo (master/teile).');return
    if not A or not A.get('ops'): print('Keine Online-Änderungen.');return
    if A.get('basis')!=MI.get('basis'): status(False,'Die Online-Änderungen gehören zu einer älteren Fassung; Claude übernimmt sie beim nächsten Hochladen.');return
    seq=A.get('seq',0)
    if ST.get('basis')==MI['basis'] and ST.get('ok') and ST.get('verarbeitet',0)>=seq: print('Bereits veröffentlicht bis',seq);return
    if os.path.isdir(TMP): shutil.rmtree(TMP)
    os.makedirs(TMP)
    gz=b''.join(open('master/teile/a%03d.bin'%i,'rb').read() for i in range(MI['teile']))
    assert len(gz)==MI['groesse'] and hashlib.sha1(gz).hexdigest()==MI['sha1'],'Master unvollständig'
    html=gzip.decompress(gz).decode('utf-8');m=RX.search(html)
    assert hashlib.sha1(m.group(2).encode('utf-8')).hexdigest()[:12]==MI['basis'],'Master-Kennung stimmt nicht'
    data=json.loads(m.group(2));n=ops.apply(data,A['ops'])
    raw=json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    open(os.path.join(TMP,'master.html'),'w',encoding='utf-8').write(html[:m.start(2)]+raw+html[m.end(2):]);del html,raw,data
    r=subprocess.run([sys.executable,os.path.join(HERE,'exp.py'),os.path.join(TMP,'spieler.html'),os.path.join(TMP,'master.html')],capture_output=True,text=True,timeout=1500)
    print(r.stdout[-1500:],r.stderr[-1500:])
    if not os.path.exists(os.path.join(TMP,'spieler.html')): raise RuntimeError('Export der Spielerdatei fehlgeschlagen')
    r=subprocess.run([sys.executable,os.path.join(HERE,'build.py'),os.path.join(TMP,'spieler.html'),os.path.join(TMP,'web'),'-'],capture_output=True,text=True,timeout=900)
    print(r.stdout[-2500:],r.stderr[-2500:])
    if r.returncode: raise RuntimeError('Web-Fassung nicht gebaut: '+(r.stderr.strip().splitlines() or ['?'])[-1][:200])
    web=open(os.path.join(TMP,'web','index.html'),encoding='utf-8').read();txt=RX.search(web).group(2)
    W=json.load(gzip.open('daten/spieler-basis.json.gz','rt',encoding='utf-8'));P0=W['atlas'];stand=W['stand']
    # neue Bilder/Musik (noch nicht auf der Webseite): eingebettet lassen
    alt=set(re.findall(r'a/[0-9a-f]{16}\.[a-z0-9]+',json.dumps(P0)))
    MIME={'webp':'image/webp','jpg':'image/jpeg','png':'image/png','gif':'image/gif','mp3':'audio/mpeg'};neu=[]
    for ref in sorted(set(re.findall(r'"(a/[0-9a-f]{16}\.([a-z0-9]+))"',txt))):
        if ref[0] in alt: continue
        b=base64.b64encode(open(os.path.join(TMP,'web',ref[0]),'rb').read()).decode()
        txt=txt.replace('"'+ref[0]+'"','"data:'+MIME.get(ref[1],'application/octet-stream')+';base64,'+b+'"');neu.append(ref[0])
    P1=json.loads(txt);assert P1.get('player') is True,'keine Spielerfassung'
    assert 'slbild:' not in txt,'SL-Bildverweis in Spielerfassung'
    pops=ops.diff(P0,P1);chk=copy.deepcopy(P0);ops.apply(chk,pops)
    def norm(v):
        if isinstance(v,list):
            if v and all(isinstance(e,dict) and 'id' in e for e in v): return sorted((norm(e) for e in v),key=lambda e:json.dumps(e.get('id')))
            return [norm(e) for e in v]
        if isinstance(v,dict): return {k:norm(v[k]) for k in sorted(v)}
        return v
    assert json.dumps(norm(chk),sort_keys=True)==json.dumps(norm(P1),sort_keys=True),'Spieler-Änderungsliste nicht schlüssig'
    wj('online/spieler-ops.json',{'basis':stand,'v':seq,'zeit':now(),'ops':pops})
    S=rj('steuerung/stand.json',{}) or {};S['spieler_v']=seq;S['sl_v']=seq;wj('steuerung/stand.json',S)
    status(True,'',sl_ops=n,sl_ops_gesamt=len(A['ops']),spieler_ops=len(pops),neue_medien=neu,spieler_ops_kb=round(len(json.dumps(pops))/1024,1))
try: main()
except Exception as e:
    traceback.print_exc();status(False,'Veröffentlichung fehlgeschlagen: '+str(e)[:300])
