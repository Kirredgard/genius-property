/* Genius Property — restauration page Locations + actions sûres
   Source: ancienne page V21/V48, sans réintroduire app.legacy.bundle.js
*/
(function(){
  'use strict';
  function esc(v){return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function db(){
    try{ if(window.GPDB && typeof window.GPDB.load==='function') return window.GPDB.load() || {}; }catch(e){}
    return window.DB || {};
  }
  function saveDb(d){
    try{ if(window.GPDB && typeof window.GPDB.save==='function') return window.GPDB.save(d); }catch(e){}
    try{ window.DB=d; if(typeof window.saveDB==='function') return window.saveDB(); }catch(e){}
  }
  function num(v){ var n=Number(String(v||0).replace(/[^0-9,.-]/g,'').replace(',','.')); return Number.isFinite(n)?n:0; }
  function money(v){ if(v==null||v==='') return '—'; if(String(v).match(/FCFA|XOF|€|\$/i)) return String(v); var n=num(v); return n?Math.round(n).toLocaleString('fr-FR')+' FCFA':'0 FCFA'; }
  function statusClass(s){ s=String(s||'').toLowerCase(); if(s.includes('att'))return 'warn'; if(s.includes('dispo'))return 'ok'; if(s.includes('inact')||s.includes('résil'))return 'off'; return ''; }
  function iconBtn(cls,icon,title,onclick){return '<button class="gp-mini-action '+cls+'" title="'+esc(title)+'" onclick="event.stopPropagation();'+onclick+'"><span class="material-symbols-rounded">'+icon+'</span></button>';}
  var PAGE={locatives:1}; var PS={locatives:10};
  function pageBtns(total){ var pages=Math.max(1,Math.ceil(total/PS.locatives)); var out=''; for(var p=1;p<=Math.min(pages,7);p++){out+='<button class="'+(p===PAGE.locatives?'active':'')+'" onclick="gpLocationsPage('+p+')">'+p+'</button>';} return '<div class="pagination">'+out+'</div>'; }
  function inject(){
    if(document.getElementById('gp-locations-restorer-css')) return;
    var s=document.createElement('style'); s.id='gp-locations-restorer-css'; s.textContent='\
      #page-locatives .gp-modern-page{padding:8px 24px!important}\
      #page-locatives .gp-page-top{display:flex;align-items:center;gap:12px;margin-bottom:10px}\
      #page-locatives .gp-stat-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;flex:1}\
      #page-locatives .gp-stat-card{padding:10px 14px;display:flex;align-items:center;gap:10px;min-height:54px;border-radius:10px;background:#fff;border:1px solid #e5e7eb}\
      #page-locatives .gp-stat-ico{width:34px;height:34px;border-radius:8px;background:#fffbeb;color:#D4AF37;display:flex;align-items:center;justify-content:center}\
      #page-locatives .gp-stat-card strong{font-size:16px;font-weight:700;color:#111827;display:block;line-height:1.2}\
      #page-locatives .gp-stat-card span{font-size:11px;font-weight:500;color:#374151;display:block;margin-top:1px}\
      #page-locatives .gp-stat-card em{font-size:11px;color:#9ca3af;font-style:normal}\
      #page-locatives .gp-toolbar{display:flex;align-items:center;gap:10px;margin:10px 0;background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:10px}\
      #page-locatives .gp-search{height:34px;border:1px solid #e5e7eb;border-radius:8px;display:flex;align-items:center;gap:7px;padding:0 10px;background:#fff;min-width:260px}\
      #page-locatives .gp-search input{border:0;outline:0;background:transparent;font-size:13px;width:100%}\
      #page-locatives .gp-primary,#page-locatives .gp-outline{height:34px;border-radius:9px;border:1px solid #D4AF37;display:inline-flex;align-items:center;gap:6px;padding:0 12px;cursor:pointer;font-weight:800}\
      #page-locatives .gp-primary{background:#D4AF37;color:#111827}.gp-outline{background:#fff;color:#374151}\
      #page-locatives .gp-table-wrap{background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden}\
      #page-locatives .gp-table{width:100%;border-collapse:collapse} #page-locatives th{font-size:11px;text-transform:uppercase;color:#6b7280;background:#f9fafb;text-align:left;padding:12px} #page-locatives td{padding:13px 12px;border-top:1px solid #eef2f7;font-size:13px;color:#111827}\
      #page-locatives .gp-pill{display:inline-flex;border-radius:999px;padding:4px 9px;background:#dcfce7;color:#166534;font-weight:800;font-size:11px}.gp-pill.warn{background:#fef3c7;color:#92400e}.gp-pill.off{background:#fee2e2;color:#991b1b}\
      #page-locatives .gp-actions{display:flex;justify-content:center;gap:7px}.gp-mini-action{width:30px;height:30px;border:0;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.gp-mini-action.view{background:#dbeafe;color:#1d4ed8}.gp-mini-action.edit{background:#fef3c7;color:#92400e}.gp-mini-action.del{background:#fee2e2;color:#991b1b}\
      #page-locatives .gp-footer{display:flex;align-items:center;justify-content:space-between;padding:11px 13px;color:#6b7280;font-size:12px;border-top:1px solid #eef2f7}.pagination button{margin-left:4px;border:1px solid #e5e7eb;background:#fff;border-radius:8px;padding:5px 9px}.pagination button.active{background:#111827;color:#fff}\
      #page-locatives .gp-empty{padding:34px;text-align:center;color:#94a3b8}\
    '; document.head.appendChild(s);
  }
  function renderLocations(){
    inject(); var page=document.getElementById('page-locatives'); if(!page) return null;
    var d=db(); if(!Array.isArray(d.locatives)) d.locatives=[]; window.DB=d;
    var all=d.locatives, q=(document.getElementById('gpLocativeSearch')||{}).value||'';
    var data=all.filter(function(l){return !q || JSON.stringify(l).toLowerCase().indexOf(q.toLowerCase())>-1;});
    var start=((PAGE.locatives||1)-1)*PS.locatives, slice=data.slice(start,start+PS.locatives);
    var act=all.filter(function(l){var s=String(l.statut||'Loué').toLowerCase(); return s.includes('lou')||s==='actif'||s.includes('occup');}).length;
    page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid">'+
      '<div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">key</span></div><div><strong>'+all.length+'</strong><span>Locations</span><em>Total enregistrées</em></div></div>'+
      '<div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">home_work</span></div><div><strong>'+act+'</strong><span>Occupées</span><em>Locations actives</em></div></div>'+
      '<div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">payments</span></div><div><strong>'+money(all.reduce(function(s,l){return s+num(l.loyer||l.montant);},0))+'</strong><span>Loyers</span><em>Total mensuel</em></div></div></div>'+
      '<button class="gp-primary" onclick="navigate(\'nv-locative\')"><span class="material-symbols-rounded">add</span>Nouvelle location</button></div>'+
      '<div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpLocativeSearch" value="'+esc(q)+'" placeholder="Rechercher une location…" oninput="gpLocationsPage(1)"></label><div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF(\'locatives\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal(\'locatives\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div>'+
      '<div class="gp-table-wrap">'+(data.length?'<table class="gp-table"><thead><tr><th>Location</th><th>Bien</th><th>Locataire</th><th>Loyer</th><th>Date entrée</th><th>Statut</th><th style="text-align:center">Actions</th></tr></thead><tbody>'+slice.map(function(l){var i=all.indexOf(l); return '<tr><td><b>'+esc(l.nom||('Location - '+(l.bien||'')))+'</b><br><small style="color:#64748b">'+esc(l.type||l.nature||'Location')+'</small></td><td>'+esc(l.bien||'—')+'</td><td>'+esc(l.locataire||l.occupant||'—')+'</td><td><b>'+money(l.loyer||l.montant)+'</b></td><td>'+esc(l.dateEntree||l.date_entree||'—')+'</td><td><span class="gp-pill '+statusClass(l.statut)+'">'+esc(l.statut||'Loué')+'</span></td><td><div class="gp-actions">'+iconBtn('view','visibility','Voir','viewRow(\'locatives\','+i+')')+iconBtn('edit','edit','Modifier','editRow(\'locatives\','+i+')')+iconBtn('del','delete','Supprimer','delRow(\'locatives\','+i+')')+'</div></td></tr>';}).join('')+'</tbody></table><div class="gp-footer"><span>Affichage de '+(data.length?start+1:0)+' à '+Math.min(start+PS.locatives,data.length)+' sur '+data.length+' location'+(data.length>1?'s':'')+'</span>'+pageBtns(data.length)+'</div>':'<div class="gp-empty">Aucune location trouvée</div>')+'</div></div>';
    return page;
  }
  window.gpLocationsPage=function(p){PAGE.locatives=Math.max(1,Number(p)||1); return renderLocations();};
  window.renderLocativesFinal=renderLocations;
  window.renderLocativesModernAligned=renderLocations;
  window.renderLocativesModern=renderLocations;
  window.renderLocativesModernV11=renderLocations;
  if(typeof window.delRow!=='function') window.delRow=function(key,idx){var d=db(); if(!Array.isArray(d[key])||!d[key][idx])return; if(!confirm('Supprimer cet élément ?'))return; d[key].splice(idx,1); saveDb(d); if(typeof window.renderLocativesFinal==='function'&&key==='locatives')renderLocations(); else if(typeof window.renderTable==='function')window.renderTable(key); if(typeof window.toast==='function')window.toast('Supprimé ✓');};
  if(typeof window.toggleExportMenu!=='function') window.toggleExportMenu=function(key){var m=document.getElementById('exportMenu-'+key); if(m)m.classList.toggle('show');};
  if(typeof window.exportListePDF!=='function') window.exportListePDF=function(key){ if(typeof window.toast==='function') window.toast('Export PDF non configuré pour '+key); else alert('Export PDF non configuré'); };
  if(typeof window.exportExcel!=='function') window.exportExcel=function(key){ if(typeof window.toast==='function') window.toast('Export Excel non configuré pour '+key); else alert('Export Excel non configuré'); };
  if(typeof window.openImportModal!=='function') window.openImportModal=function(key){ if(typeof window.toast==='function') window.toast('Import non configuré pour '+key); else alert('Import non configuré'); };
  document.addEventListener('DOMContentLoaded',function(){ setTimeout(function(){ var a=document.querySelector('.page.active'); if(a&&a.id==='page-locatives') renderLocations(); },300); });
})();
