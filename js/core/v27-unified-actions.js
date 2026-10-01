/* Genius Property V27 — unified detail/edit drawers
 * Keeps the existing data/forms, but makes Locations + Finance use the same
 * gpad actions drawer and restores the location -> contract detail link.
 */
(function(){
  'use strict';
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  var db=function(){return window.GPDB&&GPDB.load?GPDB.load():(window.DB||{});};
  var money=function(v){var n=Number(String(v||'').replace(/[^0-9,.-]/g,'').replace(',','.'));return Number.isFinite(n)?Math.round(n).toLocaleString('fr-FR')+' FCFA':'—';};

  /* Export the existing unified drawer primitives once. */
  if(window.gpUnifiedOpenDrawer==null && window.gpOpenActionsDrawer==null){
    /* pages/biens.js is expected to expose these in V27; fallback below is only
       used if the export is unavailable. */
  }

  function openDrawer(head, body, foot){
    if(typeof window.gpUnifiedOpenDrawer==='function') return window.gpUnifiedOpenDrawer(head,body,foot);
    /* Defensive fallback: same dimensions/style as the gpad drawer. */
    document.getElementById('gpActionsDrawerOverlay')?.remove();
    document.getElementById('gpActionsDrawer')?.remove();
    var html='<div id="gpActionsDrawerOverlay" style="position:fixed;inset:0;background:rgba(15,23,42,.42);z-index:9998" onclick="window.gpCloseActionsDrawer&&gpCloseActionsDrawer()"></div>'+
      '<aside id="gpActionsDrawer" style="position:fixed;top:0;right:0;bottom:0;width:min(560px,94vw);background:#fff;z-index:9999;display:flex;flex-direction:column;box-shadow:-20px 0 45px rgba(15,23,42,.22)">'+head+'<div class="gpad-body" style="flex:1;overflow:auto;padding:18px 20px">'+body+'</div><div class="gpad-foot" style="padding:12px 20px;border-top:1px solid #eef2f7;display:flex;justify-content:flex-end;gap:8px">'+foot+'</div></aside>';
    document.body.insertAdjacentHTML('beforeend',html);
  }
  /* Fermeture du tiroir d'actions : était appelée partout (fond, croix, bouton Fermer) mais jamais définie. */
  if(typeof window.gpCloseActionsDrawer!=='function'){
    window.gpCloseActionsDrawer=function(){
      ['gpActionsDrawerOverlay','gpActionsDrawer'].forEach(function(id){
        var el=document.getElementById(id); if(el) el.remove();
      });
    };
  }
  function head(icon,title,sub){
    return '<div class="gpad-head"><div class="gpad-head-left"><div class="gpad-title"><span class="material-symbols-rounded" style="font-size:18px;color:#D4AF37;vertical-align:middle;margin-right:6px">'+esc(icon)+'</span>'+esc(title)+'</div><div class="gpad-sub">'+esc(sub||'')+'</div></div><button class="gpad-close" onclick="window.gpCloseActionsDrawer&&gpCloseActionsDrawer()"><span class="material-symbols-rounded" style="font-size:18px">close</span></button></div>';
  }
  function field(label,value,full){return '<div class="view-field'+(full?' full':'')+'"><label>'+esc(label)+'</label><span>'+esc(value==null||value===''?'—':value)+'</span></div>';}
  function section(title,html){return '<div style="margin-bottom:18px"><h3 style="font-size:12px;font-weight:900;color:#374151;border-bottom:1px solid #eef2f7;padding-bottom:8px;margin:0 0 12px">'+esc(title)+'</h3><div class="view-grid">'+html+'</div></div>';}

  /* Location detail: include the active contract in the same drawer. */
  function findContract(d,l){
    var list=Array.isArray(d.contrats)?d.contrats:[];
    var name=String(l.nom||'').trim(), tenant=String(l.locataire||l.occupant||'').trim(), bien=String(l.bien||'').trim();
    return list.find(function(c){return c.locative&&name&&String(c.locative).trim()===name;}) ||
           list.find(function(c){return tenant&&String(c.locataire||'').trim()===tenant && bien && String(c.bien||c.locative||'').trim()===bien;}) ||
           list.find(function(c){return tenant&&String(c.locataire||'').trim()===tenant && name&&String(c.locative||'').trim()===name;}) || null;
  }
  function viewLocationWithContract(idx){
    var d=db(), l=(d.locatives||[])[idx]; if(!l)return;
    var c=findContract(d,l), ci=c?(d.contrats||[]).indexOf(c):-1;
    var body=section('Informations location',
      field('Nom / Référence',l.nom||l.bien,true)+field('Bien',l.bien)+field('Locataire',l.locataire||l.occupant)+field('Loyer',money(l.loyer||l.montant))+field('Charges',l.charge)+field('Date d’entrée',l.dateEntree||l.date_entree)+field('Statut',l.statut));
    if(c){
      body+=section('Contrat associé',
        field('N° contrat',c.num||c.numero||'—')+
        field('Statut',c.statut||'—')+
        field('Début',c.debut||'—')+
        field('Fin',c.fin||'—')+
        field('Loyer contrat',money(c.loyer))+
        field('Prochain paiement',c.prochain||'—',true));
    }else{
      body+='<div style="padding:12px;border:1px dashed #e5e7eb;border-radius:10px;color:#64748b;font-size:12px">Aucun contrat associé à cette location.</div>';
    }
    var foot='<button class="gpad-btn cancel" onclick="window.gpCloseActionsDrawer()">Fermer</button>'+
      (ci>=0?'<button class="gpad-btn blue" onclick="window.gpCloseActionsDrawer();setTimeout(function(){window.viewRow(\'contrats\','+ci+')},60)"><span class="material-symbols-rounded" style="font-size:15px">description</span>Voir le contrat</button>':'')+
      '<button class="gpad-btn primary" onclick="window.gpCloseActionsDrawer();setTimeout(function(){window.editRow(\'locatives\','+idx+')},60)"><span class="material-symbols-rounded" style="font-size:15px">edit</span>Modifier</button>';
    openDrawer(head('key',l.nom||l.bien||'Location','Fiche location'),body,foot);
  }

  /* Ensure clicking a property card always opens a detail drawer, even if an
     older openBienDetail implementation is present but unusable. */
  function bindBienCards(){
    document.querySelectorAll('#page-biens .gp-bien-card').forEach(function(card){
      if(card.dataset.gpV27Bound)return; card.dataset.gpV27Bound='1';
      card.addEventListener('click',function(e){
        if(e.target.closest('button,a,input,select,textarea'))return;
        var m=(card.getAttribute('onclick')||'').match(/openBienDetail\??[^0-9]*(\d+)/);
        var idx=m?Number(m[1]):-1;
        if(idx>=0 && typeof window.viewRow==='function'){e.preventDefault();e.stopPropagation();window.viewRow('biens',idx);}
      },true);
    });
  }

  function install(){
    /* Save access to the current unified generic edit before finance can replace it. */
    if(typeof window.gpUnifiedEditRow!=='function' && typeof window.editRow==='function') window.gpUnifiedEditRow=window.editRow;
    if(typeof window.gpUnifiedViewRow!=='function' && typeof window.viewRow==='function') window.gpUnifiedViewRow=window.viewRow;
    var previousEdit=window.editRow;
    window.editRow=function(key,idx){
      /* Locations always use the exact same unified drawer for New + Edit.
       * Never fall back to the legacy location editor here. */
      if(key==='locatives' && window.gpUL && typeof window.gpUL.edit==='function') return window.gpUL.edit(idx);
      if((key==='paiements'||key==='depenses') && typeof window.gpUnifiedEditRow==='function') return window.gpUnifiedEditRow(key,idx);
      return typeof previousEdit==='function'?previousEdit.apply(this,arguments):undefined;
    };
    var previousView=window.viewRow;
    window.viewRow=function(key,idx){
      /* Location detail is rendered by the same unified location workflow so
         the contract, tenant information and tenant documents are all shown. */
      if(key==='locatives' && window.gpUL && typeof window.gpUL.view==='function') return window.gpUL.view(idx);
      return typeof previousView==='function'?previousView.apply(this,arguments):undefined;
    };
    window.gpV27ViewLocation=viewLocationWithContract;
    setTimeout(bindBienCards,100);
    document.addEventListener('click',function(e){if(e.target.closest('#page-biens .gp-bien-card'))setTimeout(bindBienCards,0);},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
