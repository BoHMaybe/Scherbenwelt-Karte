# Panorama (nur Web-Fassung): Link im Ortsfenster für Orte ab PANO_MIN Einwohnern oder mit Typ aus PANO_TYPEN; Bild aus panorama/<Siedlungs-ID>.<webp|jpg|jpeg|png>
# Dateiname wird zuerst exakt, dann in Kleinschreibung gesucht; Endung auch in Großbuchstaben.
import json
PANO_MIN=50000
PANO_TYPEN=['Großstadt','Stadt','Bezirkszentrum']   # zusätzlich unabhängig von der Einwohnerzahl
PANO=r"""<style>/* Web-Fassung: Panorama */
#info .pano-link{display:inline-block;margin:-4px 0 10px;font-family:'Cinzel',serif;font-size:17px;letter-spacing:.5px;color:#8a2414;text-decoration:underline;text-underline-offset:3px;cursor:pointer;background:none;border:none;padding:4px 0}
#info .pano-link:hover{color:#5a160b}
#info .pano-link.hidden{display:none}
#panoView{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;z-index:2147483000;background:#000;display:flex;align-items:center;justify-content:center;touch-action:none}
#panoView.hidden{display:none}
#panoView img{width:100%;height:100%;object-fit:contain;user-select:none;-webkit-user-select:none}
#panoView .pano-x{position:absolute;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));width:52px;height:52px;border-radius:50%;border:2px solid rgba(255,255,255,.85);background:rgba(0,0,0,.55);color:#fff;font-size:30px;line-height:46px;text-align:center;cursor:pointer;padding:0}
#panoView .pano-cap{position:absolute;left:max(14px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));color:#f2e6c9;font-family:'Cinzel',serif;font-size:16px;text-shadow:0 1px 4px #000;pointer-events:none}
</style><script>/* Web-Fassung: Panorama der Städte */
(function(){var MINPOP=__PANO_MIN__,TYPEN=__PANO_TYPEN__,EXT=['webp','jpg','jpeg','png','WEBP','JPG','JPEG','PNG'],FOUND={};
function probe(id,cb){if(id in FOUND){cb(FOUND[id]);return}var C=[],lo=id.toLowerCase();EXT.forEach(function(e){C.push(id+'.'+e)});if(lo!==id)EXT.forEach(function(e){C.push(lo+'.'+e)});var i=0;(function next(){if(i>=C.length){FOUND[id]=null;cb(null);return}var u='panorama/'+encodeURIComponent(C[i++]),im=new Image();im.onload=function(){FOUND[id]=u;cb(u)};im.onerror=next;im.src=u})()}
function view(){var v=document.getElementById('panoView');if(!v){v=document.createElement('div');v.id='panoView';v.className='hidden';v.setAttribute('role','dialog');v.setAttribute('aria-modal','true');v.innerHTML='<img alt=""><button type="button" class="pano-x" aria-label="Panorama schließen" title="Schließen">×</button><div class="pano-cap"></div>';document.body.appendChild(v);
 v.querySelector('.pano-x').addEventListener('click',function(e){e.preventDefault();e.stopPropagation();close()});
 ['pointerdown','pointermove','pointerup','wheel','touchstart','touchmove','dblclick','click'].forEach(function(t){v.addEventListener(t,function(e){e.stopPropagation()},{passive:true})})}return v}
function open(u,name){var v=view();v.querySelector('img').src=u;v.querySelector('img').alt='Panorama '+name;v.querySelector('.pano-cap').textContent=name;v.classList.remove('hidden');try{if(v.requestFullscreen&&!document.fullscreenElement)v.requestFullscreen().catch(function(){})}catch(e){}setTimeout(function(){var x=v.querySelector('.pano-x');if(x)x.focus()},50)}
function close(){var v=document.getElementById('panoView');if(!v||v.classList.contains('hidden'))return;v.classList.add('hidden');v.querySelector('img').removeAttribute('src');try{if(document.fullscreenElement===v&&document.exitFullscreen)document.exitFullscreen().catch(function(){})}catch(e){}}
window.panoClose=close;
document.addEventListener('keydown',function(e){if(e.key==='Escape'){var v=document.getElementById('panoView');if(v&&!v.classList.contains('hidden')){e.preventDefault();e.stopPropagation();close()}}},true);
document.addEventListener('fullscreenchange',function(){var v=document.getElementById('panoView');if(v&&!v.classList.contains('hidden')&&document.fullscreenElement!==v)close()});
function add(c){var box=document.getElementById('info');if(!box||!c||!((c.population||0)>=MINPOP||TYPEN.indexOf(c.type)>=0))return;var h=box.querySelector('h2');if(!h||box.querySelector('.pano-link'))return;var id=c.sourceId||c.id,a=document.createElement('button');a.type='button';a.className='pano-link hidden';a.textContent='Panorama ansehen';a.addEventListener('click',function(e){e.preventDefault();if(FOUND[id])open(FOUND[id],c.name)});h.insertAdjacentElement('afterend',a);
 probe(id,function(u){if(u&&a.isConnected)a.classList.remove('hidden')})}
function hook(){if(typeof showCard!=='function'){setTimeout(hook,200);return}var _s=showCard;showCard=function(kind,obj){var r=_s.apply(this,arguments);try{if(kind==='city')add(obj)}catch(e){console.warn('Panorama',e)}return r}}
hook()})();</script>"""
PANO=PANO.replace('__PANO_MIN__',str(int(PANO_MIN))).replace('__PANO_TYPEN__',json.dumps(PANO_TYPEN,ensure_ascii=False));assert '__PANO' not in PANO
_i=tail.rfind('</body>');assert _i>0
tail=tail[:_i]+PANO+'\n'+tail[_i:]
