import asyncio,os,re,json,base64,hashlib,time,sys,subprocess
from playwright.async_api import async_playwright
S=sys.argv[1];SL=S+'/sl97/';PH=sys.argv[2]   # Phase: sl | spieler | lokal
LOG=[]
async def api(route):
    rq=route.request;u=rq.url;m=re.search(r'/repos/([^/]+/[^/]+)/contents/([^?]+)',u);repo,path=m.group(1),m.group(2)
    H={'access-control-allow-origin':'*','content-type':'application/json'};tok=(rq.headers.get('authorization') or '').replace('Bearer ','')
    LOG.append((tok,rq.method,repo,path))
    if repo!='BoHMaybe/scherbenwelt-sl':return await route.fulfill(status=404,body='{}',headers=H)
    if tok not in ('SLG','SLR') or (rq.method=='PUT' and tok!='SLG'):return await route.fulfill(status=403,body='{}',headers=H)
    f=SL+path
    if rq.method=='GET':
        if not os.path.isfile(f):return await route.fulfill(status=404,body='{}',headers=H)
        c=open(f,'rb').read()
        if 'raw' in (rq.headers.get('accept') or ''):return await route.fulfill(status=200,body=c,headers=H)
        return await route.fulfill(status=200,body=json.dumps({'sha':hashlib.sha1(c).hexdigest(),'size':len(c),'content':base64.b64encode(c).decode() if len(c)<1e6 else ''}),headers=H)
    if rq.method=='PUT':
        b=json.loads(rq.post_data);cur=hashlib.sha1(open(f,'rb').read()).hexdigest() if os.path.isfile(f) else None
        if (b.get('sha') or None)!=cur:return await route.fulfill(status=409,body='{}',headers=H)
        c=base64.b64decode(b['content']);os.makedirs(os.path.dirname(f),exist_ok=True);open(f,'wb').write(c)
        return await route.fulfill(status=200,body=json.dumps({'content':{'sha':hashlib.sha1(c).hexdigest()}}),headers=H)
async def login(c,u,pw):
    pg=await c.new_page();er=[];pg.on('pageerror',lambda e:er.append(str(e)));pg.on('dialog',lambda d:asyncio.ensure_future(d.accept()))
    await pg.goto('http://localhost:8097/');await pg.fill('#u',u);await pg.fill('#p',pw);await pg.click('#b')
    await pg.wait_for_function("typeof atlas!=='undefined'&&document.getElementById('tabSheets')",timeout=200000);await pg.wait_for_timeout(1500)
    return pg,er
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    if PH=='sl':
        c=await b.new_context(viewport={'width':1440,'height':900});await c.route('https://api.github.com/**',api)
        pg,er=await login(c,'sl','pw-sl-test');await pg.wait_for_timeout(4000)
        print('SL aktiv:',await pg.evaluate("[V1096.an,V1096.basis,V1096.seq,(document.getElementById('v1096t')||{}).textContent]"))
        await pg.evaluate("()=>{atlas.sl7.pos['FH-0503']=[311,222];atlas.sl7.show['army:FH-0001']=1;v7Dirty++}")
        await pg.mouse.click(700,500);t0=time.time()
        await pg.wait_for_function("V1096.seq>0",timeout=40000);print('online gespeichert nach %.0f s'%(time.time()-t0),await pg.evaluate("(document.getElementById('v1096t')||{}).textContent"))
        A=json.load(open(SL+'online/aenderungen.json'));print(' aenderungen.json: seq',A['seq'],'ops',[(o['p'],o.get('v')) for o in A['ops']][:5])
        await pg.evaluate("v1096Pub()");await pg.wait_for_timeout(2000)
        print(' veroeffentlichen.json:',open(SL+'online/veroeffentlichen.json').read(),'| Status:',await pg.evaluate("(document.getElementById('v1096t')||{}).textContent"))
        # Pause-Schalter
        await pg.evaluate("()=>{const p=document.getElementById('v1096p');p.checked=true;p.dispatchEvent(new Event('change'))}")
        await pg.evaluate("()=>{atlas.sl7.pos['FH-0512']=[100,100];v7Dirty++}");await pg.mouse.click(700,500);await pg.wait_for_function("V1096.seq>3",timeout=40000);await pg.wait_for_timeout(500)
        print(' mit Pause:',await pg.evaluate("[V1096.seq,V1096.angestossen,!!V1096.pTimer,(document.getElementById('v1096t')||{}).textContent]"))
        await pg.evaluate("()=>{const p=document.getElementById('v1096p');p.checked=false;p.dispatchEvent(new Event('change'))}");await pg.wait_for_timeout(2000)
        print(' Pause gelöst:',json.load(open(SL+'online/veroeffentlichen.json')),await pg.evaluate("V1096.angestossen"))
        await pg.screenshot(path=S+'/v1095b/flow_sl.png');print(' Fehler',er[:3])
    if PH=='spieler':
        c=await b.new_context(**p.devices['iPhone 13']);await c.route('https://api.github.com/**',api)
        pg,er=await login(c,'bernd','pw-bernd-test')
        r=await pg.evaluate("()=>({ops:window.SW_OPS_APPLIED,v:SW_LOGIN.v,armies:atlas.armies.map(a=>a.id),pos:(atlas.sl7&&atlas.sl7.pos||{})['FH-0503']||null,pos512:(atlas.sl7&&atlas.sl7.pos||{})['FH-0512']||null})")
        print('Spieler: angewendet',r['ops'],'v',r['v'],'FH-0001 sichtbar',('FH-0001' in r['armies']),'Heere',len(r['armies']),'Pos FH-0503',r['pos'],'Pos FH-0512',r['pos512'],'Fehler',er[:3])
        # SL-Neuladen übernimmt eigene Änderungen
        c2=await b.new_context(viewport={'width':1200,'height':800});await c2.route('https://api.github.com/**',api)
        pg2,er2=await login(c2,'sl','pw-sl-test')
        print('SL neu geladen:',await pg2.evaluate("[window.SW_OPS_APPLIED,atlas.sl7.pos['FH-0503'],atlas.sl7.show['army:FH-0001']]"),er2[:2])
    if PH=='lokal':
        c=await b.new_context();await c.route('https://api.github.com/**',api)
        await c.add_init_script("try{localStorage.setItem('scherbenweltSLSchluessel','SLG')}catch(e){}")
        pg=await c.new_page();er=[];pg.on('pageerror',lambda e:er.append(str(e)))
        await pg.goto('file://'+S+'/out/Scherbenwelt_Atlas_Arbeitsstand_v10_96.html',timeout=600000)
        await pg.wait_for_function("typeof atlas!=='undefined'&&atlas.onlineImport",timeout=600000);await pg.wait_for_timeout(6000)
        print('Lokal übernommen:',await pg.evaluate("[atlas.onlineImport,atlas.sl7.pos['FH-0503'],atlas.sl7.show['army:FH-0001'],$('notice').textContent]"),er[:3])
    await b.close()
asyncio.run(main())
