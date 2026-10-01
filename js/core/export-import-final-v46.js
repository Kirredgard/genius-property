/* Genius Property V46 — unified Export menu + clean Import modal
   Loaded LAST so no legacy bundle can overwrite these handlers.
*/
(function(){
  'use strict';
  var labels={biens:'Biens',proprietaires:'Propriétaires',locatives:'Locations',locataires:'Locataires',paiements:'Encaissements',depenses:'Dépenses',contrats:'Contrats',employes:'Employés',messages:'Messages',journal:'Journal'};
  var pageKeys={
    'page-biens':'biens','page-proprietaires':'proprietaires','page-locatives':'locatives','page-locataires':'locataires',
    'page-paiements':'paiements','page-encaissements':'paiements','page-depenses':'depenses','page-contrats':'contrats','page-employes':'employes','page-equipe':'employes','page-journal':'journal'
  };
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function dataFor(key){var d=window.DB||{};var k=key==='encaissements'?'paiements':key;return {key:k,data:Array.isArray(d[k])?d[k]:[]};}
  function toast(msg,type){if(typeof window.toast==='function')window.toast(msg,type||'');else alert(msg);}
  function flat(o,p,out){out=out||{};p=p||'';if(!o||typeof o!=='object'||Array.isArray(o))return out;Object.keys(o).forEach(function(k){var v=o[k],q=p?p+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v))flat(v,q,out);else out[q]=Array.isArray(v)?JSON.stringify(v):v;});return out;}
  function rows(a){return a.map(function(x){return flat(x);});}
  function cols(a){var s={},r=[];rows(a).forEach(function(x){Object.keys(x).forEach(function(k){if(!s[k]){s[k]=1;r.push(k);}});});return r;}
  function csvCell(v){v=v==null?'':String(v);return /[";\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}
  function download(blob,name){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},800);}

  window.exportExcel=function(key){
    var r=dataFor(key);if(!r.data.length){toast('Aucune donnée à exporter','err');return;}
    var c=cols(r.data),rr=rows(r.data),name='genius-property_'+r.key+'_'+new Date().toISOString().slice(0,10);
    if(window.ensureXLSX){window.ensureXLSX().then(function(XLSX){var aoa=[c].concat(rr.map(function(x){return c.map(function(k){return x[k]==null?'':x[k];});}));var ws=XLSX.utils.aoa_to_sheet(aoa),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,(labels[r.key]||r.key).slice(0,31));XLSX.writeFile(wb,name+'.xlsx');toast('Export Excel '+(labels[r.key]||r.key)+' ✓');}).catch(function(){fallbackCsv(r,name);});}
    else fallbackCsv(r,name);
  };
  function fallbackCsv(r,name){var c=cols(r.data),rr=rows(r.data),txt='\ufeff'+c.map(csvCell).join(';')+'\n'+rr.map(function(x){return c.map(function(k){return csvCell(x[k]);}).join(';');}).join('\n');download(new Blob([txt],{type:'text/csv;charset=utf-8'}),name+'.csv');toast('Export CSV '+(labels[r.key]||r.key)+' ✓');}

  window.exportListePDF=function(key){
    var r=dataFor(key);if(!r.data.length){toast('Aucune donnée à exporter','err');return;}
    var title=labels[r.key]||key,c=cols(r.data),rr=rows(r.data),wrap=document.createElement('div');
    wrap.style.cssText='position:fixed;left:-20000px;top:0;width:1120px;background:#fff;color:#111;padding:28px;box-sizing:border-box;font-family:Arial,sans-serif;';
    wrap.innerHTML='<h1 style="margin:0 0 4px;font-size:22px">Genius Property</h1><div style="font-size:18px;font-weight:700;margin-bottom:4px">'+esc(title)+'</div><div style="font-size:11px;color:#666;margin-bottom:16px">Export du '+new Date().toLocaleDateString('fr-FR')+' — '+r.data.length+' ligne(s)</div><table style="width:100%;border-collapse:collapse;font-size:9px"><thead><tr>'+c.map(function(k){return '<th style="padding:6px;background:#111;color:#fff;text-align:left;border:1px solid #ddd">'+esc(k)+'</th>';}).join('')+'</tr></thead><tbody>'+rr.map(function(x,i){return '<tr>'+c.map(function(k){return '<td style="padding:6px;border:1px solid #ddd;background:'+(i%2?'#fafafa':'#fff')+'">'+esc(x[k]==null?'':x[k])+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table>';
    document.body.appendChild(wrap);
    var go=function(){var api=window.html2pdf;if(typeof api!=='function'){wrap.remove();toast('Export PDF indisponible','err');return;}api().from(wrap).set({margin:8,filename:'genius-property_'+r.key+'_'+new Date().toISOString().slice(0,10)+'.pdf',image:{type:'jpeg',quality:.96},html2canvas:{scale:1.4,useCORS:true,backgroundColor:'#fff'},jsPDF:{unit:'mm',format:'a4',orientation:'landscape'}}).save().then(function(){wrap.remove();toast('Export PDF '+title+' ✓');}).catch(function(e){console.error(e);wrap.remove();toast('Export PDF impossible','err');});};
    if(window.ensureHtml2Pdf){window.ensureHtml2Pdf().then(go).catch(function(e){console.error(e);wrap.remove();toast('Export PDF impossible','err');});}else go();
  };

  function currentKey(btn){
    var p=btn.closest('[id^="page-"]');if(p&&pageKeys[p.id])return pageKeys[p.id];
    var s=btn.getAttribute('onclick')||'';var m=s.match(/['\"](biens|proprietaires|locatives|locataires|paiements|encaissements|depenses|contrats|employes|journal)['\"]/);if(m)return m[1]==='encaissements'?'paiements':m[1];
    return null;
  }
  function closeMenus(except){document.querySelectorAll('.gp-v46-export-menu').forEach(function(x){if(x!==except)x.remove();});}
  function showExportMenu(btn,key){
    closeMenus();var r=btn.getBoundingClientRect(),m=document.createElement('div');m.className='gp-v46-export-menu';m.innerHTML='<button data-act="pdf"><span class="material-symbols-rounded">picture_as_pdf</span><span>Export PDF</span></button><button data-act="xlsx"><span class="material-symbols-rounded">table_view</span><span>Export Excel</span></button>';
    document.body.appendChild(m);var w=190,left=Math.min(window.innerWidth-w-10,Math.max(8,r.right-w));m.style.left=left+'px';m.style.top=(r.bottom+6)+'px';
    m.querySelector('[data-act="pdf"]').onclick=function(e){e.stopPropagation();m.remove();window.exportListePDF(key);};
    m.querySelector('[data-act="xlsx"]').onclick=function(e){e.stopPropagation();m.remove();window.exportExcel(key);};
    setTimeout(function(){document.addEventListener('click',function h(){m.remove();document.removeEventListener('click',h);},{once:true});},0);
  }

  function ensureImportCss(){if(document.getElementById('gp-v46-import-css'))return;var s=document.createElement('style');s.id='gp-v46-import-css';s.textContent='.gp-v46-export-menu{position:fixed;z-index:100001;width:190px;background:#fffdf2;border:1px solid #eee3bd;border-radius:10px;box-shadow:0 10px 28px rgba(0,0,0,.16);padding:6px}.gp-v46-export-menu button{width:100%;height:42px;border:0;background:transparent;border-radius:7px;display:flex;align-items:center;gap:10px;padding:0 12px;color:#374151;font-size:13px;cursor:pointer;text-align:left}.gp-v46-export-menu button:hover{background:#fff5cf}.gp-v46-export-menu .material-symbols-rounded{font-size:21px;color:#d4af37}.gp-v46-import-back{position:fixed;inset:0;z-index:100002;background:rgba(15,15,15,.42);display:flex;align-items:center;justify-content:center}.gp-v46-import-card{width:min(430px,calc(100vw - 28px));background:#fffdf2;border:1px solid #eadfbd;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.24);padding:20px;position:relative;box-sizing:border-box;font-family:Arial,sans-serif}.gp-v46-import-card h3{margin:0;font-size:19px;color:#111827}.gp-v46-import-card p{margin:5px 0 16px;font-size:12px;color:#64748b}.gp-v46-import-close{position:absolute;right:12px;top:10px;width:32px;height:32px;border:1px solid #e5e7eb;background:#fff;border-radius:8px;font-size:20px;cursor:pointer;color:#64748b}.gp-v46-file{width:100%;box-sizing:border-box;border:1px solid #e5e7eb;border-radius:8px;background:#fff;padding:8px;font-size:12px}.gp-v46-modes{display:flex;flex-direction:column;gap:9px;margin:15px 0;font-size:13px;color:#374151}.gp-v46-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}.gp-v46-actions button{height:38px;padding:0 16px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer}.gp-v46-cancel{border:1px solid #e5e7eb;background:#fff;color:#374151}.gp-v46-submit{border:1px solid #d4af37;background:#d4af37;color:#111827}.gp-v46-status{font-size:12px;margin-top:10px;color:#b91c1c;min-height:16px}';document.head.appendChild(s);}

  var importState={key:null,el:null};
  window.openImportModal=function(key){
    ensureImportCss();if(importState.el)importState.el.remove();importState.key=key;
    var back=document.createElement('div');back.className='gp-v46-import-back';back.innerHTML='<div class="gp-v46-import-card"><button class="gp-v46-import-close" type="button">×</button><h3>Importer — '+esc(labels[key]||key)+'</h3><p>Choisis un fichier Excel (.xlsx) ou CSV.</p><input class="gp-v46-file" id="gpV46File" type="file" accept=".xlsx,.xls,.csv"><div class="gp-v46-modes"><label><input type="radio" name="gpV46Mode" value="append" checked> Ajouter aux données existantes</label><label><input type="radio" name="gpV46Mode" value="replace"> Remplacer les données</label></div><div class="gp-v46-actions"><button type="button" class="gp-v46-cancel">Annuler</button><button type="button" class="gp-v46-submit">Importer</button></div><div class="gp-v46-status"></div></div>';
    document.body.appendChild(back);importState.el=back;
    var close=function(){back.remove();importState.el=null;importState.key=null;};back.querySelector('.gp-v46-import-close').onclick=close;back.querySelector('.gp-v46-cancel').onclick=close;back.addEventListener('click',function(e){if(e.target===back)close();});
    back.querySelector('.gp-v46-submit').onclick=function(){var file=back.querySelector('#gpV46File').files[0],status=back.querySelector('.gp-v46-status');if(!file){status.textContent='Choisis un fichier avant de continuer.';return;}var mode=back.querySelector('input[name="gpV46Mode"]:checked').value,reader=new FileReader();reader.onload=function(ev){parseImport(file,ev.target.result,mode,status,close);};reader.readAsArrayBuffer(file);};
  };
  function parseImport(file,buf,mode,status,close){
    var finish=function(arr){if(!arr.length){status.textContent='Aucune ligne trouvée dans le fichier.';return;}var d=window.DB||{},key=importState.key==='encaissements'?'paiements':importState.key;if(mode==='replace')d[key]=arr;else d[key]=(Array.isArray(d[key])?d[key]:[]).concat(arr);window.DB=d;try{if(window.GPDB&&typeof window.GPDB.save==='function')window.GPDB.save(d);else if(typeof window.saveDB==='function')window.saveDB();}catch(e){console.warn(e);}close();toast(arr.length+' ligne(s) importée(s) ✓');if(typeof window.navigate==='function'){try{window.navigate(key);}catch(e){}}};
    if(window.ensureXLSX){window.ensureXLSX().then(function(XLSX){var wb=XLSX.read(buf,{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]],arr=XLSX.utils.sheet_to_json(ws,{defval:''});finish(arr);}).catch(function(e){console.error(e);status.textContent='Impossible de lire ce fichier Excel.';});}
    else {var text=new TextDecoder().decode(buf),lines=text.split(/\r?\n/).filter(Boolean);if(!lines.length){status.textContent='Fichier vide.';return;}var head=lines.shift().split(';').map(function(x){return x.replace(/^"|"$/g,'');});finish(lines.map(function(line){var a=line.split(';'),o={};head.forEach(function(h,i){o[h]=(a[i]||'').replace(/^"|"$/g,'');});return o;}));}
  }

  function isStandaloneExport(btn){
    if(btn.closest('.gp-export-wrap,.gp-v46-export-menu'))return false;
    var t=(btn.textContent||'').trim().toLowerCase();return t==='exporter' || t.indexOf('exporter')===0;
  }
  function isImport(btn){if(btn.closest('.gp-v46-import-back'))return false;var t=(btn.textContent||'').trim().toLowerCase();return t==='importer' || t.indexOf('importer')===0;}
  document.addEventListener('click',function(e){
    var btn=e.target.closest('button');if(!btn)return;
    if(isStandaloneExport(btn)){var key=currentKey(btn);if(key){e.preventDefault();e.stopImmediatePropagation();showExportMenu(btn,key);return;}}
    if(isImport(btn)){var key2=currentKey(btn);if(key2){e.preventDefault();e.stopImmediatePropagation();window.openImportModal(key2);return;}}
  },true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenus();});
  ensureImportCss();
})();
