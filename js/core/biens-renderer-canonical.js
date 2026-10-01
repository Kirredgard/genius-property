/* Genius Property — Biens renderer canonique V68
 * Un seul renderer de liste/cartes.
 * Le CRUD Bien reste dans current-workflows.js (GPV10.saveBien / renderBien).
 * Les relations d'occupation viennent exclusivement de GPRelationsV52.
 */
(function(){
  'use strict';
  var PAGE={biens:1};
  var PS={biens:10};
  function db(){
    try{return window.GPDB&&GPDB.load?GPDB.load():(window.DB||{});}catch(e){return window.DB||{};}
  }
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function money(v){
    if(v==null||v==='')return '—';
    if(/[A-Z]{3,}|FCFA|€|\$/i.test(String(v)))return String(v);
    var n=Number(String(v).replace(/[^0-9,.-]/g,'').replace(',','.'));
    return Number.isFinite(n)?Math.round(n).toLocaleString('fr-FR')+' FCFA':String(v);
  }
  function snapshot(d,b){
    try{
      if(window.GPRelationsV52&&typeof window.GPRelationsV52.propertySnapshot==='function'){
        return window.GPRelationsV52.propertySnapshot(d,b)||{units:[],occupied:[],available:[],status:'Disponible'};
      }
    }catch(e){console.warn('[Biens] relation snapshot',e);}
    var units=Array.isArray(b&&b.unites)?b.unites:[];
    var rows=units.map(function(u){var occupied=String(u.statut||'').toLowerCase()==='loué';return{unit:u,occupied:occupied,statut:occupied?'Loué':'Disponible',locataire:u.locataire||'',loyer:u.loyer||''};});
    var occupied=rows.filter(function(r){return r.occupied;});
    return {units:rows,occupied:occupied,available:rows.filter(function(r){return !r.occupied;}),status:occupied.length===0?'Disponible':occupied.length===rows.length?'Loué':'Partiellement loué'};
  }
  function inject(){
    if(document.getElementById('gp-biens-canonical-style'))return;
    document.head.insertAdjacentHTML('beforeend','<style id="gp-biens-canonical-style">'+
      '.gp-modern-page{padding:8px 24px!important}.gp-page-top{display:flex!important;align-items:center!important;gap:12px!important;margin-bottom:8px!important}.gp-stat-grid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:10px!important;flex:1!important}.gp-stat-card{background:#fff!important;border:1px solid #e5e7eb!important;border-radius:12px!important;padding:12px 16px!important;display:flex!important;align-items:center!important;gap:12px!important;min-height:66px!important}.gp-stat-ico{width:40px!important;height:40px!important;border-radius:10px!important;background:#fffbeb!important;color:#D4AF37!important;display:flex!important;align-items:center!important;justify-content:center!important}.gp-stat-card strong{font-size:24px!important;display:block!important;line-height:1!important;color:#111827!important}.gp-stat-card span{display:block!important;font-size:12px!important;font-weight:700!important;color:#374151!important;margin-top:4px!important}.gp-stat-card em{display:block!important;font-size:11px!important;color:#9ca3af!important;font-style:normal!important}.gp-primary{height:40px!important;border:0!important;border-radius:8px!important;background:#2563eb!important;color:white!important;padding:0 18px!important;font-weight:800!important;display:inline-flex!important;align-items:center!important;gap:7px!important;cursor:pointer!important;white-space:nowrap!important}.gp-toolbar{display:flex!important;align-items:center!important;gap:8px!important;margin-bottom:8px!important;width:100%!important}.gp-search{height:36px!important;width:250px!important;flex:0 0 250px!important;box-sizing:border-box!important;display:flex!important;align-items:center!important;gap:7px!important;background:#fff!important;border:1px solid #e5e7eb!important;border-radius:8px!important;padding:0 10px!important}.gp-search input{border:0!important;outline:0!important;background:transparent!important;width:100%!important;min-width:0!important;font-size:13px!important}.gp-select{height:36px!important;width:200px!important;flex:0 0 200px!important;box-sizing:border-box!important;border:1px solid #e5e7eb!important;background:#fff!important;border-radius:8px!important;padding:0 12px!important;font-size:13px!important;color:#374151!important}.gp-outline{height:36px!important;border:1px solid #e5e7eb!important;background:#fff!important;border-radius:8px!important;padding:0 12px!important;font-size:13px!important;color:#374151!important}.gp-toolbar>div:last-child{margin-left:auto!important;display:flex!important;align-items:center!important;gap:8px!important;flex:0 0 auto!important}.gp-footer{gap:16px!important}.gp-pages{margin-left:auto!important;flex-shrink:0!important}.gp-page-btn:disabled{opacity:.45!important;cursor:not-allowed!important;background:#f9fafb!important}.gp-pages>span{min-width:16px!important;text-align:center!important;color:#9ca3af!important}@media(max-width:760px){.gp-toolbar{flex-wrap:wrap!important}.gp-search,.gp-select{flex:1 1 180px!important;width:auto!important}.gp-toolbar>div:last-child{margin-left:0!important;width:100%!important;justify-content:flex-end!important}.gp-footer{flex-wrap:wrap!important}.gp-pages{margin-left:0!important}}.gp-outline{display:inline-flex!important;align-items:center!important;gap:5px!important;cursor:pointer!important}.gp-biens-grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))!important;gap:18px!important}.gp-bien-card{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 6px 18px rgba(15,23,42,.08);border:1px solid #eef2f7;position:relative;cursor:pointer}.gp-bien-card-img{height:128px;background:#e5e7eb;overflow:hidden}.gp-bien-card-img img{width:100%;height:100%;object-fit:cover;display:block}.gp-bien-card-body{padding:12px 14px}.gp-bien-card-title{font-size:15px;font-weight:800;color:#111827;margin-bottom:3px}.gp-bien-card-meta{display:flex;align-items:center;gap:7px;font-size:12px;color:#64748b}.gp-bien-card-price{margin-top:10px;font-size:13px;font-weight:800;color:#D4AF37}.gp-bien-card-owner{font-size:11px;color:#a78bfa;float:right;font-weight:500}.gp-bien-badge{display:inline-flex;border-radius:999px;padding:4px 9px;font-size:11px;font-weight:800;background:#fef3c7;color:#92400e;position:absolute;right:10px;top:10px;z-index:2}.gp-unit-badge{display:inline-flex;margin-top:8px;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:700;background:#fde68a;color:#92400e}.gp-unit-line{display:block;margin-top:6px;font-size:11px;font-weight:800}.gp-unit-line.ok{color:#15803d}.gp-unit-line.free{color:#2563eb}.gp-footer{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f3f4f6;color:#64748b;font-size:13px}.gp-pages{display:flex;align-items:center;gap:6px}.gp-page-btn{min-width:30px;height:30px;border-radius:7px;border:1px solid #e5e7eb;background:#fff;color:#374151;font-weight:700;cursor:pointer}.gp-page-btn.active{background:#2563eb;border-color:#2563eb;color:#fff}.gp-empty{padding:48px;text-align:center;color:#9ca3af}</style>');
  }
  function pageBtns(total){
    if(window.GPPagination) return GPPagination.pages('biens', total, PS.biens, renderBiensFinal);
    return '';
  }
  function renderBiensFinal(){
    inject();
    var page=document.getElementById('page-biens');if(!page)return;
    var d=db(),all=Array.isArray(d.biens)?d.biens:[];
    var q=(document.getElementById('gpBienSearch')||{}).value||'';
    var st=(document.getElementById('gpBienStatus')||{}).value||'';
    var data=all.filter(function(b){
      var snap=snapshot(d,b),effective=snap.status||'Disponible';
      var hay=JSON.stringify(b)+' '+effective+' '+(snap.units||[]).map(function(r){return (r.unit&&r.unit.nom)||'';}).join(' ');
      return (!q||hay.toLowerCase().indexOf(String(q).toLowerCase())>-1)&&(!st||String(effective).toLowerCase()===String(st).toLowerCase());
    });
    var start=((PAGE.biens||1)-1)*PS.biens,slice=data.slice(start,start+PS.biens);
    var unitStats=all.reduce(function(acc,b){var s=snapshot(d,b);acc.total+=(s.units||[]).length;acc.dispo+=(s.available||[]).length;acc.occ+=(s.occupied||[]).length;return acc;},{total:0,dispo:0,occ:0});
    page.innerHTML='<div class="gp-modern-page"><div class="gp-page-top"><div class="gp-stat-grid">'+
      '<div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">home_work</span></div><div><strong>'+all.length+'</strong><span>Biens</span><em>Total enregistrés</em></div></div>'+ 
      '<div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">meeting_room</span></div><div><strong>'+unitStats.dispo+'</strong><span>Unités disponibles</span><em>Appartements libres</em></div></div>'+ 
      '<div class="gp-stat-card"><div class="gp-stat-ico"><span class="material-symbols-rounded">key</span></div><div><strong>'+unitStats.occ+'</strong><span>Unités occupées</span><em>Appartements loués</em></div></div>'+ 
      '</div><button class="gp-primary" onclick="navigate(\'nv-bien\')"><span class="material-symbols-rounded">add</span>Nouveau bien</button></div>'+ 
      '<div class="gp-toolbar"><label class="gp-search"><span class="material-symbols-rounded" style="font-size:16px;color:#D4AF37">search</span><input id="gpBienSearch" value="'+esc(q)+'" placeholder="Rechercher un bien…" oninput="gpFinalPage(\'biens\',1)"></label>'+ 
      '<select id="gpBienStatus" class="gp-select" onchange="gpFinalPage(\'biens\',1)"><option value="">Tous les statuts</option><option '+(st==='Disponible'?'selected':'')+'>Disponible</option><option '+(st==='Loué'?'selected':'')+'>Loué</option><option '+(st==='En attente'?'selected':'')+'>En attente</option><option '+(st==='Partiellement loué'?'selected':'')+'>Partiellement loué</option></select>'+ 
      '<div style="margin-left:auto;display:flex;gap:8px"><button class="gp-outline" onclick="exportListePDF&&exportListePDF(\'biens\')"><span class="material-symbols-rounded" style="font-size:14px">file_download</span>Exporter</button><button class="gp-outline" onclick="openImportModal&&openImportModal(\'biens\')"><span class="material-symbols-rounded" style="font-size:14px">file_upload</span>Importer</button></div></div>'+ 
      (data.length?'<div class="gp-biens-grid">'+slice.map(function(b){
        var i=all.indexOf(b),s=snapshot(d,b),units=s.units||[];
        return '<div class="gp-bien-card" onclick="if(typeof openBienDetail===\'function\'){openBienDetail('+i+')}else{navigate(\'bien-detail\')}"><span class="gp-bien-badge">'+esc(s.status||'Disponible')+'</span><div class="gp-bien-card-img">'+(b.photo?'<img src="'+esc(b.photo)+'">':'<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8"><span class="material-symbols-rounded" style="font-size:48px">apartment</span></div>')+'</div><div class="gp-bien-card-body"><div class="gp-bien-card-title">'+esc(b.nom||'Bien')+'</div><div class="gp-bien-card-meta"><span class="material-symbols-rounded" style="font-size:15px;color:#D4AF37">apartment</span>'+esc(b.type||'Bien')+(units.length?' <span class="gp-unit-badge">'+units.length+' apparts</span>':'')+'</div><div class="gp-bien-card-price">'+money(b.valeur||b.prix||b.loyer)+'<span class="gp-bien-card-owner">'+esc(b.proprio||'')+'</span></div>'+(units.length?units.slice(0,4).map(function(r){return '<span class="gp-unit-line '+(r.occupied?'ok':'free')+'">'+esc(r.unit&&r.unit.nom||'Unité')+' · '+esc(r.statut||'Disponible')+'</span>';}).join('')+(units.length>4?'<span class="gp-unit-line free">+'+(units.length-4)+' autres unités</span>':''):'')+'</div></div>';
      }).join('')+'</div><div class="gp-footer" style="margin-top:14px;background:#fff;border:1px solid #e5e7eb;border-radius:12px"><span>Affichage de '+(start+1)+' à '+Math.min(start+PS.biens,data.length)+' sur '+data.length+' bien'+(data.length>1?'s':'')+'</span>'+pageBtns(data.length)+'</div>':'<div class="gp-empty">Aucun bien trouvé</div>')+'</div>';
  }
  window.gpFinalPage=function(kind,p){if(kind!=='biens')return;PAGE.biens=Math.max(1,Number(p)||1);if(window.GPPagination)GPPagination.state.biens=PAGE.biens;renderBiensFinal();};
  window.renderBiensFinal=renderBiensFinal;
  window.renderBiensCards=renderBiensFinal;
  window.GPBiensRenderer={render:renderBiensFinal,snapshot:snapshot};
  document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){if(document.getElementById('page-biens')&&document.getElementById('page-biens').classList.contains('active'))renderBiensFinal();},0);});
})();
