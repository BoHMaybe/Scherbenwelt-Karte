# -*- coding: utf-8 -*-
"""Scherbenwelt · V10.98 Punkt 4: Wirtschafts-Startspeicher aufzeichnen, einbetten und prüfen.
Aufruf: python3 oeko_cache.py <ein.html> <aus.html> [--slweb]
1. Datei ohne Startspeicher in Chromium öffnen (Aufzeichnung): jede Lieferkettenrechnung beim Start wird mit dem Prüfwert des
   vollständigen Zustands davor festgehalten; danach Gesamtzustand (Atlas + alle Programmwerte) als Prüfliste.
2. Ergebnisse verlustfrei packen (Rohbytes, Deflate; Folgeeinträge als Unterschied zum ersten) und als
   <script id="atlas-eco" data-sw> vor <script id="atlas-ops"> einbetten.
3. Neu öffnen (Verwendung): alle Einträge müssen verwendet werden und der Gesamtzustand muss Bit für Bit gleich sein.
   Sonst wird die Datei OHNE Startspeicher geschrieben (Rückgabe 2) – sie rechnet dann wie bisher.
--slweb: Aufzeichnung wie in der SL-Webfassung (Anmeldedaten wie von der Anmeldeseite, ohne Online-Änderungen)."""
import os,sys,re,json,base64,zlib,time,asyncio,tempfile,shutil,hashlib
IN,OUT=sys.argv[1:3];SLWEB='--slweb' in sys.argv
RXE=re.compile(r'<script id="atlas-eco"[^>]*>.*?</script>\n?',re.S)
src=open(IN,encoding='utf-8').read();src=RXE.sub('',src)
assert 'function swEcoTake' in src,'Programmteil fehlt (oeko98_einbauen.py)'
# Namen der Programmwerte (oberste Ebene von atlas-app) für die Prüfliste
app=src[src.index('<script id="atlas-app">'):]
NAMES=set()
for L in app.split('\n'):
    m=re.match(r'^(?:let|var|const)\s+(.*)$',L)
    if not m: continue
    t=m.group(1);d=0;q=None;i=0;seg=''
    while i<len(t):
        c=t[i]
        if q:
            if c=='\\': i+=2;continue
            if c==q: q=None
        elif c in '\'"`': q=c
        elif c in '([{': d+=1
        elif c in ')]}': d-=1
        elif c==',' and d==0:
            mm=re.match(r'\s*([A-Za-z_$][\w$]*)\s*=',seg)
            if mm: NAMES.add(mm.group(1))
            seg='';i+=1;continue
        elif c==';' and d==0: break
        seg+=c;i+=1
    mm=re.match(r'\s*([A-Za-z_$][\w$]*)\s*=',seg)
    if mm: NAMES.add(mm.group(1))
NAMES.discard('atlas')
NAMES=sorted(NAMES)
LOGIN="window.SW_LOGIN={name:'Spielleitung',benutzer:'sl',rolle:'sl',tokens:{eigen:'',sl:''},repo:null,root:'https://bohmaybe.github.io/Scherbenwelt-Karte/',stand:'',v:0,basis:null};window.SW_OPS=null;"
STATE=r"""(names)=>{const R={atlas:{},g:{},miss:[]};for(const k of Object.keys(atlas)){try{R.atlas[k]=swEcoHash(atlas[k])}catch(e){R.atlas[k]='ERR '+e}}
 for(const n of names){let v;try{v=(0,eval)(n)}catch(e){R.miss.push(n);continue}if(typeof v==='function')continue;
  if(n==='originalDocument')v=v.replace(/<script id="atlas-eco"[^>]*>[\s\S]*?<\/script>\n?/,'');
  if(n==='V10MAP')v=Object.assign({},v,{blob:[...v.blob.keys()]});
  if(n==='V912RK')continue;
  try{R.g[n]=swEcoHash(v)}catch(e){R.g[n]='ERR '+e}}
 try{R.eco={imp:atlas.wkl.imp?atlas.wkl.imp['Sold Legionen und Armadas']:null,net:(atlas.wkl.org.fin['Wüstenscherbe|IMPERIUM']||{}).net,sav:(atlas.wkl.org.fin['Wüstenscherbe|IMPERIUM']||{}).sav}}catch(e){R.eco=String(e)}
 R.text=swEcoHash(document.body.innerText);R.sweco={used:SWECO.used,miss:SWECO.miss,ms:Math.round(SWECO.ms)};return R}"""
async def run(path,rec):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        br=await p.chromium.launch(args=['--js-flags=--max-old-space-size=6144']);ctx=await br.new_context(viewport={'width':1500,'height':1000})
        await ctx.route(re.compile(r'^https?://'),lambda r:r.abort())
        await ctx.add_init_script(('window.SW_ECO_REC=1;' if rec else '')+(LOGIN if SLWEB else ''))
        pg=await ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)[:300]))
        t0=time.time();await pg.goto('file://'+os.path.abspath(path),timeout=900000)
        await pg.wait_for_function("()=>typeof atlas!=='undefined'&&atlas.cities&&atlas.cities.length&&typeof SWECO!=='undefined'",timeout=900000)
        tl=time.time()-t0;await pg.wait_for_timeout(8000)
        st=await pg.evaluate(STATE,NAMES);st['laden_s']=round(tl,1);st['fehler']=errs[:5]
        data=None
        if rec:
            meta=await pg.evaluate("()=>{const R=SWECO.rec;if(!R)return null;return {head:R.head,probe:R.probe,chromium:R.chromium,fail:R.fail,e:R.e.map(E=>({k:E.k,fp:E.fp,init:E.init,keys:E.keys,t:E.t,j:E.j,h:E.h,ms:E.ms,warm:E.warm,m0:E.m0,m1:E.m1}))}}")
            bufs=[]
            if meta:
                for ei,E in enumerate(meta['e']):
                    L=[]
                    for ri in range(len(E['t'])):
                        b=await pg.evaluate("([e,r])=>{const a=SWECO.rec.e[e].bufs[r];const u=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s)}",[ei,ri])
                        L.append(base64.b64decode(b))
                    bufs.append(L)
            data=(meta,bufs)
        await br.close();return st,data
def pack(meta,bufs):
    blob=bytearray();E2=[]
    for ei,E in enumerate(meta['e']):
        T=[]
        for ri,(row,b) in enumerate(zip(E['t'],bufs[ei])):
            key,sh,typ,ln=row;ref=0;raw=b
            for ej in range(ei):
                for rj,r2 in enumerate(meta['e'][ej]['t']):
                    if r2==row and len(bufs[ej][rj])==len(b): ref=[ej,rj];break
                if ref: break
            if ref:
                o=bufs[ref[0]][ref[1]];raw=bytes(x^y for x,y in zip(b,o)) if len(b)<200000 else (int.from_bytes(b,'little')^int.from_bytes(o,'little')).to_bytes(len(b),'little')
            co=zlib.compressobj(9,zlib.DEFLATED,-15);c=co.compress(raw)+co.flush()
            assert zlib.decompress(c,-15)==raw
            T.append([key,sh,typ,ln,len(blob),len(c),ref]);blob+=c
        E2.append({'k':E['k'],'fp':E['fp'],'init':E['init'],'keys':E['keys'],'t':T,'j':E['j'],'h':E['h'],'warm':E['warm'],'m0':E['m0'],'m1':E['m1']})
    D={'v':1,'head':meta['head'],'probe':meta['probe'],'chromium':meta['chromium'],'e':E2,'b':base64.b64encode(bytes(blob)).decode()}
    return D,len(blob)
def diff(a,b):
    out=[]
    for sec in ('atlas','g'):
        for k in sorted(set(a[sec])|set(b[sec])):
            if a[sec].get(k)!=b[sec].get(k): out.append(sec+'.'+k)
    if a['eco']!=b['eco']: out.append('eco')
    if a['text']!=b['text']: out.append('text')
    return out
def main():
    tmp=tempfile.mkdtemp(prefix='oeko-',dir=os.path.dirname(os.path.abspath(OUT)))
    try:
        p0=os.path.join(tmp,'ohne.html');open(p0,'w',encoding='utf-8').write(src)
        s1,(meta,bufs)=asyncio.run(run(p0,True))
        print('Aufzeichnung: laden %.1f s · Einträge %d · %s'%(s1['laden_s'],len(meta['e']) if meta else 0,('Fehler: '+meta['fail']) if meta and meta['fail'] else 'ok'))
        if s1['fehler']: print('  Seitenfehler:',s1['fehler'])
        if not meta or not meta['e'] or meta['fail']:
            open(OUT,'w',encoding='utf-8').write(src);print('KEIN STARTSPEICHER (nichts aufgezeichnet oder nicht exakt speicherbar)');return 2
        D,nb=pack(meta,bufs);txt=json.dumps(D,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
        a='<script id="atlas-ops">';assert src.count(a)==1
        out=src.replace(a,'<script id="atlas-eco" type="application/json" data-sw="oeko">'+txt+'</script>\n'+a)
        p1=os.path.join(tmp,'mit.html');open(p1,'w',encoding='utf-8').write(out)
        s2,_=asyncio.run(run(p1,False))
        d=diff(s1,s2)
        print('Verwendung: laden %.1f s (vorher %.1f s) · verwendet %d/%d · Grund %s · Startspeicher %.1f s · Größe %.1f MB'%(s2['laden_s'],s1['laden_s'],s2['sweco']['used'],len(meta['e']),s2['sweco']['miss'],s2['sweco']['ms']/1000,len(txt)/2**20))
        print('  Wirtschaft ohne:',s1['eco'],' mit:',s2['eco'])
        if s2['fehler']: print('  Seitenfehler:',s2['fehler'])
        ok=s2['sweco']['used']==len(meta['e']) and not d and s1['eco']==s2['eco'] and not s2['fehler']
        if not ok:
            print('  Abweichungen:',d[:40])
            open(OUT,'w',encoding='utf-8').write(src);print('KEIN STARTSPEICHER (Prüfung nicht bestanden) – Datei rechnet wie bisher');return 2
        open(OUT,'w',encoding='utf-8').write(out)
        print('STARTSPEICHER OK · Prüfliste: %d Atlasteile, %d Programmwerte gleich'%(len(s1['atlas']),len(s1['g'])))
        return 0
    finally:
        if os.environ.get('OEKO_KEEP'): print('  Arbeitsordner behalten:',tmp)
        else: shutil.rmtree(tmp,ignore_errors=True)
sys.exit(main())
