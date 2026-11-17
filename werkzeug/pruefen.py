# -*- coding: utf-8 -*-
"""Prüft eine gebaute Web-Fassung gegen die zugrunde liegende Spielerkarte (Chromium über Playwright).
Aufruf: python3 pruefen.py <Spielerkarte.html> <gebauter Ordner> [--schnell]
Prüft: Laden ohne Programmfehler, Voreinstellung der Boxen, Musik (Abspielweg der App), alle Compendium-Einträge
und Bilder im Vergleich zur Originaldatei (entfällt mit --schnell), Panorama-Link und Vollbild mit einem
vorübergehenden Testbild (wird danach wieder gelöscht), Teleportregel und entfernte Journalbilder in den Daten.
Endet mit 'ALLES OK' (Rückgabewert 0) oder einer Fehlerliste (Rückgabewert 1)."""
import asyncio,json,os,re,sys,threading,functools,http.server,socketserver
from playwright.async_api import async_playwright
SRC,SITE=os.path.abspath(sys.argv[1]),os.path.abspath(sys.argv[2]);FAST='--schnell' in sys.argv
HERE=os.path.dirname(os.path.abspath(__file__))
FAIL=[]
def ok(cond,msg):
    print(('  OK   ' if cond else '  FEHLER ')+msg,flush=True)
    if not cond: FAIL.append(msg)
def data(path):
    s=open(path,encoding='utf-8').read();i=s.find('id="atlas-data"');i=s.find('>',i)+1;j=s.find('</script>',i);return s,json.loads(s[i:j])
# --- Datenprüfungen ohne Browser
html,W=data(os.path.join(SITE,'index.html'));_,O=data(SRC)
KEEP=set(re.search(r'var KEEP=\{([^}]*)\}',html).group(1).replace(':1','').split(','))
MIN=int(re.search(r'var MINPOP=(\d+)',html).group(1))
ok(all(c['id'] in {x['id'] for x in W['cities']} for c in O['cities']) and len(W['cities'])==len(O['cities']),'Orte vollständig (%d)'%len(W['cities']))
ok(len(W['compendium']['articles'])==len(O['compendium']['articles']),'Compendium-Einträge vollständig (%d)'%len(W['compendium']['articles']))
J=W['sl7']['journal'];ok(not any(e.get('t')=='legend' and e.get('img') for e in J['e']),'Journal: keine Bilder an Einträgen „Legendäre Kreatur“')
ok(len(J['e'])==len(O['sl7']['journal']['e']),'Journal: alle Einträge vorhanden (%d)'%len(J['e']))
cb={(c['shard'],c.get('sourceId')):c for c in W['cities']};vis=set(W.get('visited') or [])
T=None
for k,v in W.items():
    if isinstance(v,dict) and isinstance(v.get('tp'),list) and v['tp'] and 'tg' in v['tp'][0]: T=v['tp']
byId={t['id']:t for t in T};pub={t['sid']:t for t in T if t['status']=='Öffentlich'};bad=0;n=0
for t in T:
    for g in t['tg']:
        u=byId.get(g) or pub.get(g)
        if not u: continue
        n+=1;a,b=cb.get((t['shard'],t['sid'])),cb.get((u['shard'],u['sid']));la,lb=(a or {}).get('loyalty'),(b or {}).get('loyalty')
        if la in('Tendenz Loyal','Imperiumstreu') or lb in('Tendenz Loyal','Imperiumstreu') or not(la=='Widerstand' or lb=='Widerstand' or (a and b and a['id'] in vis and b['id'] in vis)): bad+=1
ok(bad==0,'Teleportregel eingehalten (%d Ziele)'%n)
ok(not re.search(r'data:(image/(jpeg|webp|png)|audio/mpeg);base64,[A-Za-z0-9+/]{30000}',html),'keine großen eingebetteten Medien mehr in index.html')
miss=[f for f in set(re.findall(r'a/[0-9a-f]{16}\.(?:webp|jpg|png|gif|mp3)',html)) if not os.path.isfile(os.path.join(SITE,f))]
ok(not miss,'alle verwiesenen Dateien in a/ vorhanden'+(' – fehlen: %s'%miss[:5] if miss else ''))
ok(os.path.getsize(os.path.join(SITE,'index.html'))<95*1024*1024,'index.html unter 95 MB (GitHub-Grenze 100 MB)')
# --- lokaler Server
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=SITE));srv.daemon_threads=True
PORT=srv.server_address[1];threading.Thread(target=srv.serve_forever,daemon=True).start();URL='http://127.0.0.1:%d/'%PORT
WAIT="()=>typeof atlas!=='undefined'&&atlas.cities&&atlas.cities.length"
COMP="""async([a0,a1])=>{const A=atlas.compendium.articles.slice(a0,a1);const per=[];for(const a of A){try{compOpenArticle(a.id)}catch(e){per.push('ERR');continue}per.push(document.querySelectorAll('#compendium img, .comp-page img').length+'/'+document.querySelectorAll('figure.comp-fig img').length+'/'+(v10CrestOn(a)?1:0))}return per}"""
async def comp(pg):
    await pg.evaluate("()=>{$('tabComp').click()}");await pg.wait_for_timeout(600);N=await pg.evaluate("()=>atlas.compendium.articles.length");per=[]
    for a0 in range(0,N,150): per+=await pg.evaluate(COMP,[a0,a0+150])
    return per
async def run():
    async with async_playwright() as p:
        br=await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        for name,kw in [('PC',dict(viewport={'width':1400,'height':900})),('Handy',dict(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2))]:
            print('Browser',name,flush=True)
            ctx=await br.new_context(**kw);pg=await ctx.new_page();errs=[];nf=[]
            pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
            pg.on('response',lambda r:r.status>=400 and '/panorama/' not in r.url and nf.append('%d %s'%(r.status,r.url[-60:])))
            await pg.goto(URL,timeout=600000);await pg.wait_for_function(WAIT,timeout=600000);await pg.wait_for_timeout(3500)
            st=await pg.evaluate("()=>[...document.querySelectorAll('aside input[type=checkbox]')].filter(e=>!e.disabled).map(e=>[e.id,e.checked])")
            wrong=[i for i,c in st if c!=(i in KEEP)];ok(not wrong,'Boxen-Voreinstellung (%d Boxen)'%len(st)+(' – abweichend: %s'%wrong[:8] if wrong else ''))
            if name=='PC':
                try:
                    if await pg.locator('#v923Gate').is_visible(): await pg.locator('#v923Gate').click(timeout=5000)
                except Exception: pass
                m=await pg.evaluate("""async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));await w(2500);if(!V923.ctx&&typeof v923Init==='function')v923Init();await w(500);const ks=Object.keys(atlas.music||{});const out=[];for(const k of ks.slice(0,3)){try{const b=await v925Buf(k);out.push(b.duration>5);V923.buf.delete(k)}catch(e){out.push(false)}}return [ks.length,out]}""")
                ok(m[0]>0 and all(m[1]),'Musik ladbar und dekodierbar (%d Stücke, %d geprüft)'%(m[0],len(m[1])))
            # Panorama mit Testbild
            cand=await pg.evaluate("(m)=>{const c=atlas.cities.filter(c=>(c.population||0)>=m).sort((a,b)=>b.population-a.population);const s=atlas.cities.find(c=>(c.population||0)>0&&(c.population||0)<m);return [c[0].name,c[0].sourceId||c[0].id,s.name]}",MIN)
            pdir=os.path.join(SITE,'panorama');os.makedirs(pdir,exist_ok=True);tf=os.path.join(pdir,cand[1].lower()+'.webp');pre=os.path.exists(tf)
            if not any(os.path.splitext(f)[0].upper()==cand[1].upper() for f in os.listdir(pdir)):
                from PIL import Image;Image.new('RGB',(1200,500),(40,70,50)).save(tf,'WEBP')
            else: tf=None
            try:
                r=await pg.evaluate("""async([big,small])=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const sh=nm=>atlas.cities.find(c=>c.name===nm);const go=async c=>{if($('shard').value!==c.shard){$('shard').value=c.shard;loadShard(c.shard);await w(1800)}showCard('city',c);await w(1200)};
                  const out={};await go(sh(big));const a=document.querySelector('#info .pano-link');out.link=!!a&&!a.classList.contains('hidden');if(!out.link)return out;
                  const c0=map.getCenter(),z0=map.getZoom();a.click();await w(800);const v=$('panoView'),R=v.getBoundingClientRect();out.voll=!v.classList.contains('hidden')&&R.width>=innerWidth-1&&R.height>=innerHeight-1&&v.querySelector('img').naturalWidth>0;
                  v.querySelector('.pano-x').click();await w(500);const c1=map.getCenter();out.zu=v.classList.contains('hidden')&&Math.abs(c1.lat-c0.lat)<1e-9&&Math.abs(c1.lng-c0.lng)<1e-9&&map.getZoom()===z0&&!$('info').classList.contains('hidden');
                  await go(sh(small));const b=document.querySelector('#info .pano-link');out.klein=!b;return out}""",[cand[0],cand[2]])
                ok(r.get('link'),'Panorama-Link bei %s (Testbild in Kleinschreibung)'%cand[0])
                ok(r.get('voll'),'Panorama als Vollbild über der Karte');ok(r.get('zu'),'Schließen mit X, Karte unverändert');ok(r.get('klein'),'kein Panorama-Link unter %d Einwohnern (%s)'%(MIN,cand[2]))
            finally:
                if tf and os.path.exists(tf) and not pre: os.remove(tf)
            if name=='PC' and not FAST:
                web=await comp(pg)
                c2=await br.new_context(viewport={'width':1400,'height':900});po=await c2.new_page();await po.goto('file://'+SRC,timeout=900000);await po.wait_for_function(WAIT,timeout=900000);await po.wait_for_timeout(3000)
                org=await comp(po);await c2.close();d=[i for i,(x,y) in enumerate(zip(org,web)) if x!=y]
                ok(len(org)==len(web) and not d,'Compendium: %d Einträge mit Bildern und Wappen wie im Original'%len(web)+(' – Abweichung bei %s'%d[:8] if d else ''))
            ok(not errs,'keine Programmfehler'+(' – %s'%errs[:3] if errs else ''));ok(not nf,'keine fehlenden Dateien'+(' – %s'%nf[:3] if nf else ''))
            await ctx.close()
        await br.close()
asyncio.run(run());srv.shutdown()
print('\nALLES OK' if not FAIL else '\n%d FEHLER:\n- '%len(FAIL)+'\n- '.join(FAIL));sys.exit(1 if FAIL else 0)
