# -*- coding: utf-8 -*-
"""Bilder in die Compendium-Einträge des Arbeitsstands eintragen (über den Speicherweg der App, wie „Arbeitsstand speichern“).
Aufruf: python3 compendium_bilder.py <Arbeitsstand.html> <Bildordner> <Ausgabe.html>
Zuordnung über den Dateinamen (Endung .png/.jpg/.jpeg/.webp, Groß-/Kleinschreibung egal):
  TITEL-<Kürzel>                       Titelbild im Geschichtseintrag der Scherbe (WUE LAV STU STA WAS EIS DSC BER WAL), erster Block
  bau-<…>                              Konzeptzeichnung im Gebäudeeintrag, erster Block (wie bei den Schiffen)
  legion-<…>-ausruestung / -sondergeraet  Konzeptzeichnung im Abschnitt „Ausrüstung“ des Legionseintrags (Legiones Sanctae, Speziallegionen)
  waffe-<name> / modul-<name>          Konzeptblatt im Geschützkatalog bzw. Modulkatalog (Compendium · Schiffe), direkt unter der Tabelle
                                       des Platzes bzw. der Kategorie, zweispaltig in Katalogreihenfolge; <name> wie im Katalog, Umlaute
                                       als ae/oe/ue, ß als ss, sonstige Zeichen als „-“ (z. B. waffe-leichte-balliste, modul-aethersegel)
Armadas erhalten keine eigenen Ausrüstungsbilder; ihre Ausrüstung ist über die Katalogbilder abgebildet.
Der Abschnitt „Ausrüstung“ ist bei allen Legionen für Spieler geschwärzt; die Bilder dort erscheinen in der Spielerdatei als
„Abbildung geschwärzt“, bis die Spielleitung sie im Eintrag per Klick freigibt. Ein erneuter Lauf mit gleichem Dateinamen ersetzt das Bild.
Bilder werden als JPEG eingebettet (Qualität 85; Titelbilder höchstens 1920 px breit, Zeichnungen höchstens 1280 px)."""
import sys,os,io,re,json,base64,asyncio
from PIL import Image,ImageOps
SRC,DIR,OUT=sys.argv[1],sys.argv[2],sys.argv[3]
TIT={'WUE':'wueste','LAV':'lava','STU':'sturm','STA':'stadt','WAS':'wasser','EIS':'eis','DSC':'dschungel','BER':'berg','WAL':'wald'}
def enc(p,w):
    im=ImageOps.exif_transpose(Image.open(p)).convert('RGB')
    if im.width>w: im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)
    b=io.BytesIO();im.save(b,'JPEG',quality=85,optimize=True,progressive=True)
    return 'data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode(),im.size,b.tell()
jobs=[]
for f in sorted(os.listdir(DIR)):
    stem,ext=os.path.splitext(f)
    if ext.lower() not in ('.png','.jpg','.jpeg','.webp'): continue
    s=stem.strip();u=s.upper();lo=s.lower()
    if u.startswith('TITEL-') and u[6:] in TIT: job={'aid':'geschichte-'+TIT[u[6:]],'mode':'first','key':'TITEL-'+u[6:],'cap':'Titelbild','w':1920}
    elif lo.startswith('bau-'): job={'aid':lo,'mode':'first','key':lo,'cap':'Konzeptzeichnung','w':1280}
    elif re.fullmatch(r'(waffe|modul)-[a-z0-9-]+',lo): job={'aid':'schiffe-geschuetze' if lo.startswith('waffe-') else 'schiffe-module','mode':'kat','key':lo,'slug':lo.split('-',1)[1],'cap':'Konzeptblatt','w':1280}
    elif re.fullmatch(r'legion-.+-(ausruestung|sondergeraet)',lo):
        aid,kind=lo.rsplit('-',1)
        job={'aid':aid,'mode':'aus','key':lo,'kind':kind,'cap':'Ausrüstung · Konzeptzeichnung' if kind=='ausruestung' else 'Sondergerät · Konzeptzeichnung','w':1280}
    else: print('übersprungen (Dateiname nicht zugeordnet):',f);continue
    job['src'],sz,n=enc(os.path.join(DIR,f),job['w']);print('%-40s %4dx%-4d %4d KB -> %s'%(f,sz[0],sz[1],n//1024,job['aid']));jobs.append(job)
assert jobs,'keine zuordenbaren Bilder'
JS=r"""(J)=>{const A=atlas.compendium.articles,out=[];
 for(const j of J){let a=A.find(x=>x.id===j.aid);if(!a&&j.mode==='aus')a=A.find(x=>x.id.toLowerCase()===j.aid.toLowerCase());if(!a){out.push('FEHLT '+j.aid);continue}
  let cap=j.cap;if(j.kind==='sondergeraet'&&a.group==='Die Legionen/Speziallegionen')cap='Spezialartefakt · Konzeptzeichnung';
  const b={t:'img',src:j.src,x:a.title+' · '+cap+' (Bild anklicken zum Vergrößern)',alt:cap.split(' · ')[0]+' '+a.title,bild:j.key};
  let done=false;for(const p of a.pages){const i=p.blocks.findIndex(x=>x.t==='img'&&x.bild===j.key);if(i>=0){const o=p.blocks[i];if(o.cls==='kat')Object.assign(b,{cls:'kat',ord:o.ord,x:o.x,alt:o.alt});p.blocks[i]=b;done=true;out.push('ersetzt '+j.key);break}}
  if(done)continue;
  if(j.mode==='kat'){const sl=n=>String(n).toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');let ok=false;
   for(const p of a.pages){for(let t=0;t<p.blocks.length&&!ok;t++){const T=p.blocks[t];if(T.t!=='tbl')continue;const R=T.head?T.rows.slice(1):T.rows;const ri=R.findIndex(r=>sl(r[0])===j.slug);if(ri<0)continue;
     b.cls='kat';b.ord=ri;b.x=R[ri][0]+' · '+j.cap;b.alt=j.cap+' '+R[ri][0];let k=t+1;while(k<p.blocks.length&&p.blocks[k].t==='img'&&p.blocks[k].cls==='kat'&&(p.blocks[k].ord??0)<ri)k++;
     p.blocks.splice(k,0,b);ok=true;out.push('neu '+j.key)}if(ok)break}
   if(!ok)out.push('FEHLT Katalogzeile '+j.key);continue}
  if(j.mode==='first'){a.pages[0].blocks.unshift(b);out.push('neu '+j.key);continue}
  let ok=false;for(const p of a.pages){const s=p.blocks.findIndex(x=>x.t==='sec'&&x.x==='Ausrüstung');if(s<0)continue;let k=s+1;
   if(j.kind==='sondergeraet')while(k<p.blocks.length&&p.blocks[k].t==='img'&&String(p.blocks[k].bild||'').endsWith('-ausruestung'))k++;
   p.blocks.splice(k,0,b);ok=true;out.push('neu '+j.key);break}
  if(!ok)out.push('KEIN ABSCHNITT Ausrüstung '+j.aid)}
 return out}"""
async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as pw:
        br=await pw.chromium.launch();ctx=await br.new_context(viewport={'width':1500,'height':1000},accept_downloads=True);pg=await ctx.new_page();err=[]
        pg.on('pageerror',lambda e:err.append(str(e)[:200]))
        await pg.goto('file://'+os.path.abspath(SRC),timeout=900000)
        await pg.wait_for_function("()=>typeof atlas!=='undefined'&&atlas.cities&&atlas.cities.length&&typeof exportHtml==='function'",timeout=900000);await pg.wait_for_timeout(4000)
        r=await pg.evaluate(JS,jobs);print('\n'.join(r))
        bad=[x for x in r if x.startswith(('FEHLT','KEIN'))]
        if bad: print('ABBRUCH, nichts gespeichert');await br.close();sys.exit(1)
        async with pg.expect_download(timeout=900000) as di: await pg.evaluate("()=>{exportHtml(false)}")
        d=await di.value;await d.save_as(OUT);print('gespeichert:',OUT,'Fehler:',err[:5]);await br.close()
asyncio.run(main())
