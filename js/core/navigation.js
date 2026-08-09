
/* ================================================================
   GENIUS PROPERTY V20 — Navigation Layer
   Objectif : sortir la navigation de app.legacy.bundle.js sans casser le legacy.
================================================================ */
(function(){
  'use strict';

  var parentMap = {
    'nv-employe':'employes',
    'nv-proprietaire':'proprietaires',
    'nv-locataire':'locataires',
    'nv-bien':'biens',
    'nv-locative':'locatives',
    'nv-contrat':'contrats',
    'bien-detail':'biens',
    'proprietaire-detail':'proprietaires'
  };

  var pageConfig = {
    dashboard:{name:'Accueil', icon:'dashboard', subtitle:'Vue d’ensemble de votre activité'},
    employes:{name:'Équipe & Employés', icon:'badge', subtitle:'Gérez votre équipe et les accès à la plateforme'},
    proprietaires:{name:'Propriétaires', icon:'person', subtitle:'Gérez les propriétaires, leurs biens et leurs documents'},
    locataires:{name:'Locataires', icon:'groups', subtitle:'Gérez vos locataires et leurs dossiers'},
    biens:{name:'Biens', icon:'home_work', subtitle:'Gérez votre portefeuille de biens immobiliers'},
    locatives:{name:'Locations', icon:'key', subtitle:'Suivez les locations en cours et les affectations'},
    contrats:{name:'Contrats', icon:'description', subtitle:'Gérez les contrats et documents associés'},
    paiements:{name:'Paiements', icon:'payments', subtitle:'Suivez les encaissements et règlements'},
    avenir:{name:'Paiements à venir', icon:'event_upcoming', subtitle:'Anticipez les prochaines échéances'},
    depenses:{name:'Dépenses', icon:'receipt_long', subtitle:'Suivez les charges et sorties financières'},
    fichiers:{name:'Fichiers', icon:'folder', subtitle:'Centralisez vos documents importants'},
    messages:{name:'Messages', icon:'chat', subtitle:'Consultez et envoyez vos communications'},
    'agenda-employes':{name:'Agenda employés', icon:'event', subtitle:'Suivez les missions et rendez-vous de l’équipe'},
    agenda:{name:'Agenda', icon:'calendar_month', subtitle:'Organisez vos rendez-vous et événements'},
    rapports:{name:'Rapports', icon:'bar_chart', subtitle:'Analysez les performances de votre activité'},
    journal:{name:'Journal', icon:'manage_search', subtitle:'Suivez les activités et historiques récents'},
    droits:{name:'Droits d’accès', icon:'admin_panel_settings', subtitle:'Gérez les permissions d’accès de vos employés'},
    parametres:{name:'Paramètres', icon:'settings', subtitle:'Configurez votre plateforme'},
    sync:{name:'Sauvegarde & synchronisation', icon:'cloud_done', subtitle:'Gérez la sauvegarde et la synchronisation'},
    abonnement:{name:'Abonnement', icon:'workspace_premium', subtitle:'Consultez le statut de votre abonnement et de votre licence'},
    'admin-saas':{name:'Administration SaaS', icon:'admin_panel_settings', subtitle:'Gérez les licences et les accès clients'},
    'license-manager':{name:'Gestion des licences', icon:'vpn_key', subtitle:'Créez, suspendez et renouvelez les licences'},
    'license-activation':{name:'Activation licence', icon:'key', subtitle:'Activez la licence de votre agence'},
    'admin-stockage':{name:'Administration stockage', icon:'database', subtitle:'Gérez le stockage et les données'},
    'nv-bien':{name:'Ajouter un bien', icon:'add_home', parent:'biens', sub:'Ajouter un bien'},
    'bien-detail':{name:'Détails du bien', icon:'home_work', parent:'biens', sub:'Détails du bien'},
    'proprietaire-detail':{name:'Détails propriétaire', icon:'person', parent:'proprietaires', sub:'Détails propriétaire'},
    'nv-employe':{name:'Nouvel employé', icon:'person_add', parent:'employes', sub:'Nouvel employé'},
    'nv-proprietaire':{name:'Nouveau propriétaire', icon:'person_add', parent:'proprietaires', sub:'Nouveau propriétaire'},
    'nv-locataire':{name:'Nouveau locataire', icon:'person_add', parent:'locataires', sub:'Nouveau locataire'},
    'nv-locative':{name:'Nouvelle location', icon:'add_business', parent:'locatives', sub:'Nouvelle location'},
    'nv-contrat':{name:'Nouveau contrat', icon:'note_add', parent:'contrats', sub:'Nouveau contrat'}
  };

  var renderers = {
    dashboard: function(){ return call('renderDashboard'); },
    employes: function(){ return typeof window.renderEmployesModern==='function' ? window.renderEmployesModern() : call('renderTable', 'employes'); },
    proprietaires: function(){ return typeof window.renderProprietairesModern==='function' ? window.renderProprietairesModern() : call('renderProprietairesCards'); },
    locataires: function(){ return call('renderLocatairesModern'); },
    biens: function(){ return callAny(['renderBiensFinal','renderBiensCards']); },
    locatives: function(){ return callAny(['renderLocativesFinal','renderLocativesModernAligned','renderLocativesModern','renderLocativesModernV11']) || call('renderTable', 'locatives'); },
    contrats: function(){ return callAny(['renderContratsFinal','renderContratsModern','renderContrats']); },
    paiements: function(){
      // Appelle renderPaiementsFinal en priorité (nouvelle UI), fallback sur renderPaiements
      if(typeof window.renderPaiementsFinal === 'function') return window.renderPaiementsFinal();
      return call('renderPaiements');
    },
    avenir: function(){ return call('renderAvenir'); },
    depenses: function(){
      // Appelle renderDepensesFinal en priorité (nouvelle UI), fallback sur renderDepenses
      if(typeof window.renderDepensesFinal === 'function') return window.renderDepensesFinal();
      return call('renderDepenses');
    },
    fichiers: function(){ return call('renderFichiers'); },
    messages: function(){ return call('renderMessages'); },
    'agenda-employes': function(){ return call('renderEmployeeAgenda'); },
    agenda: function(){ return call('renderAgenda'); },
    rapports: function(){ return call('renderRapports'); },
    journal: function(){ call('renderJournalEmployeGrid'); call('renderMissionDoneInbox'); return call('renderEmployeeAgenda'); },
    droits: function(){ return call('renderDroitsPage'); },
    'nv-bien': function(){ return callAny(['openNouveauBienDrawer','openNouvelBienDrawer','resetBienForm','fillProprioBien']); },
    'bien-detail': function(){ call('renderBienDetailDocuments'); return call('switchBienTab', document.getElementById('bdTab-infos'), 'infos'); },
    'nv-locative': function(){ return call('fillLocativeSelects'); },
    'nv-contrat': function(){ return call('fillContratSelects'); },
    'nv-employe': function(){ return call('resetEmployeForm'); },
    'nv-locataire': function(){ return callAny(['openNouvelLocataireDrawer','resetLocataireForm']); },
    'nv-proprietaire': function(){ return callAny(['openNouvelProprietaireDrawer','openNouveauProprietaireDrawer','resetProprietaireForm']); },
    'proprietaire-detail': function(){ call('renderProprietaireDocuments'); return call('switchProprietaireTab', document.getElementById('pdTab-infos'), 'infos'); },
    parametres: function(){ return call('renderParametres'); },
    sync: function(){ return window.GPSyncPage && window.GPSyncPage.render ? window.GPSyncPage.render() : null; },
    abonnement: function(){ return callModule(['GPClientSubscription'], ['load','render']); },
    'admin-saas': function(){ return callModule(['GPAdminSaaS','GPSimpleLicenseAdmin'], ['load','render']); },
    'license-manager': function(){ return callModule(['GPLicenseManager','GPSimpleLicenseAdmin'], ['load','render']); },
    'license-activation': function(){ return callModule(['GPLicenseActivation'], ['load','render']); },
    'admin-stockage': function(){ return window.GPAdminStockage && window.GPAdminStockage.render ? window.GPAdminStockage.render() : null; }
  };

  function call(name){
    var fn = window[name];
    if(typeof fn !== 'function'){
      console.warn('[GPNavigation] renderer manquant:', name);
      return null;
    }
    return fn.apply(window, Array.prototype.slice.call(arguments,1));
  }

  function callAny(names){
    for(var i=0; i<names.length; i++){
      var fn = window[names[i]];
      if(typeof fn === 'function') return fn.call(window);
    }
    console.warn('[GPNavigation] renderer manquant:', names.join(' / '));
    return null;
  }

  function callModule(moduleNames, methodNames){
    for(var i=0; i<moduleNames.length; i++){
      var mod = window[moduleNames[i]];
      if(!mod) continue;
      for(var j=0; j<methodNames.length; j++){
        var fn = mod[methodNames[j]];
        if(typeof fn === 'function') return fn.call(mod);
      }
    }
    console.warn('[GPNavigation] renderer module manquant:', moduleNames.join(' / '));
    return null;
  }

  function canOpen(page){
    if(window.GPAuth && typeof window.GPAuth.can === 'function') return window.GPAuth.can(page);
    if(typeof window.canAccess !== 'function') return true;
    try{ return window.canAccess(page); }
    catch(e){ return true; }
  }

  function setActivePage(page){
    document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
    var el = document.getElementById('page-'+page);
    if(el) el.classList.add('active');
  }

  function setActiveMenu(page){
    var activePage = parentMap[page] || page;
    document.querySelectorAll('#sideMenu li[data-page]').forEach(function(li){
      li.classList.toggle('active', li.dataset.page === activePage);
    });
  }

  function updateBreadcrumb(page){
    var box = document.getElementById('globalBreadcrumb');
    if(!box) return;
    var cfg = pageConfig[page] || {name:'Page', icon:'home'};
    var parentKey = cfg.parent;
    var parentCfg = parentKey ? pageConfig[parentKey] : null;
    var esc = window.GPRenderers ? window.GPRenderers.esc : function(v){return String(v||'');};
    var subtitleHtml = cfg.subtitle ? '<span class="breadcrumb-subtitle">'+esc(cfg.subtitle)+'</span>' : '';
    if(parentCfg){
      box.innerHTML = '<div class="breadcrumb-box"><span class="material-symbols-rounded">'+esc(parentCfg.icon)+'</span>'+
        '<span class="breadcrumb-link" data-gp-nav="'+esc(parentKey)+'">'+esc(parentCfg.name)+'</span>'+
        '<span class="breadcrumb-sep">›</span><span class="breadcrumb-title-wrap"><span class="breadcrumb-main">'+esc(cfg.sub || cfg.name)+'</span>'+subtitleHtml+'</span></div>';
    }else{
      box.innerHTML = '<div class="breadcrumb-box"><span class="material-symbols-rounded">'+esc(cfg.icon)+'</span><span class="breadcrumb-title-wrap"><span class="breadcrumb-main">'+esc(cfg.name)+'</span>'+subtitleHtml+'</span></div>';
    }
  }

  function renderPage(page){
    var fn = renderers[page];
    if(window.GPRenderers) window.GPRenderers.renderSafely('page:'+page, function(){ if(fn) fn(); });
    else if(fn) fn();
    call('updateSidebarBadges');
  }

  function navigate(page){
    if(!page) page = 'dashboard';
    if(!canOpen(page)){
      if(typeof window.toast === 'function') window.toast("Accès refusé — vous n'avez pas les droits pour cette section", 'err');
      page = 'dashboard';
    }
    setActivePage(page);
    setActiveMenu(page);
    renderPage(page);
    updateBreadcrumb(page);
    call('appliqueDroitsPage', page);
    // GPAuth.refresh() est déclenché par gp:auth-changed, pas à chaque navigation.
    if(page === 'dashboard'){
      call('startDashboardRealtime');
      if(typeof window.refreshDashboardFromSupabase === 'function') window.refreshDashboardFromSupabase({silent:true});
    }
    window.GP_CURRENT_PAGE = page;
    try { localStorage.setItem('gp_last_page', page); } catch(_){}
    document.dispatchEvent(new CustomEvent('gp:navigation', { detail:{ page: page } }));
    return page;
  }

  function registerRenderer(page, fn){
    if(page && typeof fn === 'function') renderers[page] = fn;
  }

  document.addEventListener('click', function(e){
    var target = e.target.closest('[data-gp-nav]');
    if(target){ e.preventDefault(); navigate(target.getAttribute('data-gp-nav')); return; }
    var li = e.target.closest('#sideMenu li[data-page]');
    if(li){ e.preventDefault(); navigate(li.dataset.page); }
  });

  window.GPNavigation = {
    navigate: navigate,
    go: navigate, // alias utilisé par license-guard et super-admin-guard
    renderPage: renderPage,
    updateBreadcrumb: updateBreadcrumb,
    registerRenderer: registerRenderer,
    pageConfig: pageConfig,
    renderers: renderers
  };

  window.navigate = navigate;
  window.renderPage = renderPage;
  window.updateGlobalBreadcrumb = updateBreadcrumb;
})();
