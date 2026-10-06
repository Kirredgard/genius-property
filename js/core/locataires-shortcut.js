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
    if (typeof window.navigate === 'function') return window.navigate('locataires');
    if (window.GPNavigation && typeof window.GPNavigation.navigate === 'function') return window.GPNavigation.navigate('locataires');
  }

  function injectButton() {
    var page = document.getElementById('page-locatives');
    if (!page || document.getElementById('gpGoLocataires')) return;
    var bar = page.querySelector('.gp-toolbar');
    if (!bar) return;
    var btn = document.createElement('button');
    btn.id = 'gpGoLocataires';
    btn.type = 'button';
    btn.className = 'gp-outline';
    btn.title = 'Ouvrir la liste des locataires';
    btn.setAttribute('aria-label', 'Ouvrir la liste des locataires');
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
