(function(){'use strict';
  if(document.getElementById('gp-ui-consistency-v25')) return;
  const s=document.createElement('style'); s.id='gp-ui-consistency-v25';
  s.textContent=`
/* V25 — dimensions communes des cartes KPI */
#page-biens .gp-stat-grid,#page-locatives .gp-stat-grid{align-items:stretch!important}
#page-biens .gp-stat-card,#page-locatives .gp-stat-card{min-height:60px!important;height:60px!important;padding:8px 10px!important;border-radius:13px!important;gap:8px!important;box-sizing:border-box!important;display:flex!important;align-items:center!important}
#page-biens .gp-stat-ico,#page-locatives .gp-stat-ico{width:38px!important;height:38px!important;min-width:38px!important;border-radius:10px!important;display:flex!important;align-items:center!important;justify-content:center!important}
#page-biens .gp-stat-card strong,#page-locatives .gp-stat-card strong{font-size:18px!important;line-height:1.05!important}
#page-biens .gp-stat-card span,#page-locatives .gp-stat-card span{font-size:11px!important;line-height:1.15!important}
#page-biens .gp-stat-card em,#page-locatives .gp-stat-card em{font-size:10px!important;line-height:1.1!important}

/* Import / Export : même taille compacte sur toute l'application */
.gp-outline,.prop-btn-sm-outline,.emp-btn-sm-outline,.btn-import,.gp-export-btn,.cfg-export-btn,.gpf-import-export{height:32px!important;min-height:32px!important;padding:0 9px!important;border-radius:8px!important;font-size:11px!important;line-height:1!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;box-sizing:border-box!important;white-space:nowrap!important}
.gp-outline .material-symbols-rounded,.prop-btn-sm-outline .material-symbols-rounded,.emp-btn-sm-outline .material-symbols-rounded,.btn-import .material-symbols-rounded,.gp-export-btn .material-symbols-rounded,.cfg-export-btn .material-symbols-rounded{font-size:14px!important}

/* Journal : recherche + actions + modules sur une seule ligne */
#page-journal .gp-v20-filters{display:flex!important;align-items:center!important;gap:8px!important;flex-wrap:nowrap!important;width:100%!important;margin:0 0 14px!important}
#page-journal .gp-v20-search{margin:0!important;flex:1 1 auto!important;min-width:180px!important;height:32px!important;box-sizing:border-box!important}
#page-journal .gp-v20-search input{padding:7px 4px!important;font-size:11px!important}
#page-journal .gp-v20-filters select{height:32px!important;min-width:160px!important;padding:0 9px!important;font-size:11px!important;border-radius:8px!important;box-sizing:border-box!important}
#page-journal .gp-v20-head-actions{display:flex!important;gap:6px!important;align-items:center!important}
#page-journal .gp-v20-secondary,#page-journal .gp-v20-danger{height:32px!important;padding:0 9px!important;border-radius:8px!important;font-size:11px!important}
@media(max-width:800px){#page-journal .gp-v20-filters{flex-wrap:wrap!important}#page-journal .gp-v20-search{flex:1 1 100%!important}#page-journal .gp-v20-filters select{flex:1 1 160px!important}}

/* Finance — recherche + filtre + import/export sur UNE seule ligne (desktop) */
#page-paiements .gpf-toolbar-finance,
#page-depenses .gpf-toolbar-finance{
  display:flex!important;
  flex-direction:row!important;
  align-items:center!important;
  flex-wrap:nowrap!important;
  gap:8px!important;
  width:100%!important;
  margin:0 0 12px!important;
  box-sizing:border-box!important;
}
#page-paiements .gpf-toolbar-finance input,
#page-depenses .gpf-toolbar-finance input{
  flex:1 1 auto!important;
  width:auto!important;
  min-width:220px!important;
  max-width:none!important;
  height:32px!important;
  box-sizing:border-box!important;
}
#page-paiements .gpf-toolbar-finance select,
#page-depenses .gpf-toolbar-finance select{
  flex:0 0 190px!important;
  width:190px!important;
  height:32px!important;
  box-sizing:border-box!important;
}
#page-paiements .gpf-toolbar-actions,
#page-depenses .gpf-toolbar-actions{
  margin-left:auto!important;
  flex:0 0 auto!important;
  display:flex!important;
  align-items:center!important;
  gap:6px!important;
  white-space:nowrap!important;
}
#page-paiements .gpf-import-export,
#page-depenses .gpf-import-export{
  height:32px!important;
  min-height:32px!important;
  padding:0 9px!important;
  border:1px solid #e5e7eb!important;
  border-radius:8px!important;
  background:#fff!important;
  color:#374151!important;
  font-size:11px!important;
  font-weight:700!important;
  display:inline-flex!important;
  align-items:center!important;
  justify-content:center!important;
  gap:5px!important;
  box-sizing:border-box!important;
  white-space:nowrap!important;
}
#page-paiements .gpf-import-export .material-symbols-rounded,
#page-depenses .gpf-import-export .material-symbols-rounded{
  font-size:14px!important;
}
@media(max-width:900px){
  #page-paiements .gpf-toolbar-finance,
  #page-depenses .gpf-toolbar-finance{flex-wrap:wrap!important}
  #page-paiements .gpf-toolbar-finance input,
  #page-depenses .gpf-toolbar-finance input{flex:1 1 100%!important}
  #page-paiements .gpf-toolbar-finance select,
  #page-depenses .gpf-toolbar-finance select{flex:1 1 180px!important;width:auto!important}
  #page-paiements .gpf-toolbar-actions,
  #page-depenses .gpf-toolbar-actions{margin-left:0!important}
}
`;
  document.head.appendChild(s);
})();
