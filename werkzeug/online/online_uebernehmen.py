# -*- coding: utf-8 -*-
"""Scherbenwelt · Online-Änderungen in den lokalen Arbeitsstand übernehmen (V10.96, vor jedem Hochladen durch Claude).
Aufruf: python3 online_uebernehmen.py <Arbeitsstand_lokal.html> <scherbenwelt-sl-Arbeitskopie> <Arbeitsstand_aus.html>
Regel „Arbeitsstand gewinnt“: eine Online-Änderung wird nur übernommen, wenn die betroffene Stelle im lokalen Arbeitsstand seit dem
veröffentlichten Stand (master/teile) unverändert ist; sonst bleibt der lokale Wert und die Stelle wird gemeldet."""
import os,sys,json,gzip,re,hashlib,copy
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));import ops
LOC,SL,OUT=sys.argv[1:4]
RX=re.compile(r'(<script id="atlas-data" type="application/json">)(.*?)(</script>)',re.S)
A=json.load(open(os.path.join(SL,'online','aenderungen.json'),encoding='utf-8'))
MI=json.load(open(os.path.join(SL,'master','teile','index.json'),encoding='utf-8'))
assert A.get('basis')==MI['basis'],('Online-Änderungen zu anderer Basis',A.get('basis'),MI['basis'])
gz=b''.join(open(os.path.join(SL,'master','teile','a%03d.bin'%i),'rb').read() for i in range(MI['teile']))
B=json.loads(RX.search(gzip.decompress(gz).decode('utf-8')).group(2))
h=open(LOC,encoding='utf-8').read();m=RX.search(h);L=json.loads(m.group(2))
ok=0;skip=[]
for op in A.get('ops',[]):
    if ops.get(B,op['p'])==ops.get(L,op['p']):
        if ops.apply1(L,op): ok+=1
        else: skip.append(('nicht anwendbar',op['p']))
    else: skip.append(('lokal geändert',op['p']))
    ops.apply1(B,op)
L['onlineImport']={'basis':A['basis'],'seq':A.get('seq',0),'n':ok}
raw=json.dumps(L,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
open(OUT,'w',encoding='utf-8').write(h[:m.start(2)]+raw+h[m.end(2):])
print('übernommen',ok,'von',len(A.get('ops',[])),'· nicht übernommen',len(skip))
for g,p in skip[:40]: print('  ',g,json.dumps(p,ensure_ascii=False)[:160])
