/* Genius Property — correctifs : suppression en cascade d'une location, page Locataires retirée,
   autocomplétion des champs de recherche. À charger EN DERNIER dans app.html. */
(function () {
  'use strict';

  function db() { try { return (window.GPDB && GPDB.load) ? GPDB.load() : (window.DB || {}); } catch (_) { return window.DB || {}; } }
  function norm(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function notify(m, t) { if (typeof window.toast === 'function') window.toast(m, t || ''); }

  /* ───────── 1. Location ⇄ contrats ───────── */

  // Contrats rattachés à UNE location : lien par id, puis (si le lien est absent ou périmé)
  // par unité + locataire, puis par nom.
  function contractsOfLocation(d, loc) {
    var lid = String(loc.id || ''), ln = norm(loc.nom), lb = norm(loc.bien), lt = norm(loc.locataire || loc.occupant);
    var locIds = {}; (d.locatives || []).forEach(function (l) { locIds[String(l.id)] = 1; });
    var lu = String(loc.uniteId || loc.unitId || ''), ltid = String(loc.locataireId || loc.tenantId || '');
    return (d.contrats || []).filter(function (c) {
      var cid = String(c.locationId || c.locativeId || c.idLocation || '');
      if (cid && lid && cid === lid) return true;
      if (cid && locIds[cid]) return false;            // appartient à une AUTRE location existante
      var cu = String(c.uniteId || c.unitId || ''), ctid = String(c.locataireId || c.tenantId || '');
      if (cu && lu && cu === lu && (!ctid || !ltid || ctid === ltid)) return true;
      var cl = norm(c.locative || c.location || '');
      if (!cl || (cl !== ln && cl !== lb)) return false;
      var ct = norm(c.locataire);
      return !lt || !ct || lt === ct;
    });
  }

  // Un contrat est « orphelin » quand plus aucune location ne le référence.
  function isOrphan(d, c) {
    var cid = String(c.locationId || c.locativeId || c.idLocation || '');
    var locs = d.locatives || [];
    if (cid && locs.some(function (l) { return String(l.id) === cid; })) return false;
    return !locs.some(function (l) { return contractsOfLocation(d, l).indexOf(c) >= 0; });
  }
  function orphanContracts(d) { return (d.contrats || []).filter(function (c) { return isOrphan(d, c); }); }

  function paymentsOfContracts(d, contracts) {
    if (!contracts.length) return 0;
    var ids = {}; contracts.forEach(function (c) { [c.id, c.num].forEach(function (v) { if (v) ids[String(v)] = 1; }); });
    return (d.paiements || []).filter(function (p) {
      return [p.contratId, p.contractId, p.contrat].some(function (v) { return v && ids[String(v)]; });
    }).length;
  }

  async function persist(d) {
    try { if (window.GPRelationsV52 && GPRelationsV52.ensure) GPRelationsV52.ensure(d); } catch (e) { console.warn('[cascade] ensure', e); }
    var ok = true;
    if (window.GPDB && GPDB.save) ok = await GPDB.save(d);
    else { window.DB = d; if (typeof window.saveDB === 'function') ok = await window.saveDB(); }
    return ok !== false;
  }

  function rerender() {
    ['renderLocativesFinal', 'renderLocativesModern', 'renderBiensFinal', 'renderBiensCards', 'renderPaiementsFinal', 'renderAvenir', 'renderContratsFinal', 'renderDashboard']
      .forEach(function (n) { try { if (typeof window[n] === 'function') window[n](); } catch (_) {} });
    try { if (typeof window.updateSidebarBadges === 'function') window.updateSidebarBadges(); } catch (_) {}
  }

  async function deleteLocation(idx) {
    var d = db(), loc = (d.locatives || [])[Number(idx)];
    if (!loc) return false;
    var cs = contractsOfLocation(d, loc);
    var pays = paymentsOfContracts(d, cs);
    var msg = 'Supprimer « ' + (loc.nom || loc.bien || 'cette location') + ' » ?';
    if (cs.length) msg += '\n\n' + cs.length + ' contrat(s) lié(s) seront aussi supprimés : le locataire disparaîtra des Encaissements et le bien redeviendra disponible.';
    if (pays) msg += '\n' + pays + ' paiement(s) déjà enregistré(s) restent conservés dans l’historique.';
    if (!window.confirm(msg)) return false;
    d.contrats = (d.contrats || []).filter(function (c) { return cs.indexOf(c) < 0; });
    d.locatives = d.locatives.filter(function (l) { return l !== loc; });
    try { if (typeof window.GPResyncBienStatuses === 'function') window.GPResyncBienStatuses(d); } catch (_) {}
    if (!(await persist(d))) { notify('Suppression non enregistrée. Rechargez puis réessayez.', 'err'); return false; }
    rerender();
    notify('Location supprimée ✓', 'ok');
    return true;
  }

  // On intercepte UNIQUEMENT la clé « locatives » ; le reste passe par l'ancien code.
  var prevDel = window.delRow;
  window.delRow = async function (key, idx) {
    if (key === 'locatives') return deleteLocation(idx);
    return typeof prevDel === 'function' ? prevDel.apply(this, arguments) : false;
  };
  window.delRow.__liveFix = true; // runtime.js ne doit pas remplacer ce wrapper
  var prevModal = window.deleteFromModal;
  window.deleteFromModal = async function () {
    if (window._modalKey === 'locatives') {
      var idx = window._modalIdx;
      try { if (typeof window.closeRowModal === 'function') window.closeRowModal(); } catch (_) {}
      return deleteLocation(idx);
    }
    return typeof prevModal === 'function' ? prevModal.apply(this, arguments) : undefined;
  };

  window.deleteFromModal.__liveFix = true;

  window.GPCascade = {
    orphanContracts: orphanContracts,
    contractsOfLocation: contractsOfLocation,
    // Supprime les contrats orphelins donnés (après confirmation faite par l'appelant).
    removeContracts: async function (list) {
      var d = db(), ids = {};
      list.forEach(function (c) { ids[String(c.id)] = 1; });
      d.contrats = (d.contrats || []).filter(function (c) { return !ids[String(c.id)]; });
      var ok = await persist(d);
      if (ok) rerender();
      return ok;
    }
  };

  /* ───────── 2. Page « Locataires » : plus accessible ───────── */
  function redirectTenants(fn) {
    return function (page) {
      /* Exception : le bouton « Locataires » de la page Locations pose ce drapeau pour ouvrir la vraie page. */
      if (page === 'locataires' && window.__gpAllowTenantsPage) return fn.apply(this, arguments);
      if (page === 'locataires' || page === 'nv-locataire') arguments[0] = 'locatives';
      return fn.apply(this, arguments);
    };
  }
  if (typeof window.navigate === 'function') window.navigate = redirectTenants(window.navigate);
  if (window.GPNavigation && typeof GPNavigation.navigate === 'function') GPNavigation.navigate = redirectTenants(GPNavigation.navigate);
  if (typeof window.gpDashboardGo === 'function') window.gpDashboardGo = redirectTenants(window.gpDashboardGo);

  /* ───────── 3. Champs de recherche : pas d'e-mail pré-rempli ───────── */
  function isSearch(el) {
    if (!el || el.tagName !== 'INPUT') return false;
    var t = (el.getAttribute('type') || 'text').toLowerCase();
    if (t === 'password' || t === 'email' || t === 'checkbox' || t === 'radio' || t === 'file') return false;
    if (t === 'search') return true;
    return /search|recherch/i.test((el.id || '') + ' ' + (el.className || '') + ' ' + (el.getAttribute('placeholder') || ''));
  }
  function guard(el) {
    if (el.__gpNoFill) return;
    el.__gpNoFill = true;
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('data-lpignore', 'true');
    el.setAttribute('data-form-type', 'other');
    if (!el.name) el.name = 'gp_q_' + (el.id || Math.random().toString(36).slice(2, 8));
    el.addEventListener('input', function (e) { if (e.isTrusted) el.__gpTyped = true; }, true);
    var mail = String((window.currentUser && window.currentUser.email) || '').toLowerCase();
    // Valeur injectée par le navigateur (e-mail) sans saisie de l'utilisateur : on la retire.
    [0, 300, 1200].forEach(function (ms) {
      setTimeout(function () {
        var v = String(el.value || '').trim().toLowerCase();
        if (!el.__gpTyped && v && (v === mail || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))) el.value = '';
      }, ms);
    });
  }
  function scan(root) {
    (root || document).querySelectorAll('input').forEach(function (el) { if (isSearch(el)) guard(el); });
  }
  function init() {
    scan(document);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.tagName === 'INPUT') { if (isSearch(n)) guard(n); } else if (n.querySelectorAll) scan(n);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();
