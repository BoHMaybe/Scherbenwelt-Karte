import asyncio,os,re,json,base64,hashlib,time,sys,threading,functools,http.server,socketserver
from playwright.async_api import async_playwright
S=sys.argv[1]
ROOT={'BoHMaybe/scherbenwelt-sl':S+'/sl_t100/','BoHMaybe/scherbenwelt-tisch':S+'/tisch_t100/'}
for n in ['bernd','drew','tink','slevin','haraku','blutaar','gast1','gast2']: ROOT['BoHMaybe/scherbenwelt-'+n]=S+'/rep100/'+n+'/'
ACC={'EIG':{'BoHMaybe/scherbenwelt-bernd':'rw','BoHMaybe/scherbenwelt-tisch':'rw'},'SLR':{'BoHMaybe/scherbenwelt-sl':'r'},'SLG':'all'}
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(Q,directory=S+'/site_t100'));srv.daemon_threads=True;threading.Thread(target=srv.serve_forever,daemon=True).start();URL='http://localhost:%d/'%srv.server_address[1]
N={'put':0,'get':0}
async def api(route):
    rq=route.request;m=re.search(r'/repos/([^/]+/[^/]+)/contents/?([^?]*)',rq.url);repo,path=m.group(1),m.group(2);H={'access-control-allow-origin':'*','content-type':'application/json'}
    tok=(rq.headers.get('authorization') or '').replace('Bearer ','');a=ACC.get(tok);w=rq.method=='PUT'
    if repo not in ROOT or not a or (a!='all' and (repo not in a or (w and a[repo]!='rw'))):return await route.fulfill(status=404 if not w else 403,body='{}',headers=H)
    f=ROOT[repo]+path
    if rq.method=='GET':
        N['get']+=1
        if os.path.isdir(f):
            L=[{'name':x,'path':path+'/'+x,'type':'dir' if os.path.isdir(f+'/'+x) else 'file','sha':hashlib.sha1(open(f+'/'+x,'rb').read()).hexdigest() if os.path.isfile(f+'/'+x) else 'd'} for x in sorted(os.listdir(f))]
            return await route.fulfill(status=200,body=json.dumps(L),headers=H)
        if not os.path.isfile(f):return await route.fulfill(status=404,body='{}',headers=H)
        c=open(f,'rb').read()
        if 'raw' in (rq.headers.get('accept') or ''):return await route.fulfill(status=200,body=c,headers=H)
        return await route.fulfill(status=200,body=json.dumps({'sha':hashlib.sha1(c).hexdigest(),'size':len(c),'content':base64.b64encode(c).decode() if len(c)<1e6 else ''}),headers=H)
    if w:
        N['put']+=1;b=json.loads(rq.post_data);cur=hashlib.sha1(open(f,'rb').read()).hexdigest() if os.path.isfile(f) else None
        if (b.get('sha') or None)!=cur:return await route.fulfill(status=409,body='{}',headers=H)
        c=base64.b64decode(b['content']);os.makedirs(os.path.dirname(f),exist_ok=True);open(f,'wb').write(c)
        return await route.fulfill(status=200,body=json.dumps({'content':{'sha':hashlib.sha1(c).hexdigest()}}),headers=H)
async def login(c,u,pw):
    pg=await c.new_page();er=[];pg.on('pageerror',lambda e:er.append(str(e)[:300]));pg.on('dialog',lambda d:asyncio.ensure_future(d.accept()))
    await pg.goto(URL);await pg.fill('#u',u);await pg.fill('#p',pw);await pg.click('#b')
    await pg.wait_for_function("typeof atlas!=='undefined'&&document.getElementById('swTisch')",timeout=300000);await pg.wait_for_timeout(3500)
    return pg,er
def J(p): return json.load(open(p))
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    cb=await b.new_context(**p.devices['iPhone 13']);await cb.route('https://api.github.com/**',api)
    pb,eb=await login(cb,'bernd','pw-bernd-test')
    print('Spieler:',await pb.evaluate("[V1100.mode,V1100.ich,V1100.name,!!document.getElementById('swBtnC'),getComputedStyle(document.documentElement).getPropertyValue('--swb')]"))
    await pb.screenshot(path=S+'/v1100/b_start.png')
    # offener und verdeckter Wurf über das Fenster
    await pb.evaluate("$('swBtnW').click()");await pb.wait_for_timeout(300)
    await pb.evaluate("()=>{const f=document.querySelector('[data-sw-f=l]');f.value='Aus Würfeltabelle';f.dispatchEvent(new Event('input',{bubbles:true}))}")
    await pb.evaluate("document.querySelector('[data-sw-s=\"12\"]').click()");await pb.wait_for_timeout(100)
    await pb.evaluate("document.querySelector('[data-sw-go]').click()");await pb.wait_for_timeout(700);await pb.screenshot(path=S+'/v1100/b_anim.png');await pb.wait_for_timeout(2500)
    await pb.evaluate("document.querySelector('[data-sw-vis=verdeckt]').click()");await pb.wait_for_timeout(100)
    await pb.evaluate("()=>{const f=document.querySelector('[data-sw-f=l]');f.value='Heimlich lauschen';f.dispatchEvent(new Event('input',{bubbles:true}))}")
    await pb.evaluate("document.querySelector('[data-sw-go]').click()");await pb.wait_for_timeout(3500)
    await pb.screenshot(path=S+'/v1100/b_panel.png')
    print(' Log Spieler:',await pb.evaluate("V1100.log.map(R=>R.l+': '+R.e+' ['+R.k+'] '+R.f)"))
    print(' Tisch-Datei:',[w['l'] for w in J(S+'/tisch_t100/wuerfe/bernd.json')['w']],' verdeckt:',[w['l'] for w in J(S+'/rep100/bernd/wuerfe/verdeckt.json')['w']])
    # Flüstern
    await pb.evaluate("$('swBtnC').click()");await pb.wait_for_timeout(500)
    await pb.fill('[data-sw-msg]','Hallo SL, darf ich lauschen?');await pb.evaluate("document.querySelector('[data-sw-send]').click()");await pb.wait_for_timeout(1500)
    print(' Chat-Datei Spieler:',[m['x'] for m in J(S+'/rep100/bernd/fluestern/spieler.json')['n']])
    await pb.screenshot(path=S+'/v1100/b_chat.png')
    # SL
    cs=await b.new_context(viewport={'width':1440,'height':900});await cs.route('https://api.github.com/**',api)
    ps,es=await login(cs,'sl','pw-sl-test');await ps.evaluate("swPoll(true)");await ps.wait_for_timeout(3000)
    print('SL:',await ps.evaluate("[V1100.mode,V1100.unread,V1100.log.map(R=>R.l+': '+R.e+' · '+R.name+' ['+R.k+']')]"))
    await ps.screenshot(path=S+'/v1100/s_toast.png')
    await ps.evaluate("$('swBtnC').click()");await ps.wait_for_timeout(600);await ps.screenshot(path=S+'/v1100/s_liste.png')
    await ps.evaluate("document.querySelector('[data-sw-sp=bernd]').click()");await ps.wait_for_timeout(800)
    await ps.fill('[data-sw-msg]','Ja, würfle Heimlichkeit.');await ps.evaluate("document.querySelector('[data-sw-send]').click()");await ps.wait_for_timeout(1500)
    await ps.screenshot(path=S+'/v1100/s_chat.png')
    print(' SL nach Lesen: unread',await ps.evaluate("V1100.unread"),'sl.json',{k:(v if k!='n' else [m['x'] for m in v]) for k,v in J(S+'/rep100/bernd/fluestern/sl.json').items()})
    # Hover-Zusammensetzung im Protokoll
    await ps.evaluate("$('swBtnW').click()");await ps.wait_for_timeout(300);await ps.evaluate("document.querySelector('[data-sw-tab=log]').click()");await ps.wait_for_timeout(300)
    await ps.hover('.swlog li[data-sw-r]');await ps.wait_for_timeout(300);print(' Popup:',await ps.evaluate("(document.getElementById('swPop')||{}).innerText"));await ps.screenshot(path=S+'/v1100/s_pop.png')
    # Spieler sieht Antwort
    await pb.evaluate("swPoll(true)");await pb.wait_for_timeout(2500);print('Spieler unread',await pb.evaluate("V1100.unread"))
    await pb.evaluate("swOpen(null)");await pb.evaluate("$('swBtnC').click()");await pb.wait_for_timeout(1500);print(' Spieler nach Öffnen unread',await pb.evaluate("V1100.unread"),'gelesen',J(S+'/rep100/bernd/fluestern/spieler.json').get('gelesen'))
    await pb.screenshot(path=S+'/v1100/b_antwort.png');await pb.evaluate("swOpen(null)")
    # Schiffsbogen-Würfel
    await pb.evaluate("()=>{$('tabSheets').click()}");await pb.wait_for_timeout(1500)
    await pb.evaluate("()=>{const b=document.querySelector('[data-v1086a=new]');if(b)b.click()}");await pb.wait_for_timeout(800)
    async def setsel(sel,val):
        await pb.evaluate("([s,v])=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}))}",[sel,val]);await pb.wait_for_timeout(400)
    await setsel('[data-v1086f=typ]','eskortfregatte');await setsel('[data-v1086f=gr]','1')
    await pb.evaluate("()=>{const i=document.querySelector('[data-v1086f=name]');i.value='Morgenwacht';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}))}");await pb.wait_for_timeout(500)
    await setsel('[data-v1086w=BBS0]','Leichte Balliste')
    n=await pb.evaluate("document.querySelectorAll('.swdbtn').length");print('Würfel-Icons im Schiffsbogen:',n,await pb.evaluate("[...document.querySelectorAll('.swdbtn')].slice(0,12).map(b=>JSON.parse(b.dataset.swd).l+' = '+JSON.parse(b.dataset.swd).f)"))
    await pb.evaluate("[...document.querySelectorAll('.swdbtn')].find(b=>/Initiative/.test(b.dataset.swd)).click()");await pb.wait_for_timeout(400);await pb.screenshot(path=S+'/v1100/b_frage.png')
    await pb.evaluate("document.querySelector('.swdlg [data-m=v]').click()");await pb.evaluate("document.querySelector('.swdlg [data-go]').click()");await pb.wait_for_timeout(3500)
    await pb.evaluate("[...document.querySelectorAll('.swdbtn')].find(b=>/Schaden Leichte Balliste/.test(b.dataset.swd)).click()");await pb.wait_for_timeout(3500)
    print(' Würfe:',await pb.evaluate("V1100.log.slice(0,2).map(R=>R.l+': '+R.e+' | '+swZus(R).f+' | '+swZus(R).z)"))
    await pb.screenshot(path=S+'/v1100/b_sheet.png')
    # Stil
    await pb.evaluate("document.querySelector('[data-v1095sub=wuerfel]').click()");await pb.wait_for_timeout(800)
    await pb.evaluate("()=>{const e=document.querySelector('[data-sws=farbe]');e.value='#1f4f7a';e.dispatchEvent(new Event('input',{bubbles:true}));const f=document.querySelector('[data-sws=font]');f.value='fraktur';f.dispatchEvent(new Event('input',{bubbles:true}))}")
    await pb.set_input_files('[data-sws-bild]',S+'/v1099/t12_a.png');await pb.wait_for_timeout(1200)
    await pb.evaluate("document.querySelector('[data-sws-save]').click()");await pb.wait_for_timeout(1500);await pb.screenshot(path=S+'/v1100/b_stil.png',full_page=False)
    st=J(S+'/tisch_t100/stil/bernd.json')['stil'];print('Stil gespeichert:',st['farbe'],st['font'],len(st['bild']))
    await pb.evaluate("document.querySelector('[data-sws-test]').click()");await pb.wait_for_timeout(600);await pb.screenshot(path=S+'/v1100/b_test.png')
    await ps.evaluate("swPoll(true)");await ps.wait_for_timeout(2500);print('SL kennt Stil:',await ps.evaluate("(V1100.stil.bernd||{}).farbe"))
    # 90-Tage-Löschung
    o=J(S+'/rep100/bernd/fluestern/spieler.json');o['n'].insert(0,{'id':'alt','t':int((time.time()-100*86400)*1000),'x':'uralt'});json.dump(o,open(S+'/rep100/bernd/fluestern/spieler.json','w'))
    await pb.evaluate("swPoll(true)");await pb.wait_for_timeout(2000);await pb.evaluate("()=>{swOpen('c');}");await pb.wait_for_timeout(500);await pb.fill('[data-sw-msg]','Zweite Nachricht');await pb.evaluate("document.querySelector('[data-sw-send]').click()");await pb.wait_for_timeout(1500)
    print('Nach Löschung:',[m['x'] for m in J(S+'/rep100/bernd/fluestern/spieler.json')['n']])
    print('Fehler Spieler',eb[:3],'SL',es[:3],'API',N)
    await b.close()
asyncio.run(main())
