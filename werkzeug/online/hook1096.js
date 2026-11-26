/* V10.96: Online-Änderungen beim Laden anwenden (vor dem Aufbau des Atlas).
   Web: window.SW_OPS (von der Anmeldeseite). Lokaler Arbeitsstand: sessionStorage „swImportOps“ (Übernahme beim Öffnen). */
(function(){var P=JSON.parse,imp=null;try{imp=JSON.parse(sessionStorage.getItem('swImportOps')||'null');sessionStorage.removeItem('swImportOps')}catch(e){}
 var O=window.SW_OPS;if(!(O&&O.ops&&O.ops.length)&&!imp)return;
 JSON.parse=function(t,r){var o=P.call(JSON,t,r);if(typeof t==='string'&&t.length>1000000&&o&&typeof o==='object'&&Array.isArray(o.maps)){JSON.parse=P;
   try{if(O&&O.ops&&O.ops.length)window.SW_OPS_APPLIED=swOpsApply(o,O.ops);
    if(imp&&imp.len===t.length&&Array.isArray(imp.ops)){window.SW_IMPORT_DONE=swOpsApply(o,imp.ops);o.onlineImport={basis:imp.basis,seq:imp.seq,zeit:new Date().toISOString(),n:window.SW_IMPORT_DONE}}}
   catch(e){window.SW_OPS_ERR=String(e&&e.message||e)}}return o}})();
