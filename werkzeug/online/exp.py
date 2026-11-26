import asyncio,sys,json
from playwright.async_api import async_playwright
F=sys.argv[2]
OUT=sys.argv[1];TEST=False
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch();ctx=await br.new_context(viewport={'width':1600,'height':1000},accept_downloads=True);pg=await ctx.new_page();errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)[:300]));pg.on('console',lambda m:m.type in('error','warning') and errs.append(m.type+': '+m.text[:200]))
        await pg.goto('file://'+F,timeout=900000);await pg.wait_for_function("()=>typeof atlas!=='undefined'&&atlas.cities&&atlas.cities.length&&document.getElementById('v1zziBar')",timeout=900000);await pg.wait_for_timeout(5000)
        if TEST:
            print(await pg.evaluate("""()=>{const c=atlas.cities.find(c=>c.name==='Mashihual');atlas.sl7.eopen[c.id]=1;atlas.sl7.clab.a['inq-dem']=['Allgemeinwissen','Tink'];atlas.sl7.copen['inq-dem.qb1eb7b']=1;return c.id}"""))
        async with pg.expect_download(timeout=900000) as di:
            await pg.evaluate("()=>{exportHtml(true)}")
        d=await di.value;print('Download',d.suggested_filename);await d.save_as(OUT)
        print('Fehler',errs[:10]);await br.close()
asyncio.run(main())
