/* Genius Property V39 — final compact detail + expense indicator polish.
   This is a CSS-only presentation correction; no data or CRUD logic is changed. */
(function(){
  'use strict';
  if (document.getElementById('gp-v39-compact-final')) return;
  var s=document.createElement('style');
  s.id='gp-v39-compact-final';
  s.textContent=`
/* ===== Fiche détail Bien — compacte ===== */
#page-bien-detail{padding:12px 16px 24px!important;background:#f6f7f9!important}
#page-bien-detail .bd-restored{gap:9px!important;max-width:1180px!important;margin:0 auto!important}
#page-bien-detail .bd-restored-head{min-height:42px!important;padding:8px 10px!important;border-radius:11px!important;gap:9px!important;box-shadow:0 3px 10px rgba(15,23,42,.04)!important}
#page-bien-detail .bd-restored-title h2{font-size:17px!important;line-height:1.15!important}
#page-bien-detail .bd-restored-title p{font-size:10.5px!important;margin-top:2px!important}
#page-bien-detail .bd-restored-actions{gap:5px!important}
#page-bien-detail .bd-top-btn{height:30px!important;padding:0 9px!important;border-radius:8px!important;font-size:11px!important;gap:4px!important;box-shadow:none!important}
#page-bien-detail .bd-top-btn span{font-size:15px!important}
#page-bien-detail .bd-restored-hero{grid-template-columns:100px 1fr!important;gap:11px!important;padding:11px!important;border-radius:12px!important;box-shadow:0 4px 12px rgba(15,23,42,.045)!important}
#page-bien-detail .bd-restored-photo{height:86px!important;border-radius:10px!important}
#page-bien-detail .bd-restored-photo>span{font-size:38px!important}
#page-bien-detail .bd-restored-main h1{font-size:19px!important;margin:4px 0 2px!important;line-height:1.15!important}
#page-bien-detail .bd-restored-main p{font-size:10.5px!important;gap:3px!important}
#page-bien-detail .bd-restored-main p span{font-size:14px!important}
#page-bien-detail .bd-status-pill{padding:3px 7px!important;font-size:10px!important}
#page-bien-detail .bd-restored-kpis{gap:6px!important;margin-top:8px!important}
#page-bien-detail .bd-restored-kpis div{padding:7px 8px!important;border-radius:8px!important}
#page-bien-detail .bd-restored-kpis small,#page-bien-detail .bd-info-grid-4 label{font-size:8px!important;margin-bottom:2px!important}
#page-bien-detail .bd-restored-kpis b{font-size:11px!important}
#page-bien-detail .bd-restored-tabs{gap:3px!important;padding:4px!important;border-radius:10px!important;box-shadow:none!important}
#page-bien-detail .bd-restored-tab{height:34px!important;padding:0 10px!important;border-radius:7px!important;gap:4px!important;font-size:10.5px!important}
#page-bien-detail .bd-restored-tab .material-symbols-rounded{font-size:14px!important}
#page-bien-detail .bd-restored-panel{padding:11px!important;border-radius:12px!important;box-shadow:0 3px 10px rgba(15,23,42,.035)!important;margin-bottom:0!important}
#page-bien-detail .bd-restored-panel h3{font-size:12.5px!important;margin:0 0 8px!important}
#page-bien-detail .bd-info-grid-4{gap:6px!important}
#page-bien-detail .bd-info-grid-4>div{padding:7px 8px!important;border-radius:8px!important}
#page-bien-detail .bd-info-grid-4 b{font-size:11px!important}
#page-bien-detail .bd-restored-panel h3[style*="margin-top"]{margin-top:10px!important}
#page-bien-detail .bd-owner-card{padding:9px!important;gap:9px!important;border-radius:10px!important;margin-bottom:8px!important}
#page-bien-detail .bd-owner-avatar{width:40px!important;height:40px!important;border-radius:10px!important;font-size:14px!important}
#page-bien-detail .bd-owner-info h3{font-size:13px!important;margin:0!important}
#page-bien-detail .bd-owner-info p{font-size:10px!important;margin:2px 0 0!important}
#page-bien-detail .bd-restored-panel .bd-owner-grid{gap:6px!important}
#page-bien-detail .bd-restored-panel .bd-owner-grid>div{padding:7px 8px!important;border-radius:8px!important}
#page-bien-detail .bd-restored-panel .bd-owner-grid label{font-size:8px!important}
#page-bien-detail .bd-restored-panel .bd-owner-grid b{font-size:10.5px!important}
#page-bien-detail .bd-location-card{padding:9px!important;border-radius:10px!important;margin-bottom:7px!important}
#page-bien-detail .bd-location-top{margin-bottom:7px!important}
#page-bien-detail .bd-location-grid{gap:6px!important}
#page-bien-detail .bd-location-grid div{padding:7px 8px!important;border-radius:8px!important}
#page-bien-detail .bd-location-grid label{font-size:8px!important}
#page-bien-detail .bd-location-grid b{font-size:10.5px!important}
#page-bien-detail .bd-doc-add{padding:8px!important;border-radius:10px!important;gap:6px!important}
#page-bien-detail .bd-doc-add input{height:32px!important;border-radius:8px!important;font-size:11px!important}
#page-bien-detail .bd-doc-add button{height:32px!important;border-radius:8px!important;font-size:10px!important;padding:0 9px!important}
#page-bien-detail .bd-doc-card{padding:8px!important;border-radius:9px!important;margin-bottom:6px!important}
#page-bien-detail .bd-doc-icon{width:32px!important;height:32px!important;border-radius:8px!important}
#page-bien-detail .bd-doc-meta b{font-size:11px!important}
#page-bien-detail .bd-doc-meta small{font-size:9px!important}
#page-bien-detail .bd-doc-actions button{width:29px!important;height:29px!important;border-radius:8px!important}

/* ===== Propriétaire : informations réellement lisibles et alignées ===== */
#page-bien-detail #bdRestored-proprio .bd-owner-detail-grid,
#page-bien-detail #bdRestored-proprio .bd-owner-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important;margin-top:7px!important}
#page-bien-detail #bdRestored-proprio .bd-owner-detail-grid>div,
#page-bien-detail #bdRestored-proprio .bd-owner-grid>div{background:#f8fafc!important;border:1px solid #edf2f7!important;border-radius:8px!important;padding:7px 8px!important;min-width:0!important}
#page-bien-detail #bdRestored-proprio .bd-owner-detail-grid label,
#page-bien-detail #bdRestored-proprio .bd-owner-grid label{display:block!important;color:#64748b!important;font-size:8px!important;font-weight:800!important;text-transform:uppercase!important;margin-bottom:2px!important}
#page-bien-detail #bdRestored-proprio .bd-owner-detail-grid b,
#page-bien-detail #bdRestored-proprio .bd-owner-grid b{display:block!important;color:#111827!important;font-size:10.5px!important;line-height:1.25!important;overflow-wrap:anywhere!important}


/* ===== Finance pages: same compact top row as other modules ===== */
#page-paiements .gpf-top,#page-depenses .gpf-top{display:contents!important}
#page-paiements .gpf-title-page,#page-depenses .gpf-title-page{display:none!important}
#page-paiements .gpf-page,#page-depenses .gpf-page{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;column-gap:10px!important;row-gap:8px!important;align-items:start!important}
#page-paiements .gpf-cards,#page-depenses .gpf-cards{grid-column:1!important;grid-row:1!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;margin:0!important}
#page-paiements .gpf-top .gpf-add,#page-depenses .gpf-top .gpf-add{grid-column:2!important;grid-row:1!important;align-self:stretch!important;height:36px!important;min-height:36px!important;margin:0!important}
#page-paiements .gpf-toolbar,#page-depenses .gpf-toolbar,#page-paiements .gpf-table,#page-depenses .gpf-table,#page-paiements .gpf-page-footer,#page-depenses .gpf-page-footer{grid-column:1 / -1!important}
#page-paiements .gpf-card,#page-depenses .gpf-card{min-height:60px!important;padding:8px 10px!important}
#page-paiements .gpf-toolbar,#page-depenses .gpf-toolbar{margin:0 0 2px!important}
/* Propriétaire dans la fiche bien : même grille typographique que les autres détails */
#page-bien-detail #bdRestored-proprio .bd-info-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important;margin-top:7px!important}
#page-bien-detail #bdRestored-proprio .bd-info-grid>div{background:#f8fafc!important;border:1px solid #edf2f7!important;border-radius:8px!important;padding:7px 8px!important;min-width:0!important}
#page-bien-detail #bdRestored-proprio .bd-info-grid label{display:block!important;color:#64748b!important;font-size:8px!important;font-weight:800!important;text-transform:uppercase!important;margin-bottom:2px!important}
#page-bien-detail #bdRestored-proprio .bd-info-grid b{display:block!important;color:#111827!important;font-size:10.5px!important;line-height:1.25!important;overflow-wrap:anywhere!important}
#page-bien-detail #bdRestored-proprio .bd-owner-info h3{font-size:13px!important}
#page-bien-detail #bdRestored-proprio .bd-owner-info p{font-size:10px!important;color:#64748b!important}
@media(max-width:760px){#page-paiements .gpf-page,#page-depenses .gpf-page{grid-template-columns:1fr!important}#page-paiements .gpf-cards,#page-depenses .gpf-cards{grid-column:1!important;grid-row:auto!important;grid-template-columns:1fr!important}#page-paiements .gpf-top .gpf-add,#page-depenses .gpf-top .gpf-add{grid-column:1!important;grid-row:auto!important;justify-self:end!important}#page-bien-detail #bdRestored-proprio .bd-info-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}

/* ===== Dépenses : indicateur discret, court et à droite ===== */
#page-depenses .gp-v37-expense-bar{width:360px!important;max-width:calc(100% - 16px)!important;margin:5px 0 7px auto!important}
#page-depenses .gp-v37-expense-head{margin-bottom:3px!important;font-size:9px!important;gap:7px!important;justify-content:flex-end!important}
#page-depenses .gp-v37-expense-head b{font-size:10px!important}
#page-depenses .gp-v37-expense-track{height:42px!important;border-radius:6px!important}
#page-depenses .gp-v37-expense-seg{border-right:1px solid rgba(255,255,255,.9)!important}
#page-depenses .gp-v37-expense-seg strong{font-size:9px!important;color:#fff!important}
#page-depenses .gp-v37-expense-seg b{font-size:11px!important;color:#fff!important;margin-top:0!important}
#page-depenses .gp-v37-expense-seg small{font-size:8px!important;color:#fff!important;margin-top:0!important}
@media(max-width:700px){#page-depenses .gp-v37-expense-bar{width:330px!important}#page-depenses .gp-v37-expense-track{height:38px!important}}
@media(max-width:650px){#page-bien-detail #bdRestored-proprio .bd-owner-detail-grid,#page-bien-detail #bdRestored-proprio .bd-owner-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
`;
  document.head.appendChild(s);
})();

/* V41 — Finance pages alignées exactement sur la structure Biens */
(function(){
  'use strict';
  if (document.getElementById('gp-v41-finance-align')) return;
  var s=document.createElement('style');
  s.id='gp-v41-finance-align';
  s.textContent=`
    #page-paiements .gpf-page,
    #page-depenses .gpf-page{
      padding:8px 24px 24px!important;
      box-sizing:border-box!important;
      row-gap:18px!important;
      column-gap:12px!important;
    }
    #page-paiements .gpf-cards,
    #page-depenses .gpf-cards{
      gap:10px!important;
      margin:0!important;
    }
    #page-paiements .gpf-card,
    #page-depenses .gpf-card{
      min-height:60px!important;
      height:60px!important;
      box-sizing:border-box!important;
      padding:8px 10px!important;
      border-radius:13px!important;
    }
    #page-paiements .gpf-top .gpf-add,
    #page-depenses .gpf-top .gpf-add{
      align-self:center!important;
      height:40px!important;
      min-height:40px!important;
      padding:0 18px!important;
      border-radius:8px!important;
      box-sizing:border-box!important;
    }
    #page-paiements .gpf-toolbar,
    #page-depenses .gpf-toolbar{
      margin:0!important;
      min-height:36px!important;
    }
    #page-paiements .gpf-toolbar input,
    #page-paiements .gpf-toolbar select,
    #page-depenses .gpf-toolbar input,
    #page-depenses .gpf-toolbar select{
      height:36px!important;
      box-sizing:border-box!important;
    }
    #page-depenses .gp-v37-expense-bar{
      grid-column:1 / -1!important;
      justify-self:end!important;
      width:360px!important;
      max-width:100%!important;
      margin:0 0 2px auto!important;
    }
    #page-depenses .gp-v37-expense-track{height:42px!important}
    @media(max-width:760px){
      #page-paiements .gpf-page,
      #page-depenses .gpf-page{padding:8px 12px 20px!important;row-gap:12px!important}
      #page-depenses .gp-v37-expense-bar{width:100%!important}
    }
  `;
  document.head.appendChild(s);
})();


/* V41.1 — Correctif Dépenses : 4 indicateurs et bouton d'action stables en mode analyse */
(function(){
  'use strict';
  if (document.getElementById('gp-v41-1-expense-analysis-fix')) return;
  var s=document.createElement('style');
  s.id='gp-v41-1-expense-analysis-fix';
  s.textContent=`
    #page-depenses .gpf-page{
      min-width:0!important;
      overflow:visible!important;
    }
    #page-depenses .gpf-cards.gpf-expense-cards{
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      min-width:0!important;
      width:100%!important;
    }
    #page-depenses .gpf-cards.gpf-expense-cards .gpf-card{
      min-width:0!important;
      width:auto!important;
      overflow:hidden!important;
    }
    #page-depenses .gpf-cards.gpf-expense-cards .gpf-card small,
    #page-depenses .gpf-cards.gpf-expense-cards .gpf-card strong{
      min-width:0!important;
      overflow:hidden!important;
      text-overflow:ellipsis!important;
    }
    #page-depenses .gpf-top .gpf-add{
      width:auto!important;
      max-width:100%!important;
      justify-self:start!important;
      white-space:nowrap!important;
    }
    #page-depenses .gpf-analysis{
      width:100%!important;
      min-width:0!important;
      box-sizing:border-box!important;
    }
    #page-depenses .gpf-analysis-card{
      min-width:0!important;
      overflow:hidden!important;
      box-sizing:border-box!important;
    }
    #page-depenses .gpf-analysis-table{
      table-layout:fixed!important;
    }
    #page-depenses .gpf-analysis-table th:first-child,
    #page-depenses .gpf-analysis-table td:first-child{
      width:40%!important;
    }
    @media(max-width:900px){
      #page-depenses .gpf-cards.gpf-expense-cards{
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
      }
    }
    @media(max-width:760px){
      #page-depenses .gpf-cards.gpf-expense-cards{
        grid-template-columns:1fr!important;
      }
      #page-depenses .gpf-top .gpf-add{
        justify-self:end!important;
      }
    }
  `;
  document.head.appendChild(s);
})();

/* V41.2 — Dépenses : en-tête stable et suppression de la barre de répartition */
(function(){
  'use strict';
  if (document.getElementById('gp-v41-2-expenses-clean')) return;
  var s=document.createElement('style');
  s.id='gp-v41-2-expenses-clean';
  s.textContent=`
    /* La barre colorée de répartition mensuelle est retirée : les indicateurs et l'analyse suffisent. */
    #page-depenses .gp-v37-expense-bar{display:none!important}

    /* Structure simple et stable : bouton en haut, puis les 4 indicateurs sur toute la largeur. */
    #page-depenses .gpf-page{
      display:block!important;
      width:100%!important;
      min-width:0!important;
      box-sizing:border-box!important;
      padding:8px 24px 24px!important;
    }
    #page-depenses .gpf-top{
      display:flex!important;
      align-items:center!important;
      justify-content:flex-end!important;
      width:100%!important;
      min-height:40px!important;
      margin:0 0 12px!important;
    }
    #page-depenses .gpf-title-page{display:none!important}
    #page-depenses .gpf-top .gpf-add{
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      width:auto!important;
      min-width:150px!important;
      height:40px!important;
      min-height:40px!important;
      margin:0!important;
      white-space:nowrap!important;
    }
    #page-depenses .gpf-cards.gpf-expense-cards{
      display:grid!important;
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      width:100%!important;
      min-width:0!important;
      margin:0 0 12px!important;
      gap:10px!important;
      box-sizing:border-box!important;
    }
    #page-depenses .gpf-cards.gpf-expense-cards .gpf-card{
      width:auto!important;
      min-width:0!important;
      height:60px!important;
      min-height:60px!important;
      box-sizing:border-box!important;
      overflow:hidden!important;
    }
    @media(max-width:900px){
      #page-depenses .gpf-cards.gpf-expense-cards{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    }
    @media(max-width:760px){
      #page-depenses .gpf-page{padding:8px 12px 20px!important}
      #page-depenses .gpf-cards.gpf-expense-cards{grid-template-columns:1fr!important}
      #page-depenses .gpf-top .gpf-add{width:100%!important;min-width:0!important}
    }
  `;
  document.head.appendChild(s);
})();

/* V42 — Dépenses : cartes réduites + bouton sur la même ligne, couleurs distinctes, filtres compacts avec flèche */
(function(){
  'use strict';
  if (document.getElementById('gp-v42-depenses-compact')) return;
  var s=document.createElement('style');
  s.id='gp-v42-depenses-compact';
  s.textContent=`
    /* Ligne du haut : 4 cartes compactes + bouton « Nouvelle dépense » sur la même ligne */
    #page-depenses .gpf-expense-summary-row{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) auto!important;
      align-items:center!important;
      gap:8px!important;
      width:100%!important;
      margin:0 0 8px!important;
    }
    #page-depenses .gpf-expense-summary-row .gpf-cards.gpf-expense-cards{
      display:grid!important;
      grid-template-columns:repeat(4,minmax(0,1fr))!important;
      gap:6px!important;
      margin:0!important;
      width:100%!important;
    }
    #page-depenses .gpf-expense-summary-row .gpf-cards.gpf-expense-cards .gpf-card{
      height:40px!important;
      min-height:40px!important;
      padding:4px 10px!important;
      border-radius:9px!important;
      display:flex!important;
      flex-direction:column!important;
      justify-content:center!important;
      box-sizing:border-box!important;
    }
    #page-depenses .gpf-expense-cards .gpf-card small{
      font-size:9px!important;
      line-height:1.1!important;
      font-weight:800!important;
      white-space:nowrap!important;
    }
    #page-depenses .gpf-expense-cards .gpf-card strong{
      font-size:12.5px!important;
      line-height:1.15!important;
      margin-top:1px!important;
      white-space:nowrap!important;
    }
    /* Une couleur d'écriture différente par carte */
    #page-depenses .gpf-card-total small,  #page-depenses .gpf-card-total strong{color:#7c3aed!important}
    #page-depenses .gpf-card-biens small,  #page-depenses .gpf-card-biens strong{color:#2563eb!important}
    #page-depenses .gpf-card-agence small, #page-depenses .gpf-card-agence strong{color:#059669!important}
    #page-depenses .gpf-card-travaux small,#page-depenses .gpf-card-travaux strong{color:#d97706!important}

    /* Bouton réduit, même hauteur que les cartes */
    #page-depenses .gpf-expense-summary-row .gpf-expense-add{
      width:auto!important;
      min-width:0!important;
      height:40px!important;
      min-height:40px!important;
      padding:0 11px!important;
      margin:0!important;
      font-size:11px!important;
      border-radius:9px!important;
      white-space:nowrap!important;
      justify-self:end!important;
      display:inline-flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:3px!important;
      box-sizing:border-box!important;
    }

    /* Barre de filtres réduite : tous les champs sur une ligne */
    #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar{
      display:grid!important;
      grid-template-columns:minmax(110px,1.2fr) 122px 108px 112px 114px 128px auto!important;
      gap:5px!important;
      align-items:center!important;
      width:100%!important;
      margin:0 0 8px!important;
      min-height:0!important;
    }
    #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar input,
    #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar select{
      height:28px!important;
      min-height:28px!important;
      width:100%!important;
      min-width:0!important;
      max-width:none!important;
      padding:0 8px!important;
      font-size:11px!important;
      border-radius:7px!important;
      box-sizing:border-box!important;
      flex:none!important;
    }
    #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar .gpf-select-wrap{
      position:relative!important;
      display:block!important;
      width:100%!important;
      min-width:0!important;
      max-width:none!important;
      flex:none!important;
    }
    /* Flèche visible sur les listes de sélection */
    #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar .gpf-select-wrap::after{content:none!important}
    #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar .gpf-select-wrap select{
      appearance:none!important;
      -webkit-appearance:none!important;
      padding-right:22px!important;
      cursor:pointer!important;
      background-color:#fff!important;
      background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a6b0a' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")!important;
      background-repeat:no-repeat!important;
      background-position:right 7px center!important;
      background-size:11px 11px!important;
    }
    #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar .gpf-month-filter{cursor:pointer!important}
    #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar .gpf-toolbar-actions{
      margin:0!important;
      gap:4px!important;
      flex:none!important;
    }
    #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar .gpf-import-export{
      height:28px!important;
      min-height:28px!important;
      padding:0 7px!important;
      font-size:10px!important;
      border-radius:7px!important;
      gap:3px!important;
    }
    #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar .gpf-import-export .material-symbols-rounded{font-size:13px!important}

    @media(max-width:980px){
      #page-depenses .gpf-expense-summary-row{grid-template-columns:1fr!important}
      #page-depenses .gpf-expense-summary-row .gpf-expense-add{justify-self:end!important}
      #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar{
        grid-template-columns:repeat(3,minmax(0,1fr))!important;
      }
      #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar #gpf-page-dep-search{grid-column:span 2!important}
      #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar .gpf-toolbar-actions{justify-content:flex-end!important}
    }
    @media(max-width:700px){
      #page-depenses .gpf-expense-summary-row .gpf-cards.gpf-expense-cards{
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
      }
      #page-depenses .gpf-expense-summary-row .gpf-expense-add{width:100%!important}
      #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar{
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
      }
      #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar #gpf-page-dep-search{grid-column:1 / -1!important}
    }
  `;
  document.head.appendChild(s);
})();

/* V43 — Dépenses : même espace en haut que Biens + style unique des listes de sélection sur toute l'appli */
(function(){
  'use strict';
  if (document.getElementById('gp-v43-spacing-select')) return;
  var s=document.createElement('style');
  s.id='gp-v43-spacing-select';
  s.textContent=`
    /* Dépenses : l'ancien bloc d'en-tête est vide (le bouton est dans la ligne des cartes) → il ajoutait ~52px.
       Résultat : même marge haute que Biens (8px), cartes directement sous le haut de page. */
    #page-depenses .gpf-top{
      display:none!important;
      min-height:0!important;
      height:0!important;
      margin:0!important;
      padding:0!important;
    }
    #page-depenses .gpf-page{padding-top:8px!important}
    #page-depenses .gpf-expense-summary-row{margin-bottom:8px!important}

    /* Listes de sélection : flèche dorée visible, même aspect partout */
    html body select:not([multiple]):not([size]),
    html body select[size="1"]{
      -webkit-appearance:none!important;
      -moz-appearance:none!important;
      appearance:none!important;
      background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a6b0a' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")!important;
      background-repeat:no-repeat!important;
      background-position:right 9px center!important;
      background-size:11px 11px!important;
      padding-right:28px!important;
      border-radius:8px!important;
      cursor:pointer!important;
      text-overflow:ellipsis;
    }
    html body select:not([multiple]):not([size]):focus,
    html body select[size="1"]:focus{
      outline:none!important;
      border-color:#d4af37!important;
      box-shadow:0 0 0 2px rgba(212,175,55,.14)!important;
    }
    html body select:not([multiple]):not([size]):disabled,
    html body select[size="1"]:disabled{cursor:not-allowed!important;opacity:.6}
    /* Fond blanc par défaut si aucun fond n'est défini (n'écrase aucun style existant) */
    select:where(:not([multiple]):not([size])){background-color:#fff}
    /* Thème sombre : flèche plus claire pour rester lisible */
    html body.dark select:not([multiple]):not([size]),
    html body.dark select[size="1"]{
      background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d4af37' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")!important;
    }
    /* Dans la barre Dépenses : padding plus serré (champs réduits) */
    #page-depenses .gpf-toolbar.gpf-toolbar-finance.gpf-expense-toolbar .gpf-select-wrap select{padding-right:22px!important;background-position:right 7px center!important;border-radius:7px!important}
  `;
  document.head.appendChild(s);
})();
