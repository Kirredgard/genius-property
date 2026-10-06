/* Échéances de contrats — mode semi-automatique.
   1) Un contrat « Actif » dont la date de fin est dépassée passe en « À clôturer »
      (aucun autre effet : le bien reste « Loué », rien n'est supprimé).
   2) Une alerte (cloche + bandeau sur la page Contrats) liste ces contrats.
   3) L'utilisateur choisit pour chacun :
        - Clôturer  : contrat « Terminé », locative / unité « Disponible », locataire retiré.
        - Reconduire : nouvelle date de fin, le contrat redevient « Actif ».
   Aucune action destructive sans confirmation. */
(function () {
  'use strict';
  if (window.GPEcheances) return;

  var TO_CLOSE = 'À clôturer';
  var ACTIVE_SET = ['actif', 'en attente', ''];

  /* ---------- utilitaires ---------- */
  function clean(v) { return String(v == null ? '' : v).trim(); }
  function norm(v) {
    var s = clean(v).toLowerCase();
    return s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s;
  }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function startOfToday() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function iso(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0'), j = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + j;
  }
  function parseDate(v) {
    var s = clean(v);
    if (!s || s === '-' || s === '—') return null;
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    var d = new Date(s);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function fmt(v) {
    var d = parseDate(v);
    if (!d) return clean(v) || '—';
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }
  function loadDb() {
    try { if (window.GPDB && GPDB.load) return GPDB.load() || {}; } catch (e) {}
    return window.DB || {};
  }
  function keyOf(c, i) { return clean(c.id || c.num) || ('idx' + i); }
  function toast(msg, type) { try { if (typeof window.toast === 'function') window.toast(msg, type || 'ok'); } catch (e) {} }

  /* ---------- liens contrat / locative / unité ---------- */
  function sameRef(a, b) {
    var ida = clean(a.locationId || a.locativeId), idb = clean(b.locationId || b.locativeId);
    if (ida && idb) return ida === idb;
    var na = norm(a.locative), nb = norm(b.locative);
    return !!na && na === nb;
  }
  function findLocative(d, c) {
    var list = Array.isArray(d.locatives) ? d.locatives : [];
    var id = clean(c.locationId || c.locativeId);
    var l = id && list.find(function (x) { return clean(x.id) === id; });
    if (l) return l;
    var n = norm(c.locative);
    if (!n) return null;
    return list.find(function (x) { return norm(x.nom) === n || norm(x.bien) === n; }) || null;
  }
  function hasOtherActive(d, c) {
    return (d.contrats || []).some(function (o) {
      return o !== c && ACTIVE_SET.indexOf(norm(o.statut)) > -1 && sameRef(o, c);
    });
  }
  function freeUnitOrBien(d, c, loc) {
    var labels = [norm(c.locative)];
    if (loc) { labels.push(norm(loc.bien)); labels.push(norm(loc.nom)); }
    labels = labels.filter(Boolean);
    (d.biens || []).forEach(function (b) {
      var units = Array.isArray(b.unites) ? b.unites : [];
      if (units.length) {
        units.forEach(function (u) {
          var label = norm((b.nom || 'Bien') + (u.nom ? ' - ' + u.nom : ''));
          var byId = loc && clean(loc.uniteId || loc.unitId) && clean(loc.uniteId || loc.unitId) === clean(u.id);
          if (byId || labels.indexOf(label) > -1) { u.statut = 'Disponible'; u.locataire = ''; }
        });
      } else if (labels.indexOf(norm(b.nom)) > -1) {
        b.statut = 'Disponible';
      }
    });
  }

  /* ---------- lecture / détection ---------- */
  function isOverdue(c, today) {
    if (ACTIVE_SET.indexOf(norm(c.statut)) < 0 || norm(c.statut) === 'en attente') return false;
    var end = parseDate(c.fin || c.dateFin);
    return !!end && end < today;
  }
  function pending(d) {
    d = d || loadDb();
    return (d.contrats || []).map(function (c, i) { return { c: c, i: i }; })
      .filter(function (x) { return norm(x.c.statut) === norm(TO_CLOSE); })
      .map(function (x) { return { key: keyOf(x.c, x.i), contrat: x.c }; });
  }
  function scan() {
    var today = startOfToday();
    var d0 = loadDb();
    var need = (d0.contrats || []).some(function (c) { return isOverdue(c, today); });
    if (!need) return 0;
    var n = 0;
    try {
      GPDB.update(function (d) {
        (d.contrats || []).forEach(function (c) {
          if (isOverdue(c, today)) {
            c.statut = TO_CLOSE;
            c.aClotureDepuis = iso(today);
            n++;
          }
        });
      });
    } catch (e) { console.warn('[GPEcheances] sauvegarde impossible', e); return 0; }
    if (n) refreshUI();
    return n;
  }

  /* ---------- actions ---------- */
  function findByKey(d, key) {
    var list = d.contrats || [];
    for (var i = 0; i < list.length; i++) if (keyOf(list[i], i) === key) return list[i];
    return null;
  }
  function closeContract(key, departDate) {
    var result = { ok: false, freed: false, kept: false };
    GPDB.update(function (d) {
      var c = findByKey(d, key);
      if (!c) return;
      c.statut = 'Terminé';
      c.dateSortie = departDate || iso(startOfToday());
      c.clotureLe = new Date().toISOString();
      var loc = findLocative(d, c);
      if (hasOtherActive(d, c)) {
        /* Un autre contrat actif existe déjà sur ce logement (ex. nouvel occupant déjà saisi) :
           on ne libère rien pour ne pas écraser son statut. */
        result.kept = true;
      } else {
        if (loc) {
          loc.statut = 'Disponible';
          loc.locataire = '';
          loc.occupant = '';
          loc.tel = loc.tel && loc.locataire === '' ? '' : loc.tel;
        }
        freeUnitOrBien(d, c, loc);
        var holder = clean(c.locataire);
        (d.locataires || []).forEach(function (t) {
          var full = clean([t.prenom, t.nom].filter(Boolean).join(' '));
          if (holder && (norm(full) === norm(holder) || norm(t.nom) === norm(holder))) {
            if (!t.bien || norm(t.bien) === norm(c.locative) || (loc && (norm(t.bien) === norm(loc.bien) || norm(t.bien) === norm(loc.nom)))) t.bien = '';
          }
        });
        result.freed = true;
      }
      result.ok = true;
      result.label = c.locative; result.who = c.locataire;
    });
    try { if (typeof window.auditLog === 'function') window.auditLog('Clôture', 'Contrats', 'Contrat clôturé : ' + (result.who || '') + ' · ' + (result.label || '')); } catch (e) {}
    return result;
  }
  function renewContract(key, newEnd) {
    var result = { ok: false };
    GPDB.update(function (d) {
      var c = findByKey(d, key);
      if (!c) return;
      c.reconductions = Array.isArray(c.reconductions) ? c.reconductions : [];
      c.reconductions.push({ le: new Date().toISOString(), ancienneFin: c.fin || '', nouvelleFin: newEnd });
      c.fin = newEnd;
      c.statut = 'Actif';
      delete c.aClotureDepuis;
      result.ok = true; result.who = c.locataire; result.label = c.locative;
    });
    try { if (typeof window.auditLog === 'function') window.auditLog('Reconduction', 'Contrats', 'Contrat reconduit jusqu\'au ' + newEnd + ' : ' + (result.who || '')); } catch (e) {}
    return result;
  }

  /* ---------- interface ---------- */
  function injectCss() {
    if (document.getElementById('gp-ech-css')) return;
    var s = document.createElement('style');
    s.id = 'gp-ech-css';
    s.textContent =
      '.gp-ech-banner{margin:8px 24px 12px;background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:12px 14px;font-family:inherit}' +
      '.gp-ech-head{display:flex;align-items:center;gap:8px;font-weight:800;color:#92400e;font-size:14px;margin-bottom:8px}' +
      '.gp-ech-sub{font-weight:500;color:#a16207;font-size:12px;margin:-4px 0 8px 0}' +
      '.gp-ech-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:1px solid #fde68a;border-radius:10px;padding:8px 10px;margin-top:6px}' +
      '.gp-ech-info{flex:1;min-width:180px;font-size:13px;color:#1f2937}.gp-ech-info small{display:block;color:#6b7280;font-size:11.5px;margin-top:2px}' +
      '.gp-ech-btn{border:0;border-radius:8px;padding:7px 12px;font-size:12.5px;font-weight:700;cursor:pointer}' +
      '.gp-ech-btn.close{background:#111827;color:#fff}.gp-ech-btn.renew{background:#fff;color:#111827;border:1px solid #d1d5db}' +
      '.gp-ech-ov{position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px}' +
      '.gp-ech-modal{background:#fff;border-radius:14px;max-width:420px;width:100%;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,.25);font-family:inherit}' +
      '.gp-ech-modal h3{margin:0 0 8px;font-size:16px;color:#111827}.gp-ech-modal p{margin:0 0 10px;font-size:13px;color:#4b5563;line-height:1.45}' +
      '.gp-ech-modal label{display:block;font-size:12px;font-weight:700;color:#374151;margin:10px 0 4px}' +
      '.gp-ech-modal input{width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:8px;padding:9px 10px;font-size:14px}' +
      '.gp-ech-err{color:#b91c1c;font-size:12px;margin-top:6px;min-height:14px}' +
      '.gp-ech-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}';
    document.head.appendChild(s);
  }
  function modal(title, bodyHtml, confirmLabel, onConfirm) {
    injectCss();
    var ov = document.createElement('div');
    ov.className = 'gp-ech-ov';
    ov.innerHTML = '<div class="gp-ech-modal" role="dialog" aria-modal="true"><h3>' + esc(title) + '</h3>' + bodyHtml +
      '<div class="gp-ech-err"></div><div class="gp-ech-actions"><button class="gp-ech-btn renew" data-a="cancel">Annuler</button>' +
      '<button class="gp-ech-btn close" data-a="ok">' + esc(confirmLabel) + '</button></div></div>';
    document.body.appendChild(ov);
    function shut() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    ov.addEventListener('click', function (e) {
      if (e.target === ov) return shut();
      var a = e.target && e.target.getAttribute && e.target.getAttribute('data-a');
      if (a === 'cancel') shut();
      if (a === 'ok') {
        var err = onConfirm(ov);
        if (err) ov.querySelector('.gp-ech-err').textContent = err; else shut();
      }
    });
    return ov;
  }
  function askClose(key) {
    var item = pending().filter(function (p) { return p.key === key; })[0];
    if (!item) return;
    var c = item.contrat;
    modal('Clôturer le contrat',
      '<p><b>' + esc(c.locataire || 'Locataire') + '</b> · ' + esc(c.locative || '') + '<br>Fin prévue : ' + esc(fmt(c.fin)) + '</p>' +
      '<p>Le contrat passera en « Terminé » et le logement en « Disponible » (le locataire sera retiré de la location). L\'historique et les paiements sont conservés.</p>' +
      '<label>Date de départ effective</label><input type="date" id="gp-ech-depart" value="' + iso(startOfToday()) + '">',
      'Clôturer',
      function (ov) {
        var v = ov.querySelector('#gp-ech-depart').value;
        if (!v) return 'Indique la date de départ.';
        var r = closeContract(key, v);
        if (!r.ok) return 'Contrat introuvable.';
        toast(r.kept ? 'Contrat clôturé (un autre contrat actif existe sur ce logement, statut conservé)' : 'Contrat clôturé · logement disponible ✓');
        refreshUI();
        return '';
      });
  }
  function askRenew(key) {
    var item = pending().filter(function (p) { return p.key === key; })[0];
    if (!item) return;
    var c = item.contrat, base = parseDate(c.fin) || startOfToday();
    var next = new Date(base.getFullYear() + 1, base.getMonth(), base.getDate());
    if (next <= startOfToday()) next = new Date(startOfToday().getFullYear() + 1, startOfToday().getMonth(), startOfToday().getDate());
    modal('Reconduire le contrat',
      '<p><b>' + esc(c.locataire || 'Locataire') + '</b> · ' + esc(c.locative || '') + '<br>Fin actuelle : ' + esc(fmt(c.fin)) + '</p>' +
      '<label>Nouvelle date de fin</label><input type="date" id="gp-ech-newend" value="' + iso(next) + '">',
      'Reconduire',
      function (ov) {
        var v = ov.querySelector('#gp-ech-newend').value;
        var d = parseDate(v);
        if (!d) return 'Date invalide.';
        if (d <= startOfToday()) return 'La nouvelle date de fin doit être dans le futur.';
        var r = renewContract(key, v);
        if (!r.ok) return 'Contrat introuvable.';
        toast('Contrat reconduit jusqu\'au ' + fmt(v) + ' ✓');
        refreshUI();
        return '';
      });
  }

  function bannerHtml(list) {
    var rows = list.map(function (p) {
      var c = p.contrat;
      return '<div class="gp-ech-row"><div class="gp-ech-info"><b>' + esc(c.locataire || '—') + '</b> · ' + esc(c.locative || '—') +
        '<small>Fin prévue : ' + esc(fmt(c.fin)) + '</small></div>' +
        '<button class="gp-ech-btn close" data-gp-ech="close" data-key="' + esc(p.key) + '">Clôturer</button>' +
        '<button class="gp-ech-btn renew" data-gp-ech="renew" data-key="' + esc(p.key) + '">Reconduire</button></div>';
    }).join('');
    return '<div class="gp-ech-head"><span class="material-symbols-rounded" style="font-size:20px">event_busy</span>' +
      list.length + ' contrat' + (list.length > 1 ? 's' : '') + ' arrivé' + (list.length > 1 ? 's' : '') + ' à échéance</div>' +
      '<div class="gp-ech-sub">Le logement reste « Loué » tant que tu n\'as pas choisi.</div>' + rows;
  }
  var inserting = false;
  function renderBanner() {
    var page = document.getElementById('page-contrats');
    if (!page) return;
    var list = pending();
    var old = page.querySelector('.gp-ech-banner');
    if (!list.length) { if (old) old.remove(); return; }
    injectCss();
    inserting = true;
    try {
      if (!old) {
        old = document.createElement('div');
        old.className = 'gp-ech-banner';
        page.insertBefore(old, page.firstChild);
      }
      old.innerHTML = bannerHtml(list);
    } finally { inserting = false; }
  }
  function refreshUI() {
    try { renderBanner(); } catch (e) {}
    try { if (typeof window.renderPage === 'function' && document.getElementById('page-contrats') && document.getElementById('page-contrats').classList.contains('active')) window.renderPage('contrats'); } catch (e) {}
    try { if (typeof window.renderLocativesFinal === 'function') window.renderLocativesFinal(); } catch (e) {}
    try { if (typeof window.renderBiensFinal === 'function') window.renderBiensFinal(); } catch (e) {}
    try { if (typeof window.renderDashboard === 'function') window.renderDashboard(); } catch (e) {}
    try { if (typeof window.renderNotifPanel === 'function') window.renderNotifPanel(); } catch (e) {}
    try { renderBanner(); } catch (e) {}
  }

  var booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest && e.target.closest('[data-gp-ech]');
      if (!t) return;
      var key = t.getAttribute('data-key');
      if (t.getAttribute('data-gp-ech') === 'close') askClose(key); else askRenew(key);
    });
    var page = document.getElementById('page-contrats');
    if (page && window.MutationObserver) {
      new MutationObserver(function () {
        if (inserting) return;
        if (!page.querySelector('.gp-ech-banner') && pending().length) renderBanner();
      }).observe(page, { childList: true });
    }
    [1500, 6000].forEach(function (ms) { setTimeout(scan, ms); });
    setInterval(scan, 30 * 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) scan(); });
  }

  window.GPEcheances = { scan: scan, pending: pending, closeContract: closeContract, renewContract: renewContract, TO_CLOSE: TO_CLOSE };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
