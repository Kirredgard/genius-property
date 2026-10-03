/* Genius Property — conserve le curseur dans les champs de recherche.
   Plusieurs pages (Locations, Contrats, Biens, Locataires, Dépenses…) redessinent toute la page à
   chaque lettre tapée : le champ est remplacé par un nouveau et perd le focus (il fallait recliquer
   à chaque lettre). Ce correctif retrouve le nouveau champ après le rendu et y remet le curseur. */
(function () {
  'use strict';
  if (window.__gpSearchFocusFix) return; window.__gpSearchFocusFix = true;
  var TYPES = ['', 'text', 'search', 'tel', 'email', 'url'];
  var rec = null, timer = null, mo = null;

  function keyOf(el) {
    var pg = el.closest ? el.closest('[id^="page-"]') : null;
    return { id: el.id || '', ph: el.getAttribute('placeholder') || '', page: pg ? pg.id : '' };
  }
  function find(k) {
    if (k.id) { var byId = document.getElementById(k.id); if (byId) return byId; }
    if (!k.ph) return null;
    var scope = k.page ? document.getElementById(k.page) : document;
    if (!scope) return null;
    var list = scope.querySelectorAll('input,textarea');
    for (var i = 0; i < list.length; i++) if ((list[i].getAttribute('placeholder') || '') === k.ph) return list[i];
    return null;
  }
  function restore() {
    if (!rec || !rec.el || document.body.contains(rec.el)) return;   // champ toujours là : rien à faire
    var n = find(rec.key); if (!n) return;
    try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); }
    try { n.setSelectionRange(rec.start, rec.end); } catch (e) {}
    rec.el = n;
  }
  function stop() { rec = null; if (mo) { mo.disconnect(); mo = null; } }

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t || !/^(INPUT|TEXTAREA)$/.test(t.tagName)) return;
    if (TYPES.indexOf(String(t.type || '').toLowerCase()) < 0) return;
    rec = { el: t, key: keyOf(t), start: t.selectionStart, end: t.selectionEnd };
    setTimeout(restore, 0);
    clearTimeout(timer); timer = setTimeout(stop, 1500);
    if (!mo && document.body) {
      mo = new MutationObserver(function () { Promise.resolve().then(restore); });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }, true);
})();
