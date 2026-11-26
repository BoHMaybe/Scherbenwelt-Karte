import asyncio,os,re,json,base64,hashlib,time,sys
from playwright.async_api import async_playwright
S=sys.argv[1];SL=S+'/sl96/';STORE={};LOG=[]
TOK={'EIG':{'BoHMaybe/scherbenwelt-bernd':'rw'},'SLR':{'BoHMaybe/scherbenwelt-sl':'r'},'SLG':'all'}
def acc(tok,repo,w):
    t=TOK.get(tok)
    if t=='all':return True
    if not t or repo not in t:return False
    return t[repo]=='rw' or not w
async def api(route):
    rq=route.request;u=rq.url;m=re.search(r'/repos/([^/]+/[^/]+)/contents/([^?]+)',u);repo,path=m.group(1),m.group(2)
    tok=(rq.headers.get('authorization') or '').replace('Bearer ','');w=rq.method=='PUT';LOG.append((tok,rq.method,repo,path))
    H={'access-control-allow-origin':'*','content-type':'application/json'}
    if not acc(tok,repo,w):return await route.fulfill(status=404 if not w else 403,body='{}',headers=H)
    if repo=='BoHMaybe/scherbenwelt-sl':
        f=SL+path
        if os.path.exists(f):
            if 'raw' in (rq.headers.get('accept') or ''):return await route.fulfill(status=200,body=open(f,'rb').read(),headers=H)
            c=open(f,'rb').read();return await route.fulfill(status=200,body=json.dumps({'sha':hashlib.sha1(c).hexdigest(),'content':base64.b64encode(c).decode()}),headers=H)
        return await route.fulfill(status=404,body='{}',headers=H)
    k=(repo,path)
    if rq.method=='GET':
        if k not in STORE:return await route.fulfill(status=404,body='{}',headers=H)
        c,sha=STORE[k];return await route.fulfill(status=200,body=json.dumps({'sha':sha,'content':base64.b64encode(c).decode()}),headers=H)
    if rq.method=='PUT':
        b=json.loads(rq.post_data);cur=STORE.get(k,(None,None))[1]
        if (b.get('sha') or None)!=cur:return await route.fulfill(status=409,body='{"message":"sha mismatch"}',headers=H)
        c=base64.b64decode(b['content']);sha=hashlib.sha1(c+str(time.time()).encode()).hexdigest();STORE[k]=(c,sha)
        assert b['committer']['email']=='atlas@scherbenwelt.invalid'
        return await route.fulfill(status=200,body=json.dumps({'content':{'sha':sha}}),headers=H)
    return await route.fulfill(status=405,body='{}',headers=H)
def schiffe(repo='BoHMaybe/scherbenwelt-bernd'):
    x=STORE.get((repo,'boegen/schiffe.json'));return [s['name'] for s in json.loads(x[0])['schiffe']] if x else None
async def login(c,u,pw):
    pg=await c.new_page();er=[];pg.on('pageerror',lambda e:er.append(str(e)));pg.on('dialog',lambda d:asyncio.ensure_future(d.accept()))
    await pg.goto('http://localhost:8096/');await pg.fill('#u',u);await pg.fill('#p',pw);await pg.click('#b')
    await pg.wait_for_function("typeof atlas!=='undefined'&&document.getElementById('tabSheets')",timeout=200000);await pg.wait_for_timeout(1500)
    return pg,er
async def st(pg):return await pg.evaluate("(document.getElementById('v1095St')||{}).innerText||''")
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    # ---- Spieler
    c=await b.new_context(**p.devices['iPhone 13']);await c.route('https://api.github.com/**',api)
    pg,er=await login(c,'bernd','pw-bernd-test')
    await pg.evaluate("$('tabSheets').click()");await pg.wait_for_timeout(1500)
    print('Spieler Modus',await pg.evaluate("[V1095.mode,V1095.ziel,document.querySelector('#tablesView h2').textContent,$('tabSheets').getAttribute('aria-selected'),$('tabTables').getAttribute('aria-selected')]"),'|',await st(pg))
    await pg.evaluate("document.querySelector('[data-v1086a=new]').click()");await pg.wait_for_timeout(300)
    await pg.fill('[data-v1086f=name]','Sturmvogel');await pg.wait_for_timeout(200)
    await pg.evaluate("document.querySelector('[data-v1086a=new]').click()");await pg.wait_for_timeout(300)
    await pg.fill('[data-v1086f=name]','Eisenmöwe');await pg.wait_for_timeout(200)
    print(' vor Autosave:',await st(pg),'| Speicher:',schiffe())
    await pg.wait_for_timeout(17000);print(' nach 17 s:',await st(pg),'| Speicher:',schiffe())
    await pg.screenshot(path=S+'/v1095b/on_spieler.png')
    await pg.reload();await pg.wait_for_function("typeof atlas!=='undefined'&&document.getElementById('tabSheets')",timeout=200000);await pg.wait_for_timeout(1000)
    await pg.evaluate("$('tabSheets').click()");await pg.wait_for_timeout(1500)
    print(' nach Neuladen:',await pg.evaluate("V1086.list.map(x=>x.name)"),'|',await st(pg))
    await pg.evaluate("document.querySelector('[data-v1086a=del]').click()");await pg.wait_for_timeout(500)
    await pg.evaluate("document.querySelector('[data-v1095a=save]').click()");await pg.wait_for_timeout(1500)
    print(' nach Löschen + Jetzt speichern:',schiffe(),'|',await st(pg))
    print(' Tabellen ohne Schiffsbogen:',await pg.evaluate("$('tabTables').click(),!document.querySelector('[data-v914tab=ship]')"))
    repos=sorted(set((t,r) for t,m,r,pa in LOG));print(' Zugriffe:',repos,'Fehler',er[:3]);await c.close()
    # ---- SL
    LOG.clear();c=await b.new_context(viewport={'width':1440,'height':900});await c.route('https://api.github.com/**',api)
    pg,er=await login(c,'sl','pw-sl-test')
    await pg.evaluate("$('tabSheets').click()");await pg.wait_for_timeout(1200)
    print('SL Modus',await pg.evaluate("[V1095.mode,V1095.ziel,[...document.querySelectorAll('#v1095Ziel option')].map(o=>o.textContent)]"))
    await pg.select_option('#v1095Ziel','bernd');await pg.wait_for_timeout(1500)
    print(' Bernd:',await pg.evaluate("V1086.list.map(x=>x.name)"),'|',await st(pg))
    await pg.fill('[data-v1086f=name]','Sturmvogel II');await pg.wait_for_timeout(200)
    # Konflikt: Speicher wird inzwischen anders geändert
    k=('BoHMaybe/scherbenwelt-bernd','boegen/schiffe.json');STORE[k]=(STORE[k][0],'fremd123')
    await pg.evaluate("document.querySelector('[data-v1095a=save]').click()");await pg.wait_for_timeout(2000)
    print(' SL ändert (mit Konflikt):',schiffe(),'|',await st(pg))
    await pg.evaluate("document.querySelector('[data-v1095a=import]').click()");await pg.wait_for_timeout(3000)
    print(' Online-Stand übernommen:',await pg.evaluate("Object.fromEntries(Object.entries(atlas.online.schiffe).map(([k,v])=>[k,v.liste.length]))"),'| in Spielerdatei:',await pg.evaluate("'online' in playerPayload(atlas)"))
    await pg.screenshot(path=S+'/v1095b/on_sl.png');print(' Fehler',er[:3]);await b.close()
asyncio.run(main())
