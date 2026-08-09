/* Correctif stable — bouton À venir sur la page Paiements
   Objectif: clic fiable vers page-avenir + icône visible + style rouge, sans boucle. */
(function(){
  'use strict';

  var CSS_ID = 'gp-avenir-button-final-safe-css';
  var decorateTimer = null;

  function injectStyle(){
    if(document.getElementById(CSS_ID)) return;
    var css = ''+
      '.gp-avenir-red-cta,[data-gp-avenir-cta="1"]{'+
        'background:linear-gradient(135deg,#fff 0%,#fff 45%,#fff1f2 100%)!important;'+
        'color:#111827!important;'+
        'border:1px solid #fecdd3!important;'+
        'box-shadow:0 10px 24px rgba(220,38,38,.12)!important;'+
        'font-weight:900!important;cursor:pointer!important;'+
        'display:inline-flex!important;align-items:center!important;justify-content:center!important;'+
        'gap:8px!important;white-space:nowrap!important;min-height:42px!important;'+
      '}'+
      '.gp-avenir-red-cta:hover,[data-gp-avenir-cta="1"]:hover{background:linear-gradient(135deg,#fee2e2,#fecaca)!important;border-color:#f87171!important;color:#991b1b!important;transform:translateY(-1px)}'+
      '.gp-avenir-red-cta svg,[data-gp-avenir-cta="1"] svg{width:17px!important;height:17px!important;flex:0 0 auto!important;display:inline-block!important;stroke:currentColor!important}'+
      '.gp-avenir-red-cta .material-symbols-rounded,[data-gp-avenir-cta="1"] .material-symbols-rounded{display:none!important}';
    var s = document.createElement('style');
    s.id = CSS_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function iconSvg(){
    return '<svg class="gp-avenir-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">'+
      '<path d="M7 3v3M17 3v3M4 9h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'+
      '<path d="M5 5.5h14a1 1 0 0 1 1 1V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="2"/>'+
      '<path d="M9 15h6M13 12l3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'+
    '</svg>';
  }

  function isAvenirButton(node){
    if(!node || !node.matches) return false;
    if(node.getAttribute('data-gp-avenir-cta') === '1') return true;
    var txt = (node.textContent || '').replace(/\s+/g,' ').trim().toLowerCase();
    var title = (node.getAttribute('title') || '').toLowerCase();
    return txt.indexOf('à venir') !== -1 || txt.indexOf('a venir') !== -1 || title.indexOf('paiements à venir') !== -1;
  }

  function closestAvenirButton(el){
    if(!el || !el.closest) return null;
    var btn = el.closest('button, a, [role="button"]');
    return isAvenirButton(btn) ? btn : null;
  }

  function forceOpenAvenir(){
    var page = 'avenir';

    // Navigation officielle d'abord
    try{
      if(window.GPNavigation && typeof window.GPNavigation.navigate === 'function'){
        window.GPNavigation.navigate(page);
      }else if(typeof window.navigate === 'function'){
        window.navigate(page);
      }
    }catch(e){ console.warn('[Avenir] navigation standard échouée', e); }

    // Sécurité: affiche directement la page même si un wrapper bloque la navigation.
    setTimeout(function(){
      try{
        document.querySelectorAll('.page').forEach(function(p){
          p.classList.remove('active');
          p.style.display = '';
        });
        var el = document.getElementById('page-avenir');
        if(el){
          el.classList.add('active');
          el.style.display = '';
        }
        document.querySelectorAll('#sideMenu li[data-page]').forEach(function(li){
          li.classList.toggle('active', li.dataset.page === 'avenir');
        });
        window.GP_CURRENT_PAGE = 'avenir';
        try{ localStorage.setItem('gp_last_page','avenir'); }catch(_){ }
        if(typeof window.renderAvenir === 'function') window.renderAvenir();
        if(typeof window.updateGlobalBreadcrumb === 'function') window.updateGlobalBreadcrumb('avenir');
        document.dispatchEvent(new CustomEvent('gp:navigation', {detail:{page:'avenir'}}));
      }catch(err){ console.error('[Avenir] ouverture forcée échouée', err); }
    }, 0);

    return false;
  }

  window.gpOpenAvenirFromPaiements = function(ev){
    if(ev){
      ev.preventDefault();
      ev.stopPropagation();
    }
    return forceOpenAvenir();
  };
  window.gpGoToAvenir = window.gpOpenAvenirFromPaiements;

  function decorateOne(btn){
    if(!btn) return;
    injectStyle();
    if(btn.tagName === 'BUTTON') btn.setAttribute('type','button');
    btn.setAttribute('data-gp-avenir-cta','1');
    btn.classList.add('gp-avenir-red-cta');
    btn.setAttribute('title','Paiements à venir');
    btn.setAttribute('onclick','return window.gpOpenAvenirFromPaiements(event)');
    if(!btn.querySelector('svg.gp-avenir-icon')) btn.insertAdjacentHTML('afterbegin', iconSvg());
  }

  function decorateButtons(){
    injectStyle();
    document.querySelectorAll('button, a, [role="button"]').forEach(function(node){
      if(isAvenirButton(node)) decorateOne(node);
    });
  }

  document.addEventListener('click', function(e){
    var btn = closestAvenirButton(e.target);
    if(!btn) return;
    window.gpOpenAvenirFromPaiements(e);
  }, true);

  function scheduleDecorate(){
    if(decorateTimer) return;
    decorateTimer = setTimeout(function(){ decorateTimer = null; decorateButtons(); }, 150);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorateButtons);
  else decorateButtons();
  window.addEventListener('load', decorateButtons);
  document.addEventListener('gp:navigation', decorateButtons);
  try{ new MutationObserver(scheduleDecorate).observe(document.documentElement, {childList:true, subtree:true}); }catch(_){ }
})();
