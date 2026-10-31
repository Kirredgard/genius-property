/* Genius Property — Détection et nettoyage des doublons (outil de diagnostic, rien n'est supprimé sans demande).
 *   GPDedup.scan()            → { collection: [ {garder, doublons:[ids]} ] }  (lecture seule)
 *   GPDedup.clean(['depenses'])→ supprime les doublons EXACTS (même contenu, ids différents) après copie de sécurité
 * Un doublon = mêmes champs que l'original, hors id / dates techniques. Les lignes à contenu différent ne sont jamais touchées.
 */
(function () {
  'use strict';
  if (window.GPDedup) return;
  const COLS = ['proprietaires', 'biens', 'locataires', 'locatives', 'contrats', 'paiements', 'depenses', 'employes', 'agenda'];
  const IGNORE = { id: 1, createdAt: 1, updatedAt: 1, created: 1, updated: 1, ts: 1, timestamp: 1 };
  const db = () => (window.GPDB && GPDB.load ? GPDB.load() : (window.DB || {}));
  function sig(r) {
    const o = {}; Object.keys(r || {}).sort().forEach(k => { if (!IGNORE[k] && !/^__/.test(k)) o[k] = r[k]; });
    return JSON.stringify(o);
  }
  function groups(list) {
    const m = {}, out = [];
    (list || []).forEach(r => { if (!r || typeof r !== 'object') return; (m[sig(r)] = m[sig(r)] || []).push(r); });
    Object.keys(m).forEach(k => { if (m[k].length > 1) out.push(m[k]); });
    return out;
  }
  function scan(data) {
    const d = data || db(), res = {};
    COLS.forEach(c => {
      const g = groups(d[c]).map(a => ({ garder: a[0].id, doublons: a.slice(1).map(x => x.id) }));
      if (g.length) res[c] = g;
    });
    return res;
  }
  function clean(cols, data) {
    const d = data || db(); cols = cols && cols.length ? cols : COLS; let removed = 0;
    try { localStorage.setItem('gp_safety_snapshot', JSON.stringify({ date: new Date().toISOString(), why: 'avant nettoyage des doublons', db: d })); } catch (_) {}
    cols.forEach(c => {
      const drop = new Set();
      groups(d[c]).forEach(a => a.slice(1).forEach(x => drop.add(x)));
      if (drop.size) { d[c] = d[c].filter(x => !drop.has(x)); removed += drop.size; }
    });
    if (removed && !data && window.GPDB && GPDB.save) GPDB.save(d);
    return { supprimes: removed };
  }
  window.GPDedup = { scan, clean };
})();
