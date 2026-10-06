/* Genius Property — Raccourci « Locataires » dans la page Locations
 * L'entrée « Locataires » a été retirée du menu latéral. Ce module :
 *  1) ajoute un petit bouton discret dans la barre d'outils de la page Locations ;
 *  2) garde « Locations » surlignée dans le menu quand on est sur la page Locataires.
 * Non destructif : si la barre d'outils est introuvable, il ne fait rien. */
(function () {
  'use strict';
  if (window.__gpLocatairesShortcut) return;
  window.__gpLocatairesShortcut = true;

  function goLocataires() {
    /* gp-cascade-fix.js redirige « locataires » vers Locations ; ce drapeau autorise l'ouverture voulue. */
    window.__gpAllowTenantsPage = true;
    try {
      if (typeof window.navigate === 'function') return window.navigate('locataires');
      if (window.GPNavigation && typeof window.GPNavigation.navigate === 'function') return window.GPNavigation.navigate('locataires');
    } finally { window.__gpAllowTenantsPage = false; }
  }

  function injectStyle() {
    if (document.getElementById('gpGoLocatairesCss')) return;
    var st = document.createElement('style'); st.id = 'gpGoLocatairesCss';
    st.textContent = '#gpGoLocataires{position:relative}' +
      '#gpGoLocataires:hover::after,#gpGoLocataires:focus-visible::after{content:attr(data-tip);position:absolute;top:calc(100% + 8px);right:0;z-index:60;width:max-content;max-width:250px;white-space:normal;text-align:left;background:#111827;color:#fff;font-size:11px;font-weight:600;line-height:1.4;padding:7px 10px;border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.2);pointer-events:none}';
    document.head.appendChild(st);
  }

  function injectButton() {
    var page = document.getElementById('page-locatives');
    if (!page || document.getElementById('gpGoLocataires')) return;
    injectStyle();
    var bar = page.querySelector('.gp-toolbar');
    if (!bar) return;
    var btn = document.createElement('button');
    btn.id = 'gpGoLocataires';
    btn.type = 'button';
    btn.className = 'gp-outline';
    btn.setAttribute('data-tip', 'Ouvrir la page Locataires : la liste et les fiches de tous vos locataires');
    btn.setAttribute('aria-label', 'Ouvrir la page Locataires : liste et fiches de tous vos locataires');
    btn.style.cssText = 'color:#6b7280;font-weight:600';
    btn.innerHTML = '<span class="material-symbols-rounded" style="font-size:14px">groups</span>Locataires';
    btn.addEventListener('click', function (e) { e.preventDefault(); goLocataires(); });
    var group = bar.querySelector('div[style*="margin-left:auto"]') || bar.querySelector('div:last-child');
    if (group && group.parentNode === bar) group.insertBefore(btn, group.firstChild);
    else bar.appendChild(btn);
  }

  function syncMenu() {
    var pg = document.getElementById('page-locataires');
    if (!pg || !pg.classList.contains('active')) return;
    var li = document.querySelector('#sideMenu li[data-page="locatives"]');
    if (li && !li.classList.contains('active')) li.classList.add('active');
  }

  function run() { try { injectButton(); syncMenu(); } catch (_) {} }

  function start() {
    run();
    var obs = new MutationObserver(run);
    var loc = document.getElementById('page-locatives'), lct = document.getElementById('page-locataires'), menu = document.getElementById('sideMenu');
    if (loc) obs.observe(loc, { childList: true, subtree: true });   // la page Locations est redessinée
    if (lct) obs.observe(lct, { attributes: true, attributeFilter: ['class'] });   // page Locataires affichée / masquée
    if (menu) obs.observe(menu, { attributes: true, attributeFilter: ['class'], subtree: true });   // un autre script change le surlignage
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
