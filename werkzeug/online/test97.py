import asyncio,os,re,json,base64,hashlib,time,sys
from playwright.async_api import async_playwright
S=sys.argv[1];ROOT={'BoHMaybe/scherbenwelt-sl':S+'/sl98/','BoHMaybe/scherbenwelt-bernd':S+'/rep98/bernd/'}
ACC={'EIG':{'BoHMaybe/scherbenwelt-bernd':'rw'},'SLR':{'BoHMaybe/scherbenwelt-sl':'r'},'SLG':'all'}
async def api(route):
    rq=route.request;m=re.search(r'/repos/([^/]+/[^/]+)/contents/([^?]+)',rq.url);repo,path=m.group(1),m.group(2);H={'access-control-allow-origin':'*','content-type':'application/json'}
    tok=(rq.headers.get('authorization') or '').replace('Bearer ','');a=ACC.get(tok);w=rq.method=='PUT'
    if repo not in ROOT or not a or (a!='all' and (repo not in a or (w and a[repo]!='rw'))):return await route.fulfill(status=404 if not w else 403,body='{}',headers=H)
    f=ROOT[repo]+path
    if rq.method=='GET':
        if not os.path.isfile(f):return await route.fulfill(status=404,body='{}',headers=H)
        c=open(f,'rb').read()
        if 'raw' in (rq.headers.get('accept') or ''):return await route.fulfill(status=200,body=c,headers=H)
        return await route.fulfill(status=200,body=json.dumps({'sha':hashlib.sha1(c).hexdigest(),'size':len(c),'content':base64.b64encode(c).decode() if len(c)<1e6 else ''}),headers=H)
    b=json.loads(rq.post_data);cur=hashlib.sha1(open(f,'rb').read()).hexdigest() if os.path.isfile(f) else None
    if (b.get('sha') or None)!=cur:return await route.fulfill(status=409,body='{}',headers=H)
    c=base64.b64decode(b['content']);os.makedirs(os.path.dirname(f),exist_ok=True);open(f,'wb').write(c)
    return await route.fulfill(status=200,body=json.dumps({'content':{'sha':hashlib.sha1(c).hexdigest()}}),headers=H)
async def login(b,dev,u,pw):
    c=await b.new_context(**dev);await c.route('https://api.github.com/**',api);pg=await c.new_page();er=[];pg.on('pageerror',lambda e:er.append(str(e)));pg.on('dialog',lambda d:asyncio.ensure_future(d.accept()))
    await pg.goto('http://localhost:8098/');await pg.fill('#u',u);await pg.fill('#p',pw);await pg.click('#b')
    await pg.wait_for_function("typeof atlas!=='undefined'&&document.getElementById('tabSheets')",timeout=200000);await pg.wait_for_timeout(2500);return c,pg,er
async def sub(pg,k):await pg.evaluate("$('tabSheets').click()");await pg.wait_for_timeout(600);await pg.evaluate("k=>document.querySelector('[data-v1095sub='+k+']').click()",k);await pg.wait_for_timeout(2500)
rj=lambda p:json.load(open(p)) if os.path.exists(p) else None
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch();ph=p.devices['iPhone 13'];pc={'viewport':{'width':1440,'height':900}}
    # ---------- Spieler: Heere, Antrag, Gebäude, Schiff
    c,pg,er=await login(b,ph,'bernd','pw-bernd-test');await sub(pg,'heere')
    print('Spieler Heere:',await pg.evaluate("[...document.querySelectorAll('.v1097card .v1097hd b')].map(x=>x.textContent)"),'| Modellwerte-Zeilen',await pg.evaluate("document.querySelectorAll('.v1097det tr').length"))
    await pg.screenshot(path=S+'/v1095b/t97_heere.png',full_page=False)
    await pg.evaluate("document.querySelector('[data-v1097a=antrag][data-id=\"CU-A01\"]').click()");await pg.wait_for_timeout(500)
    await pg.fill('[data-f=\"v.Waffen\"]','35');await pg.fill('[data-f=\"res.30\"]','250');await pg.fill('[data-f=text]','Bessere Klingen aus Sladena');await pg.evaluate("document.querySelector('[data-v1097form] button[type=submit]').click()");await pg.wait_for_timeout(2500)
    await pg.evaluate("document.querySelector('[data-v1097a=antrag][data-id=\"FH-0503\"]').click()");await pg.wait_for_timeout(500)
    await pg.select_option('[data-f=ziel]','WAL-S019');await pg.evaluate("document.querySelector('[data-v1097form] button[type=submit]').click()");await pg.wait_for_timeout(2500)
    H=rj(S+'/rep98/bernd/boegen/heere.json');print(' Anträge im Repo:',[(x['heer'],x['neu']) for x in H['antraege']])
    print(' Spieler sieht:',await pg.evaluate("[...document.querySelectorAll('.v1097ant .v1097hd span')].map(x=>x.textContent)"))
    await sub(pg,'gebaeude');await pg.evaluate("document.querySelector('[data-v1097a=gneu]').click()");await pg.wait_for_timeout(500)
    await pg.select_option('[data-gf=ort]','WAL-S003');await pg.wait_for_timeout(400)
    for f,v in [('name','Schmiede Bernd'),('art','Schmiede'),('menge','100'),('gewinn','1000')]:await pg.fill('[data-gf='+f+']',v)
    await pg.evaluate("document.querySelector('[data-gf=gewinn]').dispatchEvent(new Event('change',{bubbles:true}))");await pg.wait_for_timeout(500)
    print(' Gebäude Sladena:',await pg.evaluate("[...document.querySelectorAll('.v1097geb .v1097t b')].map(x=>x.textContent)"),'| Lage',await pg.evaluate("document.querySelector('.v1097geb .v1097t td').textContent"))
    await pg.evaluate("document.querySelector('[data-v1097a=gsave]').click()");await pg.wait_for_timeout(2500)
    print(' Gebäude im Repo:',[(g['name'],g['ort'],g['menge'],g['gewinn']) for g in rj(S+'/rep98/bernd/boegen/gebaeude.json')['gebaeude']],'| Stempel:',await pg.evaluate("(document.querySelector('#v1097gstamp')||{}).textContent"))
    await pg.screenshot(path=S+'/v1095b/t97_geb.png',full_page=False)
    await sub(pg,'schiffe');await pg.evaluate("document.querySelector('[data-v1086a=new]').click()");await pg.wait_for_timeout(500);await pg.fill('[data-v1086f=name]','Sturmvogel');await pg.wait_for_timeout(300)
    await pg.evaluate("document.querySelector('[data-v1095a=save]').click()");await pg.wait_for_timeout(3000)
    print(' Schiff Stempel:',await pg.evaluate("(document.querySelector('.v1097stampbox')||{}).textContent"),'| Fehler',er[:3]);await c.close()
    # ---------- SL: Prüfen, Genehmigen, Freigeben
    c,pg,er=await login(b,pc,'sl','pw-sl-test');await pg.evaluate("$('tabSheets').click()");await pg.wait_for_timeout(6000)
    print('SL Reiter:',await pg.evaluate("$('tabSheets').textContent"),'|',await pg.evaluate("[...document.querySelectorAll('[data-v1095sub]')].map(x=>x.textContent)"))
    await sub(pg,'heere');await pg.wait_for_timeout(3000)
    print(' Anträge sichtbar:',await pg.evaluate("document.querySelectorAll('.v1097ant').length"),'| vorher Waffen',await pg.evaluate("atlas.sl7.cust.a['CU-A01'].v.Waffen"),'Pos FH-0503',await pg.evaluate("JSON.stringify(atlas.sl7.pos['FH-0503']||null)"))
    await pg.screenshot(path=S+'/v1095b/t97_sl_heere.png',full_page=False)
    for i in range(2):
        await pg.evaluate("document.querySelector('[data-v1097a=genehmigen]').click()");await pg.wait_for_timeout(3500)
    print(' nachher Waffen',await pg.evaluate("atlas.sl7.cust.a['CU-A01'].v.Waffen"),'Reserve30',await pg.evaluate("atlas.sl7.cust.a['CU-A01'].res['30']"),'Pos FH-0503',await pg.evaluate("JSON.stringify(atlas.sl7.pos['FH-0503'])"),'Heer-Wert',await pg.evaluate("(()=>{const a=atlas.armies.find(x=>x.id==='CU-A01');return a.vals[FORCE_COLS.army.indexOf('Waffen 0–100')]})()"))
    F=rj(S+'/sl98/online/freigaben.json');print(' freigaben antraege:',{k:[x['status'] for x in v.values()] for k,v in F['antraege'].items()})
    await pg.wait_for_function("V1096.seq>0",timeout=40000);print(' Online-Abgleich gespeichert, seq',await pg.evaluate("V1096.seq"))
    await sub(pg,'gebaeude');await pg.wait_for_timeout(2500);await pg.evaluate("document.querySelector('[data-v1097a=frei]').click()");await pg.wait_for_timeout(3000)
    print(' Gebäude-Stempel SL:',await pg.evaluate("(document.querySelector('#v1097gstamp')||{}).textContent"))
    await sub(pg,'schiffe');await pg.select_option('#v1095Ziel','bernd');await pg.wait_for_timeout(3000);await pg.fill('.v1097slbox [data-v1097hinw]','Passt so');await pg.evaluate("document.querySelector('[data-v1097a=frei]').click()");await pg.wait_for_timeout(3000)
    print(' Schiff-Stempel SL:',await pg.evaluate("(document.querySelector('.v1097stampbox')||{}).textContent"),'| Fehler',er[:3]);await pg.screenshot(path=S+'/v1095b/t97_sl_schiff.png',full_page=False);await c.close()
    # ---------- Spieler erneut: Stempel sichtbar, Waffe ändern nimmt Stempel weg
    c,pg,er=await login(b,ph,'bernd','pw-bernd-test');await sub(pg,'schiffe');await pg.wait_for_timeout(1500)
    print('Spieler Schiff:',await pg.evaluate("(document.querySelector('.v1097stampbox')||{}).textContent"))
    await pg.screenshot(path=S+'/v1095b/t97_stempel.png',full_page=False)
    await pg.evaluate("()=>{const s=V1086.list[0];s.lauf=s.lauf||{};s.lauf.mp=1;v1086Save();v911Render()}");await pg.wait_for_timeout(1500)
    print(' nach Laufwert-Änderung:',await pg.evaluate("(document.querySelector('.v1097stampbox')||{}).textContent"))
    await pg.evaluate("()=>{const s=V1086.list[0];s.gr=(+s.gr||1)+1;v1086Save();v911Render()}");await pg.wait_for_timeout(1500)
    print(' nach Größen-Änderung:',await pg.evaluate("(document.querySelector('.v1097stampbox')||{}).textContent"))
    await sub(pg,'gebaeude');await pg.wait_for_timeout(1500);print(' Gebäude:',await pg.evaluate("(document.querySelector('#v1097gstamp')||{}).textContent"))
    await sub(pg,'heere');await pg.wait_for_timeout(2500);print(' Anträge:',await pg.evaluate("[...document.querySelectorAll('.v1097ant .v1097hd span')].map(x=>x.textContent)"),'| Fehler',er[:3])
    await b.close()
asyncio.run(main())
