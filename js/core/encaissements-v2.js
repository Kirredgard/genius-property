/* Genius Property — Encaissements v2 (échéancier + vue par locataire + encaissement rapide)
 *
 * Remplace le rendu de la page Encaissements et le formulaire "Nouvel encaissement".
 * Principe : l'échéancier est CALCULÉ (contrats actifs × mois), jamais saisi.
 * Un paiement = une ligne { contrat, periode:'YYYY-MM', paye, ... } ; le solde d'un mois
 * est toujours  loyer+charges du contrat − somme(paye) des lignes de ce mois.
 * Aucune nouvelle clé racine : on ajoute seulement des champs aux objets existants
 * (paiements[].contrat/periode/ref/recuNo/groupe, contrats[].suiviDepuis).
 */
(function () {
  'use strict';
  if (window.GPEncV2) return;

  /* ───────── helpers ───────── */
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    const n = Number(String(v ?? '').replace(/\s/g, '').replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : 0;
  };
  const fmt = n => Math.round(n).toLocaleString('fr-FR') + ' FCFA';
  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const pad = n => String(n).padStart(2, '0');
  const notify = (m, t) => (typeof window.toast === 'function' ? window.toast(m, t) : console.log(m));
  const db = () => (window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {}));
  const saveDb = async d => {
    if (window.GPDB && window.GPDB.save) return window.GPDB.save(d);
    window.DB = d;
    if (typeof window.saveDB === 'function') return window.saveDB();
  };

  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const keyOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1);
  const nowKey = () => keyOf(new Date());
  const todayISO = () => iso(new Date());
  const addM = (k, n) => { const [y, m] = k.split('-').map(Number); return keyOf(new Date(y, m - 1 + n, 1)); };
  const validKey = k => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(k || ''));
  const monthLabel = k => {
    const [y, m] = k.split('-').map(Number);
    const s = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const shortDate = d => d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  function parseD(v) {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v) ? null : v;
    const s = String(v).trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    const d = new Date(s);
    return isNaN(d) ? null : d;
  }

  /* ───────── modèle : contrats, échéancier ───────── */
  const prepareRelations = d => { try { return window.GPRelationsV52 ? window.GPRelationsV52.ensure(d) : d; } catch (_) { return d; } };
  const activeContracts = d => (prepareRelations(d).contrats || []).filter(c => norm(c.statut) === 'actif');
  const cid = c => String(c.id || '').trim() || String(c.num || '').trim() || (norm(c.locataire) + '|' + norm(c.locative));

  function findLoc(d, c) {
    d = prepareRelations(d);
    if (c.locationId) { const byId = (d.locatives || []).find(l => String(l.id) === String(c.locationId)); if (byId) return byId; }
    const q = norm(c.locative || c.bien);
    return (d.locatives || []).find(l => norm(l.nom || l.bien) === q || norm(l.bien) === q) || null;
  }
  function monthlyDue(d, c) {
    let due = num(c.loyer) + num(c.charges);
    if (!due) { const l = findLoc(d, c); if (l) due = num(l.loyer) + num(l.charge); }
    return due;
  }
  function belongs(p, c) {
    if (p.contratId && c.id) return String(p.contratId) === String(c.id);
    if (p.contractId && c.id) return String(p.contractId) === String(c.id);
    if (p.contrat) return String(p.contrat) === String(c.id) || String(p.contrat) === String(c.num || '');
    return (p.locataireId && c.locataireId && String(p.locataireId) === String(c.locataireId)) || (norm(p.locataire) === norm(c.locataire) && norm(p.locative) === norm(c.locative));
  }
  function contractPayments(d, c) { return (d.paiements || []).filter(p => belongs(p, c)); }

  function paidMap(d, c) {
    const m = {};
    contractPayments(d, c).forEach(p => { if (validKey(p.periode)) m[p.periode] = (m[p.periode] || 0) + num(p.paye); });
    return m;
  }
  function defaultStart(d, c) {
    const keys = contractPayments(d, c).map(p => p.periode).filter(validKey).sort();
    if (keys.length) return keys[0];
    const pr = parseD(c.prochain);
    if (pr) return keyOf(pr);
    const db_ = parseD(c.debut);
    if (db_) { const k = keyOf(db_), floor = addM(nowKey(), -1); return k < floor ? floor : k; }
    return nowKey();
  }
  const startKey = (d, c) => (validKey(c.suiviDepuis) ? c.suiviDepuis : defaultStart(d, c));
  function endKey(c) { const f = parseD(c.fin); return f ? keyOf(f) : '9999-12'; }
  /* Jour d'échéance : « Prochaine échéance » si renseignée, sinon « Date début ». */
  const validDay = v => { const n = Number(v); return Number.isInteger(n) && n >= 1 && n <= 31 ? n : 0; };
  function dueDay(c) {
    const fixed = validDay(c.jourEcheance); if (fixed) return fixed;
    const pr = parseD(c.prochain); if (pr) return pr.getDate();
    const db_ = parseD(c.debut); return db_ ? db_.getDate() : 0;
  }
  function dueDate(c, k) {
    const [y, m] = k.split('-').map(Number);
    const day = dueDay(c) || 1;
    return new Date(y, m - 1, Math.min(day, new Date(y, m, 0).getDate()));
  }

  /** Échéances du contrat de son début de suivi jusqu'à `upto` (inclus). */
  function schedule(d, c, upto) {
    d = prepareRelations(d);
    const due = monthlyDue(d, c), paid = paidMap(d, c), out = [], today = todayISO();
    const last = upto < endKey(c) ? upto : endKey(c);
    for (let k = startKey(d, c); k <= last; k = addM(k, 1)) {
      const p = paid[k] || 0, solde = Math.max(0, due - p), dd = dueDate(c, k);
      const late = solde > 0 && iso(dd) < today;
      const statut = solde <= 0 ? 'paye' : p > 0 ? 'partiel' : late ? 'retard' : 'avenir';
      out.push({ k, due, paid: p, solde, dueDate: dd, late, statut, daysLate: late ? Math.floor((new Date(today) - new Date(iso(dd))) / 864e5) : 0 });
    }
    return out;
  }

  /** Répartition FIFO d'un montant sur les échéances impayées (les plus anciennes d'abord). */
  function allocate(d, c, amount) {
    d = prepareRelations(d);
    const due = monthlyDue(d, c), paid = paidMap(d, c), limit = addM(nowKey(), 12), end = endKey(c);
    const out = []; let left = amount;
    for (let k = startKey(d, c); k <= limit && k <= end && left > 0; k = addM(k, 1)) {
      const solde = Math.max(0, due - (paid[k] || 0));
      if (solde <= 0) continue;
      const a = Math.min(left, solde);
      out.push({ k, amount: a, due, soldeAvant: solde, soldeApres: solde - a });
      left -= a;
    }
    return { rows: out, leftover: left };
  }

  /* ───────── migration des anciens paiements ───────── */
  function migrate() {
    const d = prepareRelations(db());
    if (d.meta && d.meta.encaissementsV2) return false;
    if (!Array.isArray(d.paiements)) d.paiements = [];
    const contracts = (d.contrats || []);
    let linked = 0;
    d.paiements.forEach(p => {
      if (validKey(p.periode) && p.contrat) return;
      const c = contracts.find(x => norm(x.locataire) === norm(p.locataire) && norm(x.locative) === norm(p.locative))
             || contracts.find(x => norm(x.locataire) === norm(p.locataire));
      const dt = parseD(p.date);
      if (!c || !dt) return;
      p.contratId = c.id;
      p.contractId = c.id;
      p.contrat = p.contrat || c.num || c.id;
      p.locationId = c.locationId || ''; p.bienId = c.bienId || ''; p.proprietaireId = c.proprietaireId || ''; p.locataireId = c.locataireId || '';
      if (!validKey(p.periode)) p.periode = keyOf(dt);
      linked++;
    });
    contracts.forEach(c => { if (norm(c.statut) === 'actif' && !validKey(c.suiviDepuis)) c.suiviDepuis = defaultStart(d, c); });
    d.meta = d.meta || {};
    d.meta.encaissementsV2 = new Date().toISOString();
    saveDb(d);
    console.info('[Encaissements v2] migration : ' + linked + '/' + d.paiements.length + ' paiements rattachés');
    return true;
  }
  const unlinked = d => (d.paiements || []).filter(p => !p.contrat || !validKey(p.periode));

  /* ───────── numérotation des reçus ───────── */
  function nextRecu(d) {
    const y = new Date().getFullYear(); let max = 0;
    (d.paiements || []).forEach(p => {
      const m = String(p.recuNo || '').match(/^RCP-(\d{4})-(\d+)$/);
      if (m && +m[1] === y) max = Math.max(max, +m[2]);
    });
    return 'RCP-' + y + '-' + String(max + 1).padStart(4, '0');
  }

  function nextQuittance(d) {
    const y = new Date().getFullYear(); let max = 0;
    (d.paiements || []).forEach(p => {
      const m = String(p.quittanceNo || '').match(/^QLT-(\d{4})-(\d+)$/);
      if (m && +m[1] === y) max = Math.max(max, +m[2]);
    });
    return 'QLT-' + y + '-' + String(max + 1).padStart(4, '0');
  }
  function agencyInfo() {
    return {
      agence: localStorage.getItem('geniusproperty_agence') || 'Genius Property',
      email: localStorage.getItem('geniusproperty_email') || '',
      tel: localStorage.getItem('geniusproperty_tel') || '',
      adresse: localStorage.getItem('geniusproperty_adresse') || 'Dakar, Sénégal',
      rccm: localStorage.getItem('geniusproperty_rccm') || '',
      ninea: localStorage.getItem('geniusproperty_ninea') || '',
      logo: localStorage.getItem('geniusproperty_logo') || ''
    };
  }

  /* ───────── groupes d'encaissement (un encaissement peut couvrir plusieurs mois) ───────── */
  const groupOf = p => p.groupe || ('LEG|' + [p.recuNo || '', p.date || '', p.periode || '', p.paye || '', p.createdAt || ''].join('|'));
  const rowsOfGroup = (d, gid) => (d.paiements || []).filter(p => groupOf(p) === gid);
  const without = (d, gid) => Object.assign({}, d, { paiements: (d.paiements || []).filter(p => groupOf(p) !== gid) });
  function canWrite() {
    try { const P = window.GPPermissions; return !(P && typeof P.has === 'function') || !!P.has(null, 'paiements:write'); } catch (_) { return true; }
  }
  function pushAudit(d, action, detail) {
    try {
      d.meta = d.meta || {}; d.meta.encaissementsLog = d.meta.encaissementsLog || [];
      d.meta.encaissementsLog.unshift({ at: new Date().toISOString(), action, ...detail });
      d.meta.encaissementsLog.length = Math.min(d.meta.encaissementsLog.length, 200);
    } catch (_) {}
  }

  /* ───────── enregistrement d'un encaissement ───────── */
  function recalcPeriod(d, c, k) {
    const due = monthlyDue(d, c);
    const rows = d.paiements.filter(p => belongs(p, c) && p.periode === k).reverse(); // chronologique (unshift = récent d'abord)
    if (!rows.length) return;
    const total = rows.reduce((s, p) => s + num(p.paye), 0);
    rows.forEach((p, i) => {
      p.montant = String(i === 0 ? Math.round(due) : 0);
      p.reste = String(i === rows.length - 1 ? Math.max(0, Math.round(due - total)) : 0);
    });
  }
  /** Recalcule une période et garde la quittance cohérente : émise si soldée, retirée sinon. */
  function syncPeriod(d, c, k, now) {
    const rows = d.paiements.filter(p => belongs(p, c) && p.periode === k);
    if (!rows.length) return null;
    recalcPeriod(d, c, k);
    const due = monthlyDue(d, c), total = rows.reduce((s, p) => s + num(p.paye), 0);
    if (total >= due && due > 0) {
      const qNo = rows.find(p => p.quittanceNo)?.quittanceNo || nextQuittance(d);
      rows.forEach(p => { p.quittanceNo = qNo; p.quittanceAt = p.quittanceAt || now; });
      return { periode: k, quittanceNo: qNo, due };
    }
    rows.forEach(p => { delete p.quittanceNo; delete p.quittanceAt; });
    return null;
  }
  function refreshProchain(d, c) {
    const first = schedule(d, c, addM(nowKey(), 24)).find(e => e.solde > 0);
    if (first) { if (!validDay(c.jourEcheance)) c.jourEcheance = String(dueDay(c) || first.dueDate.getDate()); c.prochain = iso(first.dueDate); }
  }
  /** Enregistre un encaissement. opts.replace = id de groupe à remplacer (modification) :
   *  tout est validé AVANT de toucher aux données, donc une erreur ne casse rien. */
  async function saveEncaissement(cKey, amount, date, mode, ref, opts) {
    opts = opts || {};
    const d = prepareRelations(db()), c = activeContracts(d).find(x => cid(x) === cKey || String(x.num || '') === String(cKey));
    if (!c) return { error: 'Contrat introuvable' };
    if (!(amount > 0)) return { error: 'Saisissez un montant supérieur à 0' };
    const old = opts.replace ? rowsOfGroup(d, opts.replace) : [];
    if (opts.replace && !old.length) return { error: 'Encaissement introuvable (déjà supprimé ?)' };
    const al = allocate(opts.replace ? without(d, opts.replace) : d, c, amount);
    if (!al.rows.length) return { error: 'Aucune échéance à solder pour ce contrat' };
    if (al.leftover > 0) return { error: 'Le montant dépasse ce qui peut être imputé (' + fmt(amount - al.leftover) + ' max)' };
    /* ── validation OK : on peut modifier ── */
    const loc = findLoc(d, c) || {};
    if (!Array.isArray(d.paiements)) d.paiements = [];
    const oldPeriods = old.map(p => p.periode).filter(validKey);
    const keep = old[0] || {};
    if (opts.replace) d.paiements = d.paiements.filter(p => groupOf(p) !== opts.replace);
    const recuNo = keep.recuNo || nextRecu(d), groupe = keep.groupe || ('ENC-' + Date.now().toString(36)), now = new Date().toISOString();
    al.rows.slice().reverse().forEach(a => {
      d.paiements.unshift({
        locataire: c.locataire, locative: c.locative, bien: c.bien || loc.bien || '',
        contratId: c.id, contractId: c.id, contrat: c.num || c.id, locationId: c.locationId || '', bienId: c.bienId || '', proprietaireId: c.proprietaireId || '', locataireId: c.locataireId || '', periode: a.k,
        montant: String(Math.round(a.due)), paye: String(Math.round(a.amount)), reste: '0',
        date, mode, ref: ref || '', recuNo, groupe, createdAt: keep.createdAt || now,
        ...(opts.replace ? { modifiedAt: now } : {})
      });
    });
    const touched = Array.from(new Set(al.rows.map(a => a.k).concat(oldPeriods)));
    const settled = {};
    touched.forEach(k => { const r = syncPeriod(d, c, k, now); if (r) settled[k] = r; });
    const settledPeriods = al.rows.map(a => settled[a.k]).filter(Boolean);
    refreshProchain(d, c);
    pushAudit(d, opts.replace ? 'modification' : 'creation', { recuNo, contrat: c.num || c.id, locataire: c.locataire, montant: Math.round(amount), avant: old.reduce((s, p) => s + num(p.paye), 0) });
    await saveDb(d);
    try { localStorage.setItem('gpe_last_mode', mode); } catch (_) {}
    return { recuNo, rows: al.rows, settledPeriods, cKey: cid(c) };
  }

  /** Supprime un encaissement complet (toutes ses lignes) puis recalcule soldes / quittances. */
  async function deleteEncaissement(gid) {
    if (!canWrite()) return notify('Action non autorisée pour votre rôle', 'err');
    const d = prepareRelations(db()), rows = rowsOfGroup(d, gid);
    if (!rows.length) return notify('Encaissement introuvable', 'err');
    const c = (d.contrats || []).find(x => belongs(rows[0], x));
    const total = rows.reduce((s, p) => s + num(p.paye), 0);
    const periods = Array.from(new Set(rows.map(p => p.periode).filter(validKey))).sort().map(monthLabel).join(', ');
    const msg = 'Supprimer cet encaissement ?\n\n' + (rows[0].locataire || '') + ' — ' + fmt(total) + (periods ? '\nPériode(s) : ' + periods : '') + (rows[0].recuNo ? '\nReçu : ' + rows[0].recuNo : '') +
      '\n\nLes soldes seront recalculés. Cette action est enregistrée dans le journal.';
    if (!window.confirm(msg)) return false;
    const now = new Date().toISOString(), oldPeriods = Array.from(new Set(rows.map(p => p.periode).filter(validKey)));
    d.paiements = d.paiements.filter(p => groupOf(p) !== gid);
    if (c) { oldPeriods.forEach(k => syncPeriod(d, c, k, now)); refreshProchain(d, c); }
    pushAudit(d, 'suppression', { recuNo: rows[0].recuNo || '', contrat: c ? (c.num || c.id) : '', locataire: rows[0].locataire || '', montant: Math.round(total) });
    await saveDb(d);
    refreshAll();
    notify('Encaissement supprimé ✓');
    return true;
  }

  /* ───────── styles ───────── */
  function injectStyle() {
    if ($('gpe-style')) return;
    document.head.insertAdjacentHTML('beforeend', `<style id="gpe-style">
      .gpe{--g:#d4af37;--line:#eef2f7;--mut:#6b7280;padding:0}
      .gpe-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}
      .gpe-title{display:flex;align-items:center;gap:10px}.gpe-title h3{margin:0;font-size:18px}.gpe-title p{margin:3px 0 0;color:var(--mut);font-size:12px}
      .gpe-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .gpe-btn{height:36px;border-radius:9px;padding:0 13px;font-size:12px;font-weight:800;cursor:pointer;border:1px solid #e5e7eb;background:#fff;color:#111827;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
      .gpe-btn:hover{border-color:#cbd5e1}.gpe-btn.pri{background:var(--g);border-color:var(--g);color:#111}.gpe-btn.sm{height:30px;padding:0 10px;font-size:11px}.gpe-btn[disabled]{opacity:.45;cursor:default}
      .gpe-btn .material-symbols-rounded{font-size:16px}
      .gpe-month{display:flex;align-items:center;border:1px solid #e5e7eb;border-radius:9px;background:#fff;height:36px;overflow:hidden}
      .gpe-month button{border:0;background:none;width:30px;min-width:30px;flex:0 0 30px;height:100%;padding:0;cursor:pointer;color:#374151;display:inline-flex;align-items:center;justify-content:center}.gpe-month button:hover{background:#f8fafc}
      .gpe-month button .material-symbols-rounded{min-width:0;width:auto;font-size:18px;line-height:1}
      .gpe-month>span{min-width:128px;text-align:center;font-size:12px;font-weight:900}
      .gpe-cards{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:12px}
      .gpe-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px}
      .gpe-card small{display:block;color:var(--mut);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.3px}
      .gpe-card strong{display:block;font-size:17px;margin-top:4px}.gpe-card em{display:block;font-size:10px;color:var(--mut);font-style:normal;margin-top:2px}
      .gpe-green{color:#16a34a}.gpe-red{color:#dc2626}.gpe-orange{color:#d97706}
      .gpe-bar{height:6px;background:#f1f5f9;border-radius:9px;margin-top:8px;overflow:hidden}.gpe-bar i{display:block;height:100%;background:#16a34a}
      .gpe-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
      .gpe-search{flex:1;min-width:190px;height:36px;border:1px solid #e5e7eb;border-radius:9px;padding:0 11px;font-size:12px;background:#fff}
      .gpe-chips{display:flex;gap:6px;flex-wrap:wrap}
      .gpe-chip{height:30px;border-radius:99px;border:1px solid #e5e7eb;background:#fff;padding:0 11px;font-size:11px;font-weight:800;cursor:pointer;color:#374151}
      .gpe-chip.on{background:#111827;border-color:#111827;color:#fff}
      .gpe-banner{background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:10px;padding:9px 12px;font-size:12px;margin-bottom:10px}
      .gpe-table{background:#fff;border:1px solid var(--line);border-radius:12px;overflow:auto}
      .gpe-table table{width:100%;border-collapse:collapse;font-size:12px}
      .gpe-table th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:var(--mut);padding:10px 12px;border-bottom:1px solid var(--line);background:#fafbfc;white-space:nowrap}
      .gpe-table td{padding:10px 12px;border-bottom:1px solid #f4f6f9;vertical-align:middle}
      .gpe-table tr:last-child td{border-bottom:0}.gpe-table tbody tr:hover{background:#fcfcfd}
      .gpe-r{text-align:right}.gpe-sub{display:block;color:var(--mut);font-size:10.5px;margin-top:2px}
      .gpe-pill{display:inline-flex;align-items:center;gap:4px;border-radius:99px;padding:3px 9px;font-size:10.5px;font-weight:900;white-space:nowrap}
      .gpe-pill.paye{background:#dcfce7;color:#166534}.gpe-pill.partiel{background:#fef3c7;color:#92400e}.gpe-pill.retard{background:#fee2e2;color:#991b1b}.gpe-pill.avenir{background:#f1f5f9;color:#475569}
      .gpe-foot{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:9px 12px;font-size:11px;color:var(--mut);border-top:1px solid var(--line);background:#fafbfc}.gpe-foot .gp-common-pagination{margin-left:auto}
      .gpe-empty{padding:34px;text-align:center;color:#94a3b8;font-size:12px}
      .gpe-link{background:none;border:0;padding:0;font:inherit;font-weight:900;color:#111827;cursor:pointer;text-align:left}.gpe-link:hover{text-decoration:underline}
      #gpeOverlay{position:fixed;inset:0;background:rgba(15,23,42,.42);z-index:9998;opacity:0;transition:opacity .18s}
      #gpeDrawer{position:fixed;top:0;right:0;bottom:0;width:min(580px,96vw);background:#fff;z-index:9999;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .22s;box-shadow:-20px 0 45px rgba(15,23,42,.22);border-left:1px solid #e5e7eb}
      #gpeDrawer .h{display:flex;justify-content:space-between;align-items:flex-start;padding:16px 20px 12px;border-bottom:1px solid var(--line)}
      #gpeDrawer .h b{font-size:18px;display:block;line-height:1.15}#gpeDrawer .h small{display:block;color:var(--mut);font-size:12px;margin-top:5px}
      #gpeDrawer .x{width:34px;height:34px;border:1px solid #fecaca;background:#fff7f7;color:#dc2626;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center}
      #gpeDrawer .b{flex:1;overflow:auto;padding:14px 20px 18px}
      #gpeDrawer .f{display:flex;justify-content:space-between;gap:10px;padding:12px 20px 15px;border-top:1px solid var(--line)}
      #gpeDrawer .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}#gpeDrawer .fd{min-width:0;margin-bottom:12px}
      #gpeDrawer label{display:block;font-size:11px;font-weight:800;color:#374151;margin-bottom:5px}
      #gpeDrawer input,#gpeDrawer select{width:100%;box-sizing:border-box;height:38px;border:1px solid #e5e7eb;border-radius:9px;font-size:12px;padding:0 10px;background:#fff;color:#111827;outline:none}
      #gpeDrawer input:focus,#gpeDrawer select:focus{border-color:#c9b04f;box-shadow:0 0 0 3px rgba(212,175,55,.12)}
      #gpeDrawer .amt{font-size:20px;font-weight:900;height:46px}
      .gpe-info{background:#f8fafc;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:12px;margin-bottom:12px}
      .gpe-info .row{display:flex;justify-content:space-between;gap:10px;padding:2px 0}
      .gpe-quick{display:flex;gap:6px;flex-wrap:wrap;margin:-4px 0 12px}
      .gpe-prev{border:1px dashed #cbd5e1;border-radius:10px;padding:10px 12px;font-size:12px;margin-bottom:12px;background:#fcfcfd}
      .gpe-prev h4{margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:var(--mut)}
      .gpe-prev .row{display:flex;justify-content:space-between;gap:8px;padding:3px 0}.gpe-prev .err{color:#dc2626;font-weight:800}
      .gpe-tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin:4px 0 12px}
      .gpe-tab{border:0;background:none;padding:9px 12px;font-size:12px;font-weight:900;color:var(--mut);cursor:pointer;border-bottom:2px solid transparent}
      .gpe-tab.on{color:#111827;border-color:var(--g)}
      .gpe-mini{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}.gpe-mini .gpe-card{padding:9px 10px}.gpe-mini strong{font-size:14px}
      .gpe-docs{border:1px solid var(--line);border-radius:12px;background:#fff;padding:12px;margin-top:12px}.gpe-docs h4{margin:0 0 8px;font-size:12px}.gpe-doc-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9}.gpe-doc-row:last-child{border-bottom:0}.gpe-doc-row small{display:block;color:var(--mut);margin-top:2px}.gpe-report-box{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px 12px;font-size:12px}
      @media(max-width:1000px){.gpe-cards{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:700px){#gpeDrawer .g2{grid-template-columns:1fr}.gpe-mini{grid-template-columns:1fr}}
    </style>`);
  }

  /* ───────── page principale ───────── */
  const st = { month: nowKey(), filter: 'tous', q: '' };
  const STATUS = { paye: 'Payé', partiel: 'Partiel', retard: 'En retard', avenir: 'À venir' };
  const PAGE_SIZE = 10;
  const pill = s => '<span class="gpe-pill ' + s + '">' + STATUS[s] + '</span>';

  function rowsForMonth(d) {
    const out = [];
    activeContracts(d).forEach(c => {
      const sch = schedule(d, c, st.month);
      const cur = sch.find(e => e.k === st.month);
      if (!cur) return; // pas encore suivi / contrat terminé sur ce mois
      const arrears = sch.filter(e => e.k < st.month).reduce((s, e) => s + e.solde, 0);
      out.push({ c, cur, arrears, key: cid(c), bien: c.bien || (findLoc(d, c) || {}).bien || '' });
    });
    const order = { retard: 0, partiel: 1, avenir: 2, paye: 3 };
    return out.sort((a, b) => (order[a.cur.statut] - order[b.cur.statut]) || norm(a.c.locataire).localeCompare(norm(b.c.locataire)));
  }

  function paintTable() {
    const d = db(), all = rowsForMonth(d), q = norm(st.q);
    const rows = all.filter(r => (st.filter === 'tous' || r.cur.statut === st.filter || (st.filter === 'retard' && r.arrears > 0)) &&
      (!q || norm(r.c.locataire + ' ' + r.bien + ' ' + r.c.locative).includes(q)));
    const tb = $('gpeTbody'); if (!tb) return;
    const pg = window.GPPagination ? GPPagination.normalize('encaissements', rows.length, PAGE_SIZE) : { page: 1, pages: Math.max(1, Math.ceil(rows.length / PAGE_SIZE)), start: 0 };
    const visible = rows.slice(pg.start, pg.start + PAGE_SIZE);
    tb.innerHTML = visible.length ? visible.map(r => {
      const e = r.cur, k = esc(r.key);
      return '<tr><td><button class="gpe-link" data-fiche="' + k + '">' + esc(r.c.locataire || '—') + '</button><span class="gpe-sub">' + esc(r.bien || r.c.locative || '') + '</span></td>' +
        '<td>' + shortDate(e.dueDate) + (e.late ? '<span class="gpe-sub gpe-red">' + e.daysLate + ' j de retard</span>' : '') + '</td>' +
        '<td class="gpe-r">' + fmt(e.due) + '</td><td class="gpe-r gpe-green">' + fmt(e.paid) + '</td>' +
        '<td class="gpe-r ' + (e.solde > 0 ? 'gpe-orange' : 'gpe-green') + '"><b>' + fmt(e.solde) + '</b></td>' +
        '<td class="gpe-r ' + (r.arrears > 0 ? 'gpe-red' : '') + '">' + (r.arrears > 0 ? '<b>' + fmt(r.arrears) + '</b>' : '—') + '</td>' +
        '<td>' + pill(e.statut) + '</td>' +
        '<td class="gpe-r" style="white-space:nowrap"><button class="gpe-btn sm pri" data-pay="' + k + '"' + (e.solde <= 0 && r.arrears <= 0 ? ' disabled' : '') + '><span class="material-symbols-rounded">add_card</span>Encaisser</button> ' +
        '<button class="gpe-btn sm" data-fiche="' + k + '" title="Fiche de compte"><span class="material-symbols-rounded">visibility</span></button></td></tr>';
    }).join('') : '<tr><td colspan="8" class="gpe-empty">' + (all.length ? 'Aucun résultat pour ce filtre' : 'Aucun contrat actif suivi sur ' + monthLabel(st.month)) + '</td></tr>';
    const f = $('gpeCount');
    if (f) {
      const from = rows.length ? pg.start + 1 : 0;
      const to = Math.min(pg.start + PAGE_SIZE, rows.length);
      f.innerHTML = '<span>Affichage de ' + from + ' à ' + to + ' sur ' + rows.length + ' locataire' + (rows.length > 1 ? 's' : '') + ' · ' + monthLabel(st.month) + '</span>' + (window.GPPagination ? GPPagination.pages('encaissements', rows.length, PAGE_SIZE, paintTable) : '');
    }
  }

  function render() {
    const page = $('page-paiements'); if (!page) return;
    injectStyle(); migrate();
    const d = db(), all = rowsForMonth(d);
    const attendu = all.reduce((s, r) => s + r.cur.due, 0), percu = all.reduce((s, r) => s + r.cur.paid, 0);
    const reste = all.reduce((s, r) => s + r.cur.solde, 0), arrears = all.reduce((s, r) => s + r.arrears, 0);
    const taux = attendu ? Math.min(100, Math.round(percu / attendu * 100)) : 0;
    const nUn = unlinked(d).length;
    const chip = (k, l, n) => '<button class="gpe-chip' + (st.filter === k ? ' on' : '') + '" data-filter="' + k + '">' + l + (n != null ? ' (' + n + ')' : '') + '</button>';
    const cnt = s => all.filter(r => r.cur.statut === s).length;
    page.innerHTML = '<div class="gpe">' +
      '<div class="gpe-top"><div class="gpe-title"><span class="material-symbols-rounded" style="color:#16a34a">payments</span><div><h3>Encaissements</h3><p>Suivi mensuel des loyers par locataire — les échéances sont générées automatiquement.</p></div></div>' +
      '<div class="gpe-actions"><div class="gpe-month"><button data-mo="-1" aria-label="Mois précédent"><span class="material-symbols-rounded" style="font-size:18px">chevron_left</span></button><span>' + monthLabel(st.month) + '</span><button data-mo="1" aria-label="Mois suivant"><span class="material-symbols-rounded" style="font-size:18px">chevron_right</span></button></div>' +
      '<button class="gpe-btn" data-export><span class="material-symbols-rounded">download</span>Exporter</button>' +
      '<button class="gpe-btn pri" data-pay=""><span class="material-symbols-rounded">add</span>Nouvel encaissement</button></div></div>' +
      '<div class="gpe-cards">' +
      '<div class="gpe-card"><small>Attendu</small><strong>' + fmt(attendu) + '</strong><em>' + all.length + ' loyer' + (all.length > 1 ? 's' : '') + '</em></div>' +
      '<div class="gpe-card"><small>Encaissé</small><strong class="gpe-green">' + fmt(percu) + '</strong><div class="gpe-bar"><i style="width:' + taux + '%"></i></div></div>' +
      '<div class="gpe-card"><small>Reste du mois</small><strong class="gpe-orange">' + fmt(reste) + '</strong><em>à percevoir</em></div>' +
      '<div class="gpe-card"><small>Arriérés</small><strong class="' + (arrears ? 'gpe-red' : '') + '">' + fmt(arrears) + '</strong><em>mois précédents</em></div>' +
      '<div class="gpe-card"><small>Recouvrement</small><strong>' + taux + ' %</strong><em>du mois</em></div></div>' +
      (nUn ? '<div class="gpe-banner"><b>' + nUn + ' ancien' + (nUn > 1 ? 's' : '') + ' paiement' + (nUn > 1 ? 's' : '') + '</b> non rattaché' + (nUn > 1 ? 's' : '') + ' à un contrat actif (contrat terminé ou nom différent) : ' + (nUn > 1 ? 'ils restent' : 'il reste') + ' consultable' + (nUn > 1 ? 's' : '') + ' dans l\'export mais ' + (nUn > 1 ? 'ne comptent' : 'ne compte') + ' pas dans l\'échéancier.</div>' : '') +
      '<div class="gpe-toolbar"><input class="gpe-search" id="gpeSearch" placeholder="Rechercher un locataire, un bien…" value="' + esc(st.q) + '"><div class="gpe-chips">' +
      chip('tous', 'Tous', all.length) + chip('retard', 'En retard', cnt('retard')) + chip('partiel', 'Partiels', cnt('partiel')) + chip('avenir', 'À venir', cnt('avenir')) + chip('paye', 'Payés', cnt('paye')) + '</div></div>' +
      '<div class="gpe-table"><table><thead><tr><th>Locataire</th><th>Échéance</th><th class="gpe-r">Dû</th><th class="gpe-r">Payé</th><th class="gpe-r">Solde</th><th class="gpe-r">Arriérés</th><th>Statut</th><th class="gpe-r">Actions</th></tr></thead><tbody id="gpeTbody"></tbody></table><div class="gpe-foot" id="gpeCount"></div></div></div>';
    paintTable();
  }

  /* ───────── drawers ───────── */
  function closeDrawer() {
    const ov = $('gpeOverlay'), dr = $('gpeDrawer');
    if (dr) dr.style.transform = 'translateX(100%)'; if (ov) ov.style.opacity = '0';
    setTimeout(() => { ov && ov.remove(); dr && dr.remove(); }, 180);
  }
  function openDrawer(title, sub, body, footer) {
    $('gpeOverlay') && $('gpeOverlay').remove(); $('gpeDrawer') && $('gpeDrawer').remove();
    document.body.insertAdjacentHTML('beforeend', '<div id="gpeOverlay"></div><aside id="gpeDrawer" aria-label="' + esc(title) + '"><div class="h"><div><b>' + esc(title) + '</b><small>' + sub + '</small></div><button class="x" data-close aria-label="Fermer"><span class="material-symbols-rounded">close</span></button></div><div class="b" id="gpeBody">' + body + '</div>' + (footer ? '<div class="f">' + footer + '</div>' : '') + '</aside>');
    $('gpeOverlay').addEventListener('click', closeDrawer);
    requestAnimationFrame(() => { const ov = $('gpeOverlay'), dr = $('gpeDrawer'); if (ov) ov.style.opacity = '1'; if (dr) dr.style.transform = 'translateX(0)'; });
  }

  /* — encaissement rapide — */
  const pay = { key: '', replace: '' };
  const viewDb = d => (pay.replace ? without(d, pay.replace) : d);
  function openPay(key) {
    pay.replace = '';
    injectStyle(); migrate();
    const d = db(), cs = activeContracts(d);
    if (!cs.length) return notify('Aucun contrat actif : créez d\'abord une location avec contrat.', 'err');
    pay.key = key && cs.some(c => cid(c) === key) ? key : (cs.length === 1 ? cid(cs[0]) : '');
    let lastMode = 'Espèces'; try { lastMode = localStorage.getItem('gpe_last_mode') || 'Espèces'; } catch (_) {}
    const selector = key
      ? '<div class="gpe-info" id="gpePayCtx"></div>'
      : '<div class="fd"><label>Locataire / location *</label><select id="gpePayC"><option value="">Sélectionner</option>' + cs.map(c => '<option value="' + esc(cid(c)) + '"' + (pay.key === cid(c) ? ' selected' : '') + '>' + esc((c.locataire || '—') + ' — ' + (c.bien || c.locative || '')) + '</option>').join('') + '</select></div><div class="gpe-info" id="gpePayCtx"></div>';
    const body = selector +
      '<div class="fd"><label>Montant encaissé (FCFA) *</label><input class="amt" id="gpePayAmt" type="number" min="0" inputmode="numeric"></div>' +
      '<div class="gpe-quick"><button type="button" class="gpe-btn sm" data-q="oldest">Échéance la plus ancienne</button><button type="button" class="gpe-btn sm" data-q="all">Tout solder</button><button type="button" class="gpe-btn sm" data-q="next">Mois suivant</button></div>' +
      '<div class="g2"><div class="fd"><label>Mode de paiement</label><select id="gpePayMode">' + ['Espèces', 'Wave', 'Orange Money', 'Mobile Money', 'Virement', 'Chèque'].map(x => '<option' + (x === lastMode ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></div>' +
      '<div class="fd"><label>Date de paiement</label><input id="gpePayDate" type="date" value="' + todayISO() + '"></div></div>' +
      '<div class="fd"><label>Référence (facultatif)</label><input id="gpePayRef" placeholder="N° transaction Wave / N° de chèque…"></div>' +
      '<div class="gpe-prev" id="gpePayPrev"></div>';
    openDrawer('Encaisser un loyer', 'Le montant dû et la période sont déterminés automatiquement.', body,
      '<button class="gpe-btn" data-close>Annuler</button><button class="gpe-btn pri" id="gpePaySave" data-save><span class="material-symbols-rounded">check</span>Enregistrer l\'encaissement</button>');
    if (pay.key) presetAmount('oldest');
    payContext(); payPreview();
  }
  /** Ouvre le formulaire pré-rempli pour corriger un encaissement existant. */
  function openEdit(gid) {
    if (!canWrite()) return notify('Action non autorisée pour votre rôle', 'err');
    injectStyle(); migrate();
    const d = prepareRelations(db()), rows = rowsOfGroup(d, gid);
    if (!rows.length) return notify('Encaissement introuvable', 'err');
    const c = activeContracts(d).find(x => belongs(rows[0], x));
    if (!c) return notify('Contrat introuvable ou terminé : modification impossible', 'err');
    pay.key = cid(c); pay.replace = gid;
    const first = rows[rows.length - 1], total = rows.reduce((s, p) => s + num(p.paye), 0);
    const dt = parseD(first.date), modes = ['Espèces', 'Wave', 'Orange Money', 'Mobile Money', 'Virement', 'Chèque'];
    if (first.mode && !modes.includes(first.mode)) modes.push(first.mode);
    const body = '<div class="gpe-banner">Vous modifiez l’encaissement <b>' + esc(first.recuNo || '') + '</b>. Le montant sera réimputé automatiquement aux échéances ; le même numéro de reçu est conservé.</div>' +
      '<div class="gpe-info" id="gpePayCtx"></div>' +
      '<div class="fd"><label>Montant encaissé (FCFA) *</label><input class="amt" id="gpePayAmt" type="number" min="0" inputmode="numeric" value="' + Math.round(total) + '"></div>' +
      '<div class="g2"><div class="fd"><label>Mode de paiement</label><select id="gpePayMode">' + modes.map(x => '<option' + (x === first.mode ? ' selected' : '') + '>' + esc(x) + '</option>').join('') + '</select></div>' +
      '<div class="fd"><label>Date de paiement</label><input id="gpePayDate" type="date" value="' + (dt ? iso(dt) : todayISO()) + '"></div></div>' +
      '<div class="fd"><label>Référence (facultatif)</label><input id="gpePayRef" value="' + esc(first.ref || '') + '" placeholder="N° transaction Wave / N° de chèque…"></div>' +
      '<div class="gpe-prev" id="gpePayPrev"></div>';
    openDrawer('Modifier l’encaissement', esc(c.locataire || '') + ' · ' + esc(first.recuNo || ''), body,
      '<button class="gpe-btn" data-close>Annuler</button><button class="gpe-btn pri" id="gpePaySave" data-save><span class="material-symbols-rounded">check</span>Enregistrer les modifications</button>');
    payContext(); payPreview();
  }
  function curContract() { const d = db(); return activeContracts(d).find(c => cid(c) === pay.key) || null; }
  function payContext() {
    const el = $('gpePayCtx'); if (!el) return;
    const d = viewDb(db()), c = curContract();
    if (!c) { el.innerHTML = '<span style="color:#6b7280">Sélectionnez un locataire pour voir sa situation.</span>'; return; }
    const sch = schedule(d, c, nowKey()), solde = sch.reduce((s, e) => s + e.solde, 0);
    const first = sch.find(e => e.solde > 0);
    el.innerHTML = '<div class="row"><span>Locataire</span><b>' + esc(c.locataire || '—') + '</b></div><div class="row"><span>Bien</span><b>' + esc(c.bien || c.locative || '—') + '</b></div>' +
      '<div class="row"><span>Loyer mensuel</span><b>' + fmt(monthlyDue(d, c)) + '</b></div>' +
      '<div class="row"><span>Solde dû à ce jour</span><b class="' + (solde > 0 ? 'gpe-red' : 'gpe-green') + '">' + fmt(solde) + '</b></div>' +
      (first ? '<div class="row"><span>Plus ancienne impayée</span><b>' + monthLabel(first.k) + '</b></div>' : '');
  }
  function presetAmount(kind) {
    const d = viewDb(db()), c = curContract(), inp = $('gpePayAmt'); if (!c || !inp) return;
    const sch = schedule(d, c, nowKey());
    let v = 0;
    if (kind === 'all') v = sch.reduce((s, e) => s + e.solde, 0);
    else if (kind === 'next') { const nk = addM(nowKey(), 1), p = paidMap(d, c)[nk] || 0; v = Math.max(0, monthlyDue(d, c) - p); }
    else v = (sch.find(e => e.solde > 0) || {}).solde || monthlyDue(d, c);
    if (kind === 'next' && !v) v = monthlyDue(d, c);
    inp.value = Math.round(v) || '';
  }
  function payPreview() {
    const el = $('gpePayPrev'), btn = $('gpePaySave'); if (!el) return;
    const d = viewDb(db()), c = curContract(), amount = num(($('gpePayAmt') || {}).value);
    if (!c || !(amount > 0)) { el.innerHTML = '<h4>Imputation</h4><span style="color:#6b7280">Saisissez un montant pour voir à quelles échéances il sera imputé.</span>'; if (btn) btn.disabled = !c; return; }
    const al = allocate(d, c, amount);
    let h = '<h4>Imputation du paiement</h4>' + al.rows.map(a => '<div class="row"><span>' + monthLabel(a.k) + '</span><span><b>' + fmt(a.amount) + '</b> ' + (a.soldeApres <= 0 ? '<span class="gpe-pill paye">soldé</span>' : '<span class="gpe-pill partiel">reste ' + fmt(a.soldeApres) + '</span>') + '</span></div>').join('');
    if (!al.rows.length) h += '<div class="err">Toutes les échéances sont déjà soldées.</div>';
    if (al.leftover > 0) h += '<div class="err">Le montant dépasse de ' + fmt(al.leftover) + ' ce qui peut être imputé (12 mois d\'avance max).</div>';
    el.innerHTML = h; if (btn) btn.disabled = !al.rows.length || al.leftover > 0;
  }
  async function submitPay() {
    const btn = $('gpePaySave'); if (btn && btn.disabled) return;
    if (!pay.key) return notify('Sélectionnez un locataire', 'err');
    if (btn) btn.disabled = true;
    if (!canWrite()) { if (btn) btn.disabled = false; return notify('Action non autorisée pour votre rôle', 'err'); }
    const editing = !!pay.replace;
    const r = await saveEncaissement(pay.key, num($('gpePayAmt').value), $('gpePayDate').value || todayISO(), $('gpePayMode').value, ($('gpePayRef').value || '').trim(), editing ? { replace: pay.replace } : {});
    if (r.error) { if (btn) btn.disabled = false; return notify(r.error, 'err'); }
    pay.replace = '';
    refreshAll();
    notify(editing ? 'Encaissement modifié ✓ — reçu ' + r.recuNo : 'Encaissement enregistré ✓ — reçu ' + r.recuNo);
    offerPaymentDocuments(r, editing);
  }

  /* — fiche de compte locataire — */
  const fiche = { key: '', tab: 'ech' };
  function paintFiche() {
    const d = db(), c = activeContracts(d).find(x => cid(x) === fiche.key); if (!c) return;
    const sch = schedule(d, c, addM(nowKey(), 1)), upToNow = sch.filter(e => e.k <= nowKey());
    const due = upToNow.reduce((s, e) => s + e.due, 0), paid = upToNow.reduce((s, e) => s + e.paid, 0), solde = upToNow.reduce((s, e) => s + e.solde, 0);
    const pays = contractPayments(d, c).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const ech = '<div class="gpe-table"><table><thead><tr><th>Période</th><th class="gpe-r">Dû</th><th class="gpe-r">Payé</th><th class="gpe-r">Solde</th><th>Statut</th><th></th></tr></thead><tbody>' +
      sch.slice().reverse().map(e => '<tr><td><b>' + monthLabel(e.k) + '</b><span class="gpe-sub">échéance ' + shortDate(e.dueDate) + (e.late ? ' · ' + e.daysLate + ' j' : '') + '</span></td><td class="gpe-r">' + fmt(e.due) + '</td><td class="gpe-r gpe-green">' + fmt(e.paid) + '</td><td class="gpe-r ' + (e.solde ? 'gpe-orange' : 'gpe-green') + '"><b>' + fmt(e.solde) + '</b></td><td>' + pill(e.statut) + '</td><td class="gpe-r">' + (e.solde > 0 ? '<button class="gpe-btn sm" data-pay="' + esc(fiche.key) + '">Encaisser</button>' : '') + '</td></tr>').join('') + '</tbody></table></div>';
    const groups = []; const seen = {};
    pays.forEach(p => { const g = groupOf(p); if (!seen[g]) { seen[g] = { gid: g, rows: [] }; groups.push(seen[g]); } seen[g].rows.push(p); });
    const hist = groups.length ? '<div class="gpe-table"><table><thead><tr><th>Date</th><th>Période(s)</th><th class="gpe-r">Montant</th><th>Mode</th><th>Reçu</th><th class="gpe-r">Actions</th></tr></thead><tbody>' +
      groups.map(g => {
        const p = g.rows[0], total = g.rows.reduce((s, x) => s + num(x.paye), 0);
        const per = Array.from(new Set(g.rows.map(x => x.periode).filter(validKey))).sort().map(monthLabel).join(', ') || '—';
        const act = canWrite() ? '<button class="gpe-btn sm" data-edit="' + esc(g.gid) + '" title="Modifier"><span class="material-symbols-rounded">edit</span></button> <button class="gpe-btn sm" data-del="' + esc(g.gid) + '" title="Supprimer" style="color:#dc2626"><span class="material-symbols-rounded">delete</span></button>' : '';
        return '<tr><td>' + esc((parseD(p.date) ? shortDate(parseD(p.date)) : p.date) || '—') + '</td><td>' + esc(per) + '</td><td class="gpe-r gpe-green"><b>' + fmt(total) + '</b></td><td>' + esc(p.mode || '—') + (p.ref ? '<span class="gpe-sub">' + esc(p.ref) + '</span>' : '') + '</td><td>' + esc(p.recuNo || '—') + (p.modifiedAt ? '<span class="gpe-sub">modifié</span>' : '') + '</td>' +
          '<td class="gpe-r" style="white-space:nowrap">' + (p.recuNo ? '<button class="gpe-btn sm" data-receipt="' + esc(p.recuNo) + '" title="Reçu PDF"><span class="material-symbols-rounded">receipt_long</span></button> ' : '') + act + '</td></tr>';
      }).join('') + '</tbody></table></div>'
      : '<div class="gpe-empty">Aucun paiement enregistré pour ce contrat</div>';
    $('gpeBody').innerHTML =
      '<div class="gpe-mini"><div class="gpe-card"><small>Total dû</small><strong>' + fmt(due) + '</strong></div><div class="gpe-card"><small>Total payé</small><strong class="gpe-green">' + fmt(paid) + '</strong></div><div class="gpe-card"><small>Solde</small><strong class="' + (solde ? 'gpe-red' : 'gpe-green') + '">' + fmt(solde) + '</strong></div></div>' +
      '<div class="gpe-info"><div class="row"><span>Contrat</span><b>' + esc(c.num || '—') + '</b></div><div class="row"><span>Loyer mensuel</span><b>' + fmt(monthlyDue(d, c)) + '</b></div>' +
      '<div class="row"><span>Suivi depuis</span><input type="month" id="gpeStart" value="' + esc(startKey(d, c)) + '" style="width:150px;height:30px"></div></div>' +
      '<div class="gpe-tabs"><button class="gpe-tab' + (fiche.tab === 'ech' ? ' on' : '') + '" data-tab="ech">Échéancier</button><button class="gpe-tab' + (fiche.tab === 'his' ? ' on' : '') + '" data-tab="his">Historique (' + groups.length + ')</button></div>' +
      (fiche.tab === 'ech' ? ech : hist);
  }
  function openFiche(key) {
    injectStyle(); const d = db(), c = activeContracts(d).find(x => cid(x) === key); if (!c) return;
    fiche.key = key; fiche.tab = 'ech';
    openDrawer(c.locataire || 'Locataire', esc(c.bien || c.locative || '') + ' · Fiche de compte', '',
      '<button class="gpe-btn" data-close>Fermer</button><button class="gpe-btn" data-statement="' + esc(key) + '"><span class="material-symbols-rounded">description</span>Relevé PDF</button><button class="gpe-btn pri" data-pay="' + esc(key) + '"><span class="material-symbols-rounded">add_card</span>Encaisser</button>');
    paintFiche();
  }

  /* ───────── documents PDF : reçu, quittance, relevé ───────── */
  function pdfEscape(v) { return esc(v == null ? '' : v); }
  const PDF_FONT = "font-family:'Inter','Helvetica Neue',Arial,sans-serif;";
  function pdfAgencyBlock(ag) {
    const contact = [ag.adresse, ag.tel, ag.email].filter(Boolean).map(pdfEscape).join(' · ');
    const legal = (ag.rccm ? 'RCCM ' + pdfEscape(ag.rccm) : '') + (ag.rccm && ag.ninea ? '<br>' : '') + (ag.ninea ? 'NINEA ' + pdfEscape(ag.ninea) : '');
    return '<div style="display:flex;align-items:center;gap:22px;padding-bottom:16px;margin-bottom:22px;border-bottom:3px solid #D4AF37">' +
      (ag.logo ? '<div style="flex:none;width:130px;height:110px;display:flex;align-items:center;justify-content:center"><img src="' + pdfEscape(ag.logo) + '" style="max-width:130px;max-height:110px;width:auto;height:auto;object-fit:contain"></div>' : '') +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-size:12px;font-weight:800;line-height:1.4;text-transform:uppercase;letter-spacing:.2px;color:#111">' + pdfEscape(ag.agence) + '</div>' +
        '<div style="font-size:8.5px;font-weight:700;letter-spacing:1.6px;color:#9a7b14;margin-top:5px">GESTION LOCATIVE</div>' +
        (contact ? '<div style="font-size:8.5px;color:#666;margin-top:4px;line-height:1.5">' + contact + '</div>' : '') +
      '</div>' +
      (legal ? '<div style="flex:none;text-align:right;font-size:8px;line-height:1.6;color:#666;white-space:nowrap">' + legal + '</div>' : '') +
    '</div>';
  }
  const PDF_TD = 'padding:8px 10px;border-bottom:1px solid #eceff3;font-size:10px;color:#222';
  const PDF_TH = 'padding:8px 10px;font-size:8px;font-weight:700;letter-spacing:.8px;text-transform:uppercase';
  const pdfInfo = (label, value) => '<div style="background:#fafaf7;border-left:3px solid #D4AF37;border-radius:4px;padding:8px 12px"><div style="font-size:7.5px;letter-spacing:.8px;color:#8a8a8a;text-transform:uppercase;font-weight:700">' + label + '</div><div style="font-size:10.5px;font-weight:700;margin-top:3px;color:#111">' + value + '</div></div>';
  const pdfKpi = (label, value, color) => '<div style="padding:10px 12px;background:#fafaf7;border-radius:6px"><div style="font-size:7.5px;letter-spacing:.8px;color:#8a8a8a;text-transform:uppercase;font-weight:700">' + label + '</div><div style="font-size:13px;font-weight:800;margin-top:3px;color:' + (color || '#111') + '">' + value + '</div></div>';
  const pdfFooter = txt => '<div style="margin-top:26px;border-top:1px solid #eee;padding-top:10px;text-align:center;font-size:8px;color:#8a8a8a;line-height:1.5">' + txt + '</div>';
  /** Génère le PDF en Blob puis déclenche le téléchargement ; garde un lien de secours
   *  (certains navigateurs / WebView bloquent le téléchargement automatique). */
  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(() => a.remove(), 0);
    const old = $('gpePdfFallback'); old && old.remove();
    const bar = document.createElement('div'); bar.id = 'gpePdfFallback';
    bar.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:10001;background:#111827;color:#fff;border-radius:12px;padding:10px 14px;font:700 12px Inter,Arial,sans-serif;display:flex;gap:12px;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.3)';
    bar.innerHTML = '<span>PDF prêt : ' + esc(filename) + '</span><a href="' + url + '" target="_blank" rel="noopener" download="' + esc(filename) + '" style="color:#D4AF37;text-decoration:underline">Ouvrir / télécharger</a><button type="button" style="background:none;border:0;color:#9ca3af;cursor:pointer;font-size:16px" aria-label="Fermer">×</button>';
    document.body.appendChild(bar);
    const close = () => { bar.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); };
    bar.querySelector('button').onclick = close; setTimeout(close, 20000);
  }
  async function pdfDownload(html, filename) {
    const box = document.createElement('div');
    /* Sur l'écran (invisible) : un conteneur hors-écran donne parfois un PDF blanc. */
    box.style.cssText = 'position:fixed;left:0;top:0;width:794px;background:#fff;z-index:-1;opacity:0;pointer-events:none';
    box.innerHTML = html; document.body.appendChild(box);
    const el = box.firstElementChild;
    try {
      if (window.ensureHtml2Pdf) await window.ensureHtml2Pdf();
      const lib = window.__html2pdfReal || window.html2pdf;
      if (typeof lib !== 'function') throw new Error('html2pdf indisponible');
      if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (_) {} }
      /* attendre le chargement du logo éventuel */
      await Promise.all(Array.from(el.querySelectorAll('img')).map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
      const worker = lib().set({
        margin: 0, filename, image: { type: 'jpeg', quality: .98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#fff', logging: false, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css'], avoid: 'tr' }
      }).from(el);
      const blob = await worker.outputPdf('blob');
      if (!blob || blob.size < 1500) throw new Error('PDF vide (' + (blob ? blob.size : 0) + ' octets)');
      triggerDownload(blob, filename);
      notify('PDF généré ✓ — ' + filename);
    } catch (err) {
      console.error('[Encaissements] PDF', err);
      notify('Erreur génération PDF : ' + (err && err.message ? err.message : 'inconnue'), 'err');
    } finally { box.remove(); }
  }
  function paymentGroup(d, recuNo) { return (d.paiements || []).filter(p => p.recuNo === recuNo); }
  function generateReceiptPDF(recuNo) {
    const d = db(), rows = paymentGroup(d, recuNo); if (!rows.length) return notify('Reçu introuvable', 'err');
    const ag = agencyInfo(), first = rows[0], c = activeContracts(d).find(x => belongs(first, x)), loc = findLoc(d, c || {}) || {};
    const total = rows.reduce((s,p) => s + num(p.paye), 0);
    const byPeriod = {};
    rows.forEach(p => { const k = p.periode || '—'; byPeriod[k] = (byPeriod[k] || 0) + num(p.paye); });
    const detail = Object.keys(byPeriod).sort().map(k => {
      const due = c && validKey(k) ? monthlyDue(d,c) : rows.filter(p=>p.periode===k).reduce((s,p)=>s+num(p.montant),0);
      const allPaid = c && validKey(k) ? paidMap(d,c)[k] || 0 : byPeriod[k];
      const remain = Math.max(0, due - allPaid);
      return '<tr><td style="' + PDF_TD + '">' + pdfEscape(validKey(k) ? monthLabel(k) : k) + '</td><td style="' + PDF_TD + ';text-align:right">' + fmt(due) + '</td><td style="' + PDF_TD + ';text-align:right;font-weight:700">' + fmt(byPeriod[k]) + '</td><td style="' + PDF_TD + ';text-align:right">' + fmt(remain) + '</td></tr>';
    }).join('');
    const partial = rows.some(p => validKey(p.periode) && c && Math.max(0, monthlyDue(d,c) - (paidMap(d,c)[p.periode] || 0)) > 0);
    const html = '<div style="width:794px;box-sizing:border-box;padding:36px 40px;' + PDF_FONT + 'color:#111;background:#fff">' + pdfAgencyBlock(ag) +
      '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px"><div><div style="font-size:16px;font-weight:800;letter-spacing:.3px">Reçu de paiement</div><div style="font-size:9px;color:#777;margin-top:4px">Paiement enregistré le ' + pdfEscape(shortDate(parseD(first.date) || new Date())) + '</div></div><div style="text-align:right"><div style="font-size:7.5px;letter-spacing:.8px;color:#8a8a8a;text-transform:uppercase;font-weight:700">N° de reçu</div><div style="font-size:13px;font-weight:800;color:#9a7b14;margin-top:3px">' + pdfEscape(recuNo) + '</div></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">' +
        pdfInfo('Locataire', pdfEscape(first.locataire)) +
        pdfInfo('Bien / location', pdfEscape(first.bien || first.locative || (c && (c.bien || c.locative)) || '—')) +
        pdfInfo('Mode de paiement', pdfEscape(first.mode || '—')) +
        pdfInfo('Référence', pdfEscape(first.ref || '—')) +
      '</div>' +
      '<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#111;color:#fff"><th style="' + PDF_TH + ';text-align:left">Période</th><th style="' + PDF_TH + ';text-align:right">Dû</th><th style="' + PDF_TH + ';text-align:right">Payé</th><th style="' + PDF_TH + ';text-align:right">Solde</th></tr></thead><tbody>' + detail + '</tbody></table>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding:11px 14px;background:#f6f4ea;border-radius:6px"><div style="font-size:9px;font-weight:700;letter-spacing:.8px">TOTAL REÇU</div><div style="font-size:15px;font-weight:800">' + fmt(total) + '</div></div>' +
      (partial ? '<div style="margin-top:10px;padding:8px 12px;border-radius:6px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-size:9px;font-weight:600">Paiement partiel : le solde restant indiqué dans le tableau reste dû.</div>' : '') +
      pdfFooter(pdfEscape(ag.agence) + (ag.adresse ? '<br>' + pdfEscape(ag.adresse) : '') + (ag.email ? ' · ' + pdfEscape(ag.email) : '')) + '</div>';
    pdfDownload(html, 'recu_' + String(recuNo).replace(/[^a-z0-9_-]/gi,'_') + '.pdf');
  }
  function generateReceiptPDFByIndex(idx) {
    const d = prepareRelations(db());
    const p = (d.paiements || [])[Number(idx)];
    if (!p) return notify('Paiement introuvable', 'err');
    if (!p.recuNo) {
      p.recuNo = nextRecu(d);
      p.recuAt = p.recuAt || new Date().toISOString();
      saveDb(d);
    }
    return generateReceiptPDF(p.recuNo);
  }

  function generateQuittancePDF(cKey, period) {
    const d = prepareRelations(db()), c = activeContracts(d).find(x => cid(x) === cKey || String(x.num || '') === String(cKey)); if (!c) return notify('Contrat introuvable', 'err');
    const qRows = contractPayments(d,c).filter(p => p.periode === period), due = monthlyDue(d,c), paid = qRows.reduce((s,p)=>s+num(p.paye),0); if (paid < due) return notify('La période n’est pas encore soldée', 'err');
    const qNo = qRows.find(p=>p.quittanceNo)?.quittanceNo || nextQuittance(d); qRows.forEach(p=>{p.quittanceNo=qNo;p.quittanceAt=p.quittanceAt||new Date().toISOString();}); saveDb(d);
    const ag=agencyInfo(), loc=findLoc(d,c)||{};
    const html='<div style="width:794px;box-sizing:border-box;padding:44px;font-family:Arial,sans-serif;color:#111;background:#fff">'+pdfAgencyBlock(ag)+
      '<div style="text-align:center;margin:20px 0 28px"><div style="font-size:27px;font-weight:900">Quittance de loyer</div><div style="font-size:11px;color:#777;margin-top:5px">N° '+pdfEscape(qNo)+'</div></div>'+
      '<div style="font-size:12px;line-height:1.7;margin-bottom:20px">Nous soussignés <strong>'+pdfEscape(ag.agence)+'</strong>, attestons avoir reçu de <strong>'+pdfEscape(c.locataire)+'</strong> la somme de <strong>'+fmt(paid)+'</strong> au titre du loyer et des charges de <strong>'+pdfEscape(monthLabel(period))+'</strong>, pour le bien <strong>'+pdfEscape(c.bien||c.locative||loc.bien||'—')+'</strong>.</div>'+
      '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px"><tr><td style="padding:11px;border:1px solid #eee;font-weight:800">Période</td><td style="padding:11px;border:1px solid #eee">'+pdfEscape(monthLabel(period))+'</td></tr><tr><td style="padding:11px;border:1px solid #eee;font-weight:800">Loyer + charges</td><td style="padding:11px;border:1px solid #eee;text-align:right;font-weight:900">'+fmt(due)+'</td></tr><tr><td style="padding:11px;border:1px solid #eee;font-weight:800">Montant réglé</td><td style="padding:11px;border:1px solid #eee;text-align:right;font-weight:900;color:#166534">'+fmt(paid)+'</td></tr><tr><td style="padding:11px;border:1px solid #eee;font-weight:800">Solde</td><td style="padding:11px;border:1px solid #eee;text-align:right;font-weight:900;color:#166534">0 FCFA</td></tr></table>'+
      '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:13px;font-size:11px;color:#166534;font-weight:800">Cette quittance confirme le règlement intégral de la période indiquée.</div>'+
      '<div style="margin-top:60px;display:grid;grid-template-columns:1fr 1fr;gap:50px;text-align:center;font-size:11px"><div><div style="height:45px;border-bottom:1px solid #999"></div><div style="margin-top:7px;font-weight:800">Agence</div></div><div><div style="height:45px;border-bottom:1px solid #999"></div><div style="margin-top:7px;font-weight:800">Locataire</div></div></div></div>';
    pdfDownload(html, 'quittance_' + String(qNo).replace(/[^a-z0-9_-]/gi,'_') + '.pdf');
  }
  function generateStatementPDF(cKey, type, anchor) {
    const d=db(), c=activeContracts(d).find(x=>cid(x)===cKey); if(!c) return notify('Contrat introuvable','err');
    const end = type==='annee' ? anchor+'-12' : type==='trimestre' ? addM(anchor,2) : anchor;
    const start = type==='annee' ? anchor+'-01' : type==='trimestre' ? anchor : anchor;
    const sch=schedule(d,c,end).filter(e=>e.k>=start && e.k<=end);
    const due=sch.reduce((s,e)=>s+e.due,0), paid=sch.reduce((s,e)=>s+e.paid,0), solde=sch.reduce((s,e)=>s+e.solde,0);
    let cumul = 0;
    const rows=sch.map(e=>{ cumul += Math.max(0, e.due - e.paid); return '<tr><td style="'+PDF_TD+'">'+pdfEscape(monthLabel(e.k))+'</td><td style="'+PDF_TD+';text-align:right">'+fmt(e.due)+'</td><td style="'+PDF_TD+';text-align:right">'+fmt(e.paid)+'</td><td style="'+PDF_TD+';text-align:right;font-weight:700">'+fmt(cumul)+'</td></tr>';}).join('');
    const ag=agencyInfo(); const periodLabel=type==='annee'?'Année '+anchor:type==='trimestre'?'Trimestre à partir de '+monthLabel(anchor):monthLabel(anchor);
    const html='<div style="width:794px;box-sizing:border-box;padding:36px 40px;'+PDF_FONT+'color:#111;background:#fff">'+pdfAgencyBlock(ag)+
      '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px"><div><div style="font-size:16px;font-weight:800;letter-spacing:.3px">Relevé de compte locataire</div><div style="font-size:9px;color:#777;margin-top:4px">'+pdfEscape(periodLabel)+'</div></div><div style="text-align:right;font-size:9.5px;line-height:1.5"><b style="font-size:10.5px">'+pdfEscape(c.locataire)+'</b><br><span style="color:#555">'+pdfEscape(c.bien||c.locative||'')+'</span></div></div>'+
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">'+pdfKpi('Total dû',fmt(due))+pdfKpi('Total payé',fmt(paid),'#166534')+pdfKpi('Solde',fmt(solde),solde?'#b45309':'#166534')+'</div>'+
      '<table style="width:100%;border-collapse:collapse"><thead><tr style="background:#111;color:#fff"><th style="'+PDF_TH+';text-align:left">Mois</th><th style="'+PDF_TH+';text-align:right">Dû</th><th style="'+PDF_TH+';text-align:right">Payé</th><th style="'+PDF_TH+';text-align:right">Solde cumulé</th></tr></thead><tbody>'+rows+'</tbody></table>'+
      '<div style="margin-top:14px;padding:9px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;font-size:9.5px;font-weight:700;color:#7c2d12">Total des arriérés / solde restant sur la période : '+fmt(solde)+'</div>'+
      pdfFooter('Relevé généré le '+pdfEscape(shortDate(new Date()))+' · '+pdfEscape(ag.agence))+'</div>';
    pdfDownload(html,'releve_'+String(c.locataire||'locataire').replace(/[^a-z0-9_-]/gi,'_')+'_'+type+'_'+anchor+'.pdf');
  }
  function openStatementDialog(key) {
    const d=db(), c=activeContracts(d).find(x=>cid(x)===key); if(!c) return;
    openDrawer('Relevé de compte', esc(c.locataire||'Locataire')+' · PDF', '<div class="gpe-report-box">Choisissez la période du relevé. Le document reprend mois par mois le dû, le payé et le solde.</div><div class="g2" style="margin-top:14px"><div class="fd"><label>Période</label><select id="gpeRepType"><option value="mois">Mois</option><option value="trimestre">Trimestre</option><option value="annee">Année</option></select></div><div class="fd"><label>Mois / année de départ</label><input id="gpeRepAnchor" type="month" value="'+nowKey()+'"></div></div>', '<button class="gpe-btn" data-close>Annuler</button><button class="gpe-btn pri" data-report="'+esc(key)+'"><span class="material-symbols-rounded">picture_as_pdf</span>Générer le relevé</button>');
  }
  function offerPaymentDocuments(result, edited) {
    const settled = result.settledPeriods || [];
    const rows = '<div class="gpe-docs"><h4>Documents du paiement</h4><div class="gpe-doc-row"><div><b>Reçu '+pdfEscape(result.recuNo)+'</b><small>Le paiement enregistré, avec le solde restant si partiel.</small></div><button class="gpe-btn sm pri" data-receipt="'+pdfEscape(result.recuNo)+'"><span class="material-symbols-rounded">download</span>Télécharger</button></div>' +
      (settled.length ? settled.map(x=>'<div class="gpe-doc-row"><div><b>Quittance · '+pdfEscape(monthLabel(x.periode))+'</b><small>'+pdfEscape(x.quittanceNo)+' · période soldée</small></div><button class="gpe-btn sm" data-quittance="'+pdfEscape(x.quittanceNo)+'" data-qcontract="'+pdfEscape(result.cKey || pay.key)+'" data-qperiod="'+pdfEscape(x.periode)+'">PDF</button></div>').join('') : '') + '</div>';
    openDrawer(edited ? 'Encaissement modifié' : 'Encaissement enregistré', 'Documents disponibles', '<div class="gpe-info"><div class="row"><span>Reçu</span><b>'+pdfEscape(result.recuNo)+'</b></div><div class="row"><span>Quittances émises</span><b>'+settled.length+'</b></div></div>'+rows, '<button class="gpe-btn" data-close>Fermer</button>');
    /* Pas de téléchargement automatique : les navigateurs le bloquent souvent. L'utilisateur clique sur « PDF ». */
  }

  /* ───────── événements (délégation) ───────── */
  function refreshAll() {
    render();
    try { if ($('gpeDrawer') && $('gpeBody') && fiche.key && $('gpeStart')) paintFiche(); } catch (_) {}
    try { typeof window.renderAvenir === 'function' && window.renderAvenir(); } catch (_) {}
    try { typeof window.updateSidebarBadges === 'function' && window.updateSidebarBadges(); } catch (_) {}
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-pay],[data-fiche],[data-filter],[data-mo],[data-export],[data-close],[data-save],[data-q],[data-tab],[data-statement],[data-report],[data-receipt],[data-quittance],[data-edit],[data-del]');
    if (!t) return;
    const inPage = t.closest('#page-paiements') || t.closest('#gpeDrawer');
    if (!inPage) return;
    if (t.hasAttribute('data-close')) return closeDrawer();
    if (t.hasAttribute('data-save')) return submitPay();
    if (t.hasAttribute('data-q')) { presetAmount(t.dataset.q); return payPreview(); }
    if (t.hasAttribute('data-tab')) { fiche.tab = t.dataset.tab; return paintFiche(); }
    if (t.hasAttribute('data-statement')) return openStatementDialog(t.dataset.statement);
    if (t.hasAttribute('data-report')) { const key=t.dataset.report, type=($('gpeRepType')||{}).value||'mois', anchor=($('gpeRepAnchor')||{}).value||nowKey(); closeDrawer(); return generateStatementPDF(key,type,anchor); }
    if (t.hasAttribute('data-edit')) return openEdit(t.dataset.edit);
    if (t.hasAttribute('data-del')) return deleteEncaissement(t.dataset.del);
    if (t.hasAttribute('data-receipt')) return generateReceiptPDF(t.dataset.receipt);
    if (t.hasAttribute('data-quittance')) return generateQuittancePDF(t.dataset.qcontract,t.dataset.qperiod);
    if (t.hasAttribute('data-filter')) { st.filter = t.dataset.filter; if (window.GPPagination) GPPagination.reset('encaissements'); return render(); }
    if (t.hasAttribute('data-mo')) { st.month = addM(st.month, +t.dataset.mo); if (window.GPPagination) GPPagination.reset('encaissements'); return render(); }
    if (t.hasAttribute('data-export')) return (window.exportExcel ? window.exportExcel('paiements') : window.exportListePDF && window.exportListePDF('paiements'));
    if (t.hasAttribute('data-fiche')) return openFiche(t.dataset.fiche);
    if (t.hasAttribute('data-pay')) return openPay(t.dataset.pay);
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'gpeSearch') { st.q = e.target.value; if (window.GPPagination) GPPagination.reset('encaissements'); paintTable(); }
    if (e.target.id === 'gpePayAmt') payPreview();
  });
  document.addEventListener('change', e => {
    if (e.target.id === 'gpePayC') { pay.key = e.target.value; presetAmount('oldest'); payContext(); payPreview(); }
    if (e.target.id === 'gpeStart') {
      const v = e.target.value; if (!validKey(v)) return;
      const d = db(), c = activeContracts(d).find(x => cid(x) === fiche.key); if (!c) return;
      c.suiviDepuis = v; saveDb(d).then(() => { refreshAll(); paintFiche(); notify('Début de suivi mis à jour ✓'); });
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('gpeDrawer')) closeDrawer(); });

  /* ───────── branchement sur l'app existante ───────── */
  const origOpen = window.openFinanceDrawer;
  window.openFinanceDrawer = function (kind, index) {
    if (kind === 'paiement' && !(Number.isInteger(index) && index >= 0)) return openPay('');
    return typeof origOpen === 'function' ? origOpen.apply(this, arguments) : undefined;
  };
  window.openPayModal = function () { return openPay(''); };
  window.renderPaiements = render;
  window.renderPaiementsFinal = render;
  if (window.GPNavigation && typeof window.GPNavigation.registerRenderer === 'function') window.GPNavigation.registerRenderer('paiements', render);

  window.genererRecuPaiementPDF = generateReceiptPDFByIndex;
  window.GPEncV2 = { render, migrate, schedule, allocate, saveEncaissement, deleteEncaissement, openEdit, openPay, openFiche, generateReceiptPDF, generateReceiptPDFByIndex, generateQuittancePDF, generateStatementPDF, _internals: { cid, monthlyDue, startKey, paidMap, nextRecu, nextQuittance, prepareRelations } };

  // Si la page Encaissements est déjà affichée au chargement, on remplace l'ancien rendu.
  const pg = $('page-paiements');
  if (pg && pg.classList.contains('active')) setTimeout(render, 0);
})();
