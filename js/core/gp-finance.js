/* Genius Property — règles financières communes (tableau de bord, rapports, mobile).
   Deux corrections par rapport à l'ancien calcul « p.paye || p.montant » :
   1) un paiement à 0 ne retombe plus sur le montant dû (un impayé n'est pas un encaissement) ;
   2) un paiement dont le contrat (ou le locataire) a été supprimé est « orphelin » : il n'est plus compté
      dans les totaux du tableau de bord / des rapports (il reste dans la base, rien n'est effacé). */
(function () {
  'use strict';
  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var n = Number(String(v == null ? '' : v).replace(/\s/g, '').replace(/[^0-9,.-]/g, '').replace(',', '.'));
    return isFinite(n) ? n : 0;
  }
  function has(v) { return v !== undefined && v !== null && String(v).trim() !== ''; }
  function norm(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(); }
  function clean(v) { return has(v) ? String(v).trim() : ''; }

  /* Montant réellement encaissé d'un paiement. */
  function paid(p) {
    if (!p) return 0;
    if (has(p.paye)) return num(p.paye);
    if (has(p.montantPaye)) return num(p.montantPaye);
    if (has(p.encaisse)) return num(p.encaisse);
    var st = norm(p.statut || p.status);
    if (st && /(pay|regle|encaiss|solde)/.test(st) && !/(impay|non pay|retard|attente|partiel)/.test(st)) return num(p.montant || p.loyer);
    return 0;
  }

  /* Index des contrats / locataires existants (mis en cache tant que la base ne change pas). */
  var cache = { key: '', ctx: null };
  function ctx() {
    var d = window.DB || {};
    var C = Array.isArray(d.contrats) ? d.contrats : [], T = Array.isArray(d.locataires) ? d.locataires : [];
    var key = [d.meta && d.meta.localRevision, C.length, T.length, (d.paiements || []).length, d.meta && d.meta.updatedAt].join('|');
    if (cache.ctx && cache.key === key) return cache.ctx;
    var ids = {}, pairs = {}, names = {}, tids = {};
    C.forEach(function (c) {
      [c.id, c.num, c.numero, c.contratId].forEach(function (v) { if (has(v)) ids[String(v).trim()] = 1; });
      var n = norm(c.locataire); if (n) { names[n] = 1; pairs[n + '|' + norm(c.locative || c.location || c.bien)] = 1; }
    });
    T.forEach(function (t) {
      if (has(t.id)) tids[String(t.id).trim()] = 1;
      [t.nom, [t.prenom, t.nom].join(' '), [t.nom, t.prenom].join(' '), t.nomComplet, t.name].forEach(function (v) { var n = norm(v); if (n) names[n] = 1; });
    });
    cache = { key: key, ctx: { ids: ids, pairs: pairs, names: names, tids: tids, hasContracts: C.length > 0 } };
    return cache.ctx;
  }

  /* Paiement rattaché à un contrat / locataire qui n'existe plus ? */
  function isOrphan(p) {
    if (!p) return false;
    var x = ctx();
    var refs = [p.contratId, p.contractId, p.contrat].map(clean).filter(Boolean);
    var name = norm(p.locataire || p.tenant || p.nomLocataire);
    if (refs.length) {
      if (refs.some(function (r) { return x.ids[r]; })) return false;
      /* lien par id cassé : on tolère si locataire + location correspondent encore à un contrat */
      return !(name && x.pairs[name + '|' + norm(p.locative || p.location || p.bien)]);
    }
    var tid = clean(p.locataireId || p.tenantId);
    if (tid) return !x.tids[tid] && !(name && x.names[name]);
    if (!name) return false;            /* paiement manuel sans rattachement : on le garde */
    return !x.names[name];
  }

  /* Montant à compter dans les totaux (0 si orphelin). */
  function counted(p) { return isOrphan(p) ? 0 : paid(p); }
  function valid(list) { return (Array.isArray(list) ? list : []).filter(function (p) { return !isOrphan(p); }); }
  function totalPaid(list) { return (Array.isArray(list) ? list : []).reduce(function (s, p) { return s + counted(p); }, 0); }
  function orphanCount(list) { return (Array.isArray(list) ? list : []).filter(isOrphan).length; }

  window.GPFinance = { num: num, paid: paid, isOrphan: isOrphan, counted: counted, valid: valid, totalPaid: totalPaid, orphanCount: orphanCount };
})();
