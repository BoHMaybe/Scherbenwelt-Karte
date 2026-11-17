# -*- coding: utf-8 -*-
"""Liste der Orte mit Panorama-Link (ab PANO_MIN Einwohnern) als CSV für Excel.
Aufruf: python3 panorama_liste.py <Spielerkarte.html> <Ausgabe.csv> [<Arbeitskopie gh-pages>]
Mit Arbeitskopie wird zusätzlich vermerkt, ob schon ein Bild vorliegt."""
import sys,os,json,re
here=os.path.dirname(os.path.abspath(__file__))
MIN=int(re.search(r'PANO_MIN=(\d+)',open(os.path.join(here,'pano_inject.py'),encoding='utf-8').read()).group(1))
s=open(sys.argv[1],encoding='utf-8').read();i=s.find('id="atlas-data"');i=s.find('>',i)+1;j=s.find('</script>',i);P=json.loads(s[i:j])
have=set()
if len(sys.argv)>3 and os.path.isdir(os.path.join(sys.argv[3],'panorama')): have={os.path.splitext(f)[0].upper() for f in os.listdir(os.path.join(sys.argv[3],'panorama'))}
L=sorted([c for c in P['cities'] if (c.get('population') or 0)>=MIN],key=lambda c:(c['shard'],-(c.get('population') or 0)))
with open(sys.argv[2],'w',encoding='utf-8-sig') as f:
    f.write('Dateiname;Ort;Scherbe;Typ;Einwohner;Bild vorhanden\n')
    for c in L:
        sid=c.get('sourceId') or c['id'];f.write('%s.webp;%s;%s;%s;%d;%s\n'%(sid,c['name'],c['shard'],c['type'],c['population'],'ja' if sid.upper() in have else 'nein'))
print(len(L),'Orte ab',MIN,'Einwohnern,',sum(1 for c in L if (c.get('sourceId') or c['id']).upper() in have),'mit Bild')
