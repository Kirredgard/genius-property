/* Genius Property — Situation propriétaires
 * Par mois : à encaisser / encaissé / reste, commission agence, dépenses facturables,
 * net à reverser au propriétaire, suivi des reversements. Hiérarchie Propriétaire → Bien → Locataire.
 * Données ajoutées (aucune clé existante modifiée) :
 *   proprietaires[].commissionTaux (%), biens[].commissionTaux (% — surcharge, vide = taux du propriétaire),
 *   reversements[] { id, proprietaireId, periode, montant, date, mode }
 * Règles : commission = taux × loyers ENCAISSÉS du mois ; dépenses déduites = type "bien" et facturable ≠ "non".
 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => { if (typeof v === 'number') return isFinite(v) ? v : 0; const n = Number(String(v ?? '').replace(/\s/g, '').replace(',', '.').replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
  const fmt = n => Math.round(n).toLocaleString('fr-FR') + ' F';
  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
  const pad = n => String(n).padStart(2, '0');
  const keyOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1);
  const addM = (k, n) => { const [y, m] = k.split('-').map(Number); return keyOf(new Date(y, m - 1 + n, 1)); };
  const monthLabel = k => { const [y, m] = k.split('-').map(Number); const s = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); };
  const db = () => (window.GPDB && GPDB.load ? GPDB.load() : (window.DB || {}));
  const save = async d => { if (window.GPDB && GPDB.save) return GPDB.save(d); window.DB = d; return typeof window.saveDB === 'function' ? window.saveDB() : true; };
  const notify = (m, t) => (typeof window.toast === 'function' ? window.toast(m, t) : console.log(m));
  const ownerName = o => [o.prenom, o.nom].filter(Boolean).join(' ') || o.nom || o.name || '—';
  const bienName = b => b.nom || b.adresse || b.libelle || '';
  const st = { month: keyOf(new Date()), mode: 'month', year: new Date().getFullYear(), from: '', to: '', arrears: false, open: {}, q: '' };

  /* Période affichée : 'month' (1 mois), 'range' (de … à …), 'year' (année, plafonnée au mois en cours). */
  function range() {
    if (st.mode === 'year') {
      const y = st.year, cur = keyOf(new Date()); let to = y + '-12';
      const capped = to > cur && (y + '-01') <= cur; if (capped) to = cur;
      return { from: y + '-01', to, single: false, label: 'Année ' + y + (capped ? ' (jusqu’à ' + monthLabel(cur) + ')' : '') };
    }
    if (st.mode === 'range') {
      let f = st.from || st.month, t = st.to || st.month; if (f > t) { const x = f; f = t; t = x; }
      return { from: f, to: t, single: f === t, label: f === t ? monthLabel(f) : monthLabel(f) + ' → ' + monthLabel(t) };
    }
    return { from: st.month, to: st.month, single: true, label: monthLabel(st.month) };
  }

  function parseD(v) { if (!v) return null; const s = String(v).trim(); let m = s.match(/^(\d{4})-(\d{2})/); if (m) return m[1] + '-' + m[2]; m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/); return m ? m[3] + '-' + pad(m[2]) : ''; }

  function compute(d, from, to, withArrears) {
    to = to || from; withArrears = withArrears === undefined ? true : !!withArrears;
    try { window.GPRelationsV52 && GPRelationsV52.ensure(d); } catch (_) {}
    const enc = window.GPEncV2;
    const owners = (d.proprietaires || []).map(o => ({ o, id: String(o.id), nom: ownerName(o), taux: o.commissionTaux === '' || o.commissionTaux == null ? null : num(o.commissionTaux), biens: [], dep: 0, depAutres: [] }));
    const byOwner = {}; owners.forEach(x => { byOwner[x.id] = x; });
    const orphan = { o: {}, id: '', nom: 'Sans propriétaire', taux: null, biens: [], dep: 0, depAutres: [] };
    const biens = (d.biens || []).map(b => {
      const ow = byOwner[String(b.proprietaireId || b.proprioId || b.ownerId || '')] || owners.find(x => norm(x.nom) === norm(b.proprio || b.proprietaire || b.owner)) || orphan;
      const row = { b, id: String(b.id), nom: bienName(b), tauxBien: b.commissionTaux === '' || b.commissionTaux == null ? null : num(b.commissionTaux), ow, due: 0, arrears: 0, paid: 0, soldeP: 0, lignes: [], dep: 0, depLignes: [] };
      ow.biens.push(row); return row;
    });
    const findBien = c => biens.find(r => c.bienId && r.id === String(c.bienId)) || biens.find(r => { const n = norm(c.bien || c.locative); const bn = norm(r.nom); return n && bn && (n === bn || n.startsWith(bn + ' -') || n.startsWith(bn + ' ')); }) || null;
    if (enc) (d.contrats || []).filter(c => norm(c.statut) === 'actif').forEach(c => {
      const sch = enc.schedule(d, c, to), inR = sch.filter(e => e.k >= from && e.k <= to); if (!inR.length) return;
      const arrears = sch.filter(e => e.k < from).reduce((s, e) => s + e.solde, 0);
      const cur = { due: sum(inR, 'due'), paid: sum(inR, 'paid'), solde: sum(inR, 'solde') };
      const r = findBien(c) || (orphan.biens.length ? orphan.biens[0] : (orphan.biens.push({ b: {}, id: '', nom: 'Non rattaché à un bien', tauxBien: null, ow: orphan, due: 0, arrears: 0, paid: 0, soldeP: 0, lignes: [], dep: 0, depLignes: [] }), orphan.biens[0]));
      r.due += cur.due; r.paid += cur.paid; r.arrears += arrears; r.soldeP += cur.solde;
      r.lignes.push({ loc: c.locataire || '—', unite: c.locative || c.bien || '', due: cur.due, paid: cur.paid, solde: cur.solde, arrears });
    });
    (d.depenses || []).forEach(x => {
      const pm = parseD(x.date); if (!pm || pm < from || pm > to) return;
      if (norm(x.type) === 'agence' || norm(x.type) === 'depense agence' || norm(x.facturable) === 'non') return;
      const n = norm(x.bien), m = num(x.montant);
      /* 1) par identifiant du bien (fiable, insensible aux renommages) ; 2) à défaut par nom (anciennes dépenses). */
      const r = (x.bienId && biens.find(r => r.id !== '' && r.id === String(x.bienId))) ||
        (n && biens.find(r => { const bn = norm(r.nom); return bn && (n === bn || n.startsWith(bn + ' -') || n.startsWith(bn + ' ')); }));
      if (r) { r.dep += m; r.depLignes.push({ lib: x.libelle || x.titre || 'Dépense', m, date: x.date }); return; }
      const ow = (x.proprietaireId && owners.find(o => o.id === String(x.proprietaireId))) || owners.find(o => norm(o.nom) === norm(x.proprietaire)) || orphan; ow.dep += m; ow.depAutres.push({ lib: x.libelle || 'Dépense', m });
    });
    const all = owners.concat(orphan.biens.length || orphan.dep ? [orphan] : []);
    all.forEach(ow => {
      ow.biens.forEach(r => {
        const t = r.tauxBien != null ? r.tauxBien : (ow.taux != null ? ow.taux : 0);
        r.taux = t; r.tauxHerite = r.tauxBien == null; r.reste = r.soldeP + (withArrears ? r.arrears : 0); r.aEnc = r.due + (withArrears ? r.arrears : 0);
        r.commission = Math.round(r.paid * t / 100);
        r.net = r.paid - r.commission - r.dep;
      });
      ow.due = sum(ow.biens, 'due'); ow.arrears = sum(ow.biens, 'arrears'); ow.paid = sum(ow.biens, 'paid'); ow.reste = sum(ow.biens, 'reste'); ow.aEnc = sum(ow.biens, 'aEnc');
      ow.commission = sum(ow.biens, 'commission'); ow.depTotal = sum(ow.biens, 'dep') + ow.dep;
      ow.net = ow.paid - ow.commission - ow.depTotal;
      ow.reverse = (d.reversements || []).filter(v => String(v.proprietaireId) === ow.id && v.periode >= from && v.periode <= to).reduce((s, v) => s + num(v.montant), 0);
      ow.aReverser = Math.max(0, ow.net - ow.reverse);
    });
    return all;
  }
  function sum(a, k) { return a.reduce((s, x) => s + (x[k] || 0), 0); }

  function periodBar(rg) {
    const seg = (m, l) => '<button class="gps-btn seg' + (st.mode === m ? ' on' : '') + '" data-mode="' + m + '">' + l + '</button>';
    let nav;
    if (st.mode === 'range') nav = '<label class="gps-chk">De <input type="month" id="gpsFrom" value="' + esc(rg.from) + '"></label><label class="gps-chk">à <input type="month" id="gpsTo" value="' + esc(rg.to) + '"></label>';
    else nav = '<button class="gps-btn" data-mo="-1">‹</button><b>' + (st.mode === 'year' ? esc(rg.label) : monthLabel(st.month)) + '</b><button class="gps-btn" data-mo="1">›</button>';
    return '<span class="gps-seg">' + seg('month', 'Mois') + seg('range', 'Période') + seg('year', 'Année') + '</span>' + nav +
      '<label class="gps-chk"><input type="checkbox" id="gpsArr"' + (st.arrears ? ' checked' : '') + '> Inclure les arriérés antérieurs</label>';
  }

  function render() {
    const page = $('page-situation'); if (!page) return;
    const d = db(), rg = range(), all = compute(d, rg.from, rg.to, st.arrears), q = norm(st.q);
    const rows = all.filter(o => !q || norm(o.nom).includes(q) || o.biens.some(r => norm(r.nom).includes(q)));
    const T = k => sum(all, k);
    const card = (l, v, cls, sub) => '<div class="gps-card"><small>' + l + '</small><strong class="' + (cls || '') + '">' + fmt(v) + '</strong>' + (sub ? '<em>' + sub + '</em>' : '') + '</div>';
    const noTaux = all.some(o => o.biens.length && o.taux == null && o.biens.some(r => r.tauxBien == null));
    page.innerHTML = '<style>' + css() + '</style><div class="gps">' +
      '<div class="gps-top"><div></div>' +
      '<div class="gps-actions">' + periodBar(rg) + '<button class="gps-btn" data-export>Exporter CSV</button></div></div>' +
      '<div class="gps-cards">' + card(st.arrears ? 'À encaisser (loyer + arriérés)' : 'À encaisser (période)', T('aEnc')) + card('Encaissé', T('paid'), 'g') + card('Reste à encaisser', T('reste'), 'o') +
      card('Arriérés antérieurs', T('arrears'), 'o', st.arrears ? 'inclus dans le reste' : 'avant la période — non inclus') +
      card('Ma commission', T('commission'), 'b', 'sur le loyer encaissé') + actCard(rg, T('commission')) + card('Dépenses déduites', T('depTotal'), 'r2', 'facturables aux propriétaires') + card('À reverser aux propriétaires', T('aReverser'), 'g', 'déjà reversé : ' + fmt(T('reverse'))) + '</div>' +
      (noTaux ? '<div class="gps-banner">Certains propriétaires n’ont pas de taux de commission (0 % appliqué). Renseignez-le dans la colonne « Taux ».</div>' : '') +
      '<input class="gps-search" id="gpsQ" placeholder="Rechercher un propriétaire ou un bien…" value="' + esc(st.q) + '">' +
      '<div class="gps-table"><table><thead><tr><th>Propriétaire / Bien</th><th>Taux %</th><th class="r">À encaisser</th><th class="r">Encaissé</th><th class="r">Reste</th><th class="r">Commission</th><th class="r">Dépenses</th><th class="r">À reverser</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.map(ownerHtml).join('') : '<tr><td colspan="9" class="gps-empty">Aucune donnée pour cette période</td></tr>') + '</tbody></table></div></div>';
    bind(page);
  }

  /* Carte « Revenus d'activités » (module activites-perso.js) + revenu global agence. */
  function actCard(rg, com) {
    try {
      if (!window.GPActivites || !(window.GPPermissions ? GPPermissions.has(null, 'activites:view') : true)) return '';
      const r = GPActivites.revenue(rg.from, rg.to);
      return '<div class="gps-card"><small>Revenus d’activités</small><strong class="g">' + fmt(r.total) + '</strong><em>marchés + autres revenus</em></div>' +
        '<div class="gps-card"><small>Revenu global agence</small><strong class="b">' + fmt(com + r.total) + '</strong><em>commission + activités</em></div>';
    } catch (_) { return ''; }
  }

  function ownerHtml(o) {
    const open = st.open[o.id || 'none'], single = range().single;
    let h = '<tr class="gps-owner"><td><button class="gps-tog" data-tog="' + esc(o.id || 'none') + '">' + (open ? '▾' : '▸') + '</button><b>' + esc(o.nom) + '</b><span class="gps-sub">' + o.biens.length + ' bien(s)</span></td>' +
      '<td>' + (o.id ? '<input class="gps-taux" type="number" min="0" max="100" step="0.5" data-ot="' + esc(o.id) + '" value="' + (o.taux == null ? '' : o.taux) + '" placeholder="0">' : '—') + '</td>' +
      '<td class="r">' + fmt(o.aEnc) + '</td><td class="r g">' + fmt(o.paid) + '</td><td class="r o">' + fmt(o.reste) + (!st.arrears && o.arrears > 0 ? '<span class="gps-sub">+ ' + fmt(o.arrears) + ' arriérés</span>' : '') + '</td><td class="r b">' + fmt(o.commission) + '</td><td class="r r2">' + fmt(o.depTotal) + '</td>' +
      '<td class="r ' + (o.net < 0 ? 'neg' : 'g') + '"><b>' + fmt(o.net) + '</b>' + (o.reverse ? '<span class="gps-sub">reversé ' + fmt(o.reverse) + ' · reste ' + fmt(o.aReverser) + '</span>' : '') + '</td>' +
      '<td class="r">' + (o.id && single && o.aReverser > 0 ? '<button class="gps-btn pri" data-rev="' + esc(o.id) + '" data-amt="' + o.aReverser + '">' + (o.reverse > 0 ? 'Reverser le reste' : 'Reverser') + '</button>' : '') + (o.id && o.net > 0 && o.aReverser <= 0 ? '<span class="gps-ok">✓ Reversé</span> <button class="gps-btn pri" data-bilan="' + esc(o.id) + '" title="Facture / bilan à remettre au propriétaire">🧾 Facture</button>' : '') + (o.id ? ' <button class="gps-btn" data-rel="' + esc(o.id) + '" title="Relevé à imprimer">🖨</button>' : '') + '</td></tr>';
    if (open) {
      h += o.biens.map(r => '<tr class="gps-bien"><td>' + esc(r.nom) + '</td><td>' + (r.b && r.b.id ? '<input class="gps-taux" type="number" min="0" max="100" step="0.5" data-bt="' + esc(r.id) + '" value="' + (r.tauxBien == null ? '' : r.tauxBien) + '" placeholder="' + r.taux + (r.tauxHerite ? ' (hérité)' : '') + '">' : '—') + '</td>' +
        '<td class="r">' + fmt(r.aEnc) + '</td><td class="r g">' + fmt(r.paid) + '</td><td class="r o">' + fmt(r.reste) + (!st.arrears && r.arrears > 0 ? '<span class="gps-sub">+ ' + fmt(r.arrears) + ' arriérés</span>' : '') + '</td><td class="r b">' + fmt(r.commission) + '</td><td class="r r2">' + fmt(r.dep) + '</td><td class="r ' + (r.net < 0 ? 'neg' : '') + '">' + fmt(r.net) + '</td><td></td></tr>' +
        r.lignes.map(l => '<tr class="gps-loc"><td>↳ ' + esc(l.loc) + ' <span class="gps-sub">' + esc(l.unite) + '</span></td><td></td><td class="r">' + fmt(l.due) + '</td><td class="r">' + fmt(l.paid) + '</td><td class="r">' + fmt(l.solde) + (!st.arrears && l.arrears > 0 ? '<span class="gps-sub">+ ' + fmt(l.arrears) + ' arriérés</span>' : '') + '</td><td colspan="4"></td></tr>').join('') +
        r.depLignes.map(x => '<tr class="gps-loc"><td>↳ Dépense : ' + esc(x.lib) + '</td><td colspan="5"></td><td class="r r2">' + fmt(x.m) + '</td><td colspan="2"></td></tr>').join('')).join('') +
        o.depAutres.map(x => '<tr class="gps-loc"><td>↳ Dépense (sans bien) : ' + esc(x.lib) + '</td><td colspan="5"></td><td class="r r2">' + fmt(x.m) + '</td><td colspan="2"></td></tr>').join('');
    }
    return h;
  }

  function bind(page) {
    page.onclick = async e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.mo) { if (st.mode === 'year') st.year += +t.dataset.mo; else st.month = addM(st.month, +t.dataset.mo); return render(); }
      if (t.dataset.mode) {
        st.mode = t.dataset.mode;
        if (st.mode === 'year') st.year = +st.month.slice(0, 4);
        if (st.mode === 'range' && (!st.from || !st.to)) { st.from = addM(st.month, -2); st.to = st.month; }
        return render();
      }
      if (t.dataset.tog) { st.open[t.dataset.tog] = !st.open[t.dataset.tog]; return render(); }
      if (t.hasAttribute('data-export')) return exportCsv();
      if (t.dataset.rel) return printRelevé(t.dataset.rel);
      if (t.dataset.bilan) return printBilan(t.dataset.bilan);
      if (t.dataset.rev) {
        const rg = range(), d = db(), o = (d.proprietaires || []).find(x => String(x.id) === t.dataset.rev);
        const dispo = Math.round(+t.dataset.amt);
        const res = await askPayout(ownerName(o || {}), monthLabel(rg.from), dispo); if (!res) return;
        d.reversements = d.reversements || [];
        d.reversements.unshift({ id: 'RV-' + Date.now().toString(36), proprietaireId: t.dataset.rev, periode: rg.from, montant: res.montant, date: res.date, mode: res.mode, note: res.note || '' });
        await save(d);
        const reste = dispo - res.montant;
        notify(reste > 0 ? 'Reversement partiel enregistré ✓ — reste ' + fmt(reste) : 'Reversement total enregistré ✓ — vous pouvez éditer la facture');
        render();
      }
    };
    page.onchange = async e => {
      const i = e.target; if (i.id === 'gpsQ') return;
      if (i.id === 'gpsFrom' || i.id === 'gpsTo') { if (/^\d{4}-\d{2}$/.test(i.value)) st[i.id === 'gpsFrom' ? 'from' : 'to'] = i.value; return render(); }
      if (i.id === 'gpsArr') { st.arrears = i.checked; return render(); }
      if (!i.dataset.ot && !i.dataset.bt) return;
      const d = db(), v = i.value === '' ? '' : Math.min(100, Math.max(0, num(i.value)));
      const x = i.dataset.ot ? (d.proprietaires || []).find(o => String(o.id) === i.dataset.ot) : (d.biens || []).find(b => String(b.id) === i.dataset.bt);
      if (!x) return; x.commissionTaux = v; await save(d); notify('Taux enregistré ✓'); render();
    };
    const q = $('gpsQ'); if (q) q.oninput = () => { st.q = q.value; const pos = q.selectionStart; render(); const n = $('gpsQ'); n.focus(); n.setSelectionRange(pos, pos); };
  }

  function lines(all) {
    const L = [['Propriétaire', 'Bien', 'Taux %', 'À encaisser', 'Encaissé', 'Reste', 'Commission', 'Dépenses', 'À reverser']];
    all.forEach(o => { L.push([o.nom, 'TOTAL', o.taux == null ? '' : o.taux, o.aEnc, o.paid, o.reste, o.commission, o.depTotal, o.net]);
      o.biens.forEach(r => L.push([o.nom, r.nom, r.taux, r.aEnc, r.paid, r.reste, r.commission, r.dep, r.net])); });
    return L;
  }
  function exportCsv() {
    const csv = '\ufeff' + lines(compute(db(), range().from, range().to, st.arrears)).map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'situation-proprietaires-' + (range().from === range().to ? range().from : range().from + '_' + range().to) + '.csv'; a.click();
  }
  function printRelevé(id) {
    const rg = range(), o = compute(db(), rg.from, rg.to, st.arrears).find(x => x.id === id); if (!o) return;
    const w = window.open('', '_blank'); if (!w) return notify('Autorisez les pop-ups pour imprimer', 'err');
    w.document.write('<html><head><title>Relevé ' + esc(o.nom) + '</title><style>body{font:13px Arial;padding:30px}table{border-collapse:collapse;width:100%;margin:14px 0}td,th{border:1px solid #ccc;padding:6px 8px;text-align:right}td:first-child,th:first-child{text-align:left}</style></head><body><h2>Relevé propriétaire — ' + esc(o.nom) + '</h2><p>' + rg.label + '</p><table><tr><th>Bien</th><th>Encaissé</th><th>Commission</th><th>Dépenses</th><th>Net</th></tr>' +
      o.biens.map(r => '<tr><td>' + esc(r.nom) + '</td><td>' + fmt(r.paid) + '</td><td>' + fmt(r.commission) + '</td><td>' + fmt(r.dep) + '</td><td>' + fmt(r.net) + '</td></tr>').join('') +
      '<tr><th>TOTAL</th><th>' + fmt(o.paid) + '</th><th>' + fmt(o.commission) + '</th><th>' + fmt(o.depTotal) + '</th><th>' + fmt(o.net) + '</th></tr></table><h3>Montant à reverser : ' + fmt(o.net) + '</h3><script>setTimeout(function(){print()},300)<\/script></body></html>');
    w.document.close();
  }

  /* ── Fenêtre de reversement : montant libre (≤ disponible) ou total ── */
  function askPayout(nom, periode, dispo) {
    return new Promise(resolve => {
      const ov = document.createElement('div'); ov.className = 'gps-ov';
      ov.innerHTML = '<style>.gps-ov{position:fixed;inset:0;background:rgba(17,24,39,.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px}.gps-md{background:#fff;border-radius:14px;padding:20px;width:100%;max-width:420px;font:13px Arial,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,.25)}.gps-md h3{margin:0 0 4px;font-size:17px}.gps-md p{margin:0 0 12px;color:#6b7280}.gps-md label{display:block;font-weight:700;font-size:11px;color:#374151;margin:10px 0 4px}.gps-md input,.gps-md select{width:100%;box-sizing:border-box;height:38px;border:1px solid #e5e7eb;border-radius:8px;padding:0 10px;font-size:14px}.gps-dispo{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px;color:#166534;font-weight:700}.gps-q{display:flex;gap:8px;margin-top:8px}.gps-q button{flex:1}.gps-err{color:#dc2626;font-size:12px;min-height:16px;margin-top:6px}.gps-foot{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}.gps-md .gps-btn{padding:8px 14px}.gps-md .gps-btn.pri{background:#111827;color:#fff;border-color:#111827}</style>' +
        '<div class="gps-md"><h3>Reversement</h3><p>' + esc(nom) + ' · ' + esc(periode) + '</p>' +
        '<div class="gps-dispo">Disponible à reverser : ' + fmt(dispo) + '</div>' +
        '<div class="gps-q"><button type="button" class="gps-btn pri" id="gpmTot">Reverser le total</button><button type="button" class="gps-btn" id="gpmPart">Montant partiel</button></div>' +
        '<label>Montant à reverser (FCFA)</label><input id="gpmAmt" type="number" min="1" max="' + dispo + '" step="1" value="' + dispo + '">' +
        '<label>Mode de paiement</label><select id="gpmMode"><option>Espèces</option><option>Virement</option><option>Wave</option><option>Orange Money</option><option>Chèque</option></select>' +
        '<label>Date</label><input id="gpmDate" type="date" value="' + new Date().toISOString().slice(0, 10) + '">' +
        '<label>Note (facultatif)</label><input id="gpmNote" type="text" placeholder="Ex : acompte, solde…">' +
        '<div class="gps-err" id="gpmErr"></div><div class="gps-foot"><button type="button" class="gps-btn" id="gpmNo">Annuler</button><button type="button" class="gps-btn pri" id="gpmOk">Confirmer</button></div></div>';
      document.body.appendChild(ov);
      const g = id => ov.querySelector('#' + id), amt = g('gpmAmt'), done = v => { ov.remove(); resolve(v); };
      g('gpmTot').onclick = () => { amt.value = dispo; g('gpmErr').textContent = ''; };
      g('gpmPart').onclick = () => { amt.value = ''; amt.focus(); };
      g('gpmNo').onclick = () => done(null);
      ov.addEventListener('mousedown', e => { if (e.target === ov) done(null); });
      g('gpmOk').onclick = () => {
        const m = Math.round(num(amt.value));
        if (!(m > 0)) { g('gpmErr').textContent = 'Saisissez un montant supérieur à 0.'; return; }
        if (m > dispo) { g('gpmErr').textContent = 'Le montant dépasse le disponible (' + fmt(dispo) + ').'; return; }
        done({ montant: m, mode: g('gpmMode').value, date: g('gpmDate').value || new Date().toISOString().slice(0, 10), note: g('gpmNote').value.trim() });
      };
      amt.focus(); amt.select();
    });
  }

  const LS = k => { try { return localStorage.getItem(k) || ''; } catch (_) { return ''; } };
  const dFr = v => { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '/' + m[2] + '/' + m[1] : esc(v || ''); };

  /* ── Facture / bilan à remettre au propriétaire (état du mois ou de la période) ── */
  function printBilan(id) {
    const d = db(), rg = range(), o = compute(d, rg.from, rg.to, false).find(x => x.id === id); if (!o) return;
    const w = window.open('', '_blank'); if (!w) return notify('Autorisez les pop-ups pour imprimer', 'err');
    const ag = { nom: LS('geniusproperty_agence') || 'Agence', adresse: LS('geniusproperty_adresse'), tel: LS('geniusproperty_tel'), email: LS('geniusproperty_email'), rccm: LS('geniusproperty_rccm'), ninea: LS('geniusproperty_ninea'), logo: LS('geniusproperty_logo') };
    const revs = (d.reversements || []).filter(v => String(v.proprietaireId) === id && v.periode >= rg.from && v.periode <= rg.to).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const totalVerse = revs.reduce((s, v) => s + num(v.montant), 0), solde = o.net - totalVerse;
    const numero = 'BIL-' + rg.from.replace('-', '') + (rg.single ? '' : '-' + rg.to.replace('-', '')) + '-' + String(id).slice(-4).toUpperCase();
    const tenants = [], deps = [];
    o.biens.forEach(r => { r.lignes.forEach(l => tenants.push({ bien: r.nom, loc: l.loc, due: l.due, paid: l.paid, solde: l.solde })); r.depLignes.forEach(x => deps.push({ bien: r.nom, lib: x.lib, date: x.date, m: x.m })); });
    o.depAutres.forEach(x => deps.push({ bien: '—', lib: x.lib, date: '', m: x.m }));
    const row = (a, cls) => '<tr' + (cls ? ' class="' + cls + '"' : '') + '>' + a.map((c, i) => '<td' + (i ? ' class="r"' : '') + '>' + c + '</td>').join('') + '</tr>';
    const html = '<html><head><meta charset="utf-8"><title>' + esc(numero) + '</title><style>' +
      '@page{margin:14mm}body{font:12.5px Arial,sans-serif;color:#111827;padding:26px;max-width:820px;margin:auto}h1{font-size:20px;margin:0}h2{font-size:14px;margin:22px 0 6px;border-bottom:2px solid #111827;padding-bottom:4px}' +
      '.hd{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.hd img{max-height:60px;margin-bottom:6px}.mut{color:#6b7280;font-size:11.5px;line-height:1.5}.box{border:1px solid #d1d5db;border-radius:8px;padding:10px 12px;min-width:230px}' +
      'table{border-collapse:collapse;width:100%;margin-top:6px}th{background:#f3f4f6;font-size:11px;text-align:left;padding:6px 8px;border:1px solid #d1d5db}td{padding:6px 8px;border:1px solid #e5e7eb}.r{text-align:right}th.r{text-align:right}' +
      '.tot td{font-weight:700;background:#f9fafb}.big td{font-size:14px;font-weight:800;background:#ecfdf5}.neg{color:#dc2626}.sig{display:flex;justify-content:space-between;margin-top:46px}.sig div{width:44%;border-top:1px solid #111827;padding-top:6px;text-align:center;font-size:11.5px}' +
      '.stamp{display:inline-block;border:2px solid #16a34a;color:#16a34a;font-weight:800;padding:3px 10px;border-radius:6px;transform:rotate(-4deg)}' +
      '</style></head><body>' +
      '<div class="hd"><div>' + (ag.logo ? '<img src="' + esc(ag.logo) + '" alt="">' : '') + '<h1>' + esc(ag.nom) + '</h1><div class="mut">' + [ag.adresse, ag.tel && 'Tél : ' + ag.tel, ag.email, ag.rccm && 'RCCM : ' + ag.rccm, ag.ninea && 'NINEA : ' + ag.ninea].filter(Boolean).map(esc).join('<br>') + '</div></div>' +
      '<div class="box"><b style="font-size:15px">FACTURE / BILAN PROPRIÉTAIRE</b><div class="mut">N° ' + esc(numero) + '<br>Émis le ' + dFr(new Date().toISOString().slice(0, 10)) + '<br>Période : ' + esc(rg.label) + '</div></div></div>' +
      '<h2>Propriétaire</h2><div><b>' + esc(o.nom) + '</b><div class="mut">' + o.biens.length + ' bien(s) en gestion</div></div>' +
      '<h2>1. Loyers encaissés' + '</h2><table><tr><th>Bien</th><th>Locataire</th><th class="r">Loyer dû</th><th class="r">Encaissé</th><th class="r">Reste</th></tr>' +
      (tenants.length ? tenants.map(t => row([esc(t.bien), esc(t.loc), fmt(t.due), fmt(t.paid), fmt(t.solde)])).join('') : '<tr><td colspan="5" class="mut">Aucun loyer sur la période</td></tr>') +
      row(['TOTAL', '', fmt(o.due), fmt(o.paid), fmt(o.paid < o.due ? o.due - o.paid : 0)], 'tot') + '</table>' +
      '<h2>2. Commission d’agence</h2><table><tr><th>Bien</th><th class="r">Taux</th><th class="r">Loyers encaissés</th><th class="r">Commission</th></tr>' +
      o.biens.filter(r => r.paid || r.commission).map(r => row([esc(r.nom), r.taux + ' %', fmt(r.paid), fmt(r.commission)])).join('') + row(['TOTAL', '', fmt(o.paid), fmt(o.commission)], 'tot') + '</table>' +
      '<h2>3. Dépenses et réparations déduites</h2><table><tr><th>Bien</th><th>Désignation</th><th>Date</th><th class="r">Montant</th></tr>' +
      (deps.length ? deps.map(x => row([esc(x.bien), esc(x.lib), dFr(x.date), fmt(x.m)])).join('') : '<tr><td colspan="4" class="mut">Aucune dépense sur la période</td></tr>') +
      row(['TOTAL', '', '', fmt(o.depTotal)], 'tot') + '</table>' +
      '<h2>4. Bilan</h2><table>' + row(['Loyers encaissés', fmt(o.paid)]) + row(['− Commission d’agence', fmt(o.commission)]) + row(['− Dépenses / réparations', fmt(o.depTotal)]) + row(['Net dû au propriétaire', fmt(o.net)], 'tot') + '</table>' +
      '<h2>5. Reversements effectués</h2><table><tr><th>Date</th><th>Mode</th><th>Note</th><th class="r">Montant</th></tr>' +
      (revs.length ? revs.map(v => row([dFr(v.date), esc(v.mode || ''), esc(v.note || ''), fmt(num(v.montant))])).join('') : '<tr><td colspan="4" class="mut">Aucun reversement</td></tr>') +
      row(['TOTAL VERSÉ', '', '', fmt(totalVerse)], 'tot') + row(['Solde restant dû', '', '', '<span class="' + (solde > 0 ? 'neg' : '') + '">' + fmt(Math.max(0, solde)) + '</span>'], 'big') + '</table>' +
      (solde <= 0 ? '<p style="margin-top:14px"><span class="stamp">SOLDÉ — Reversement total effectué</span></p>' : '') +
      '<div class="sig"><div>Pour l’agence<br>(cachet et signature)</div><div>Le propriétaire<br>(« Reçu », date et signature)</div></div>' +
      '<script>setTimeout(function(){print()},400)<\/script></body></html>';
    w.document.write(html); w.document.close();
  }

  function css() {
    return '.gps{padding:4px 2px}.gps-top{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px}.gps-top h3{margin:0;font-size:18px}.gps-top p{margin:2px 0 0;color:#6b7280;font-size:12px}.gps-actions{display:flex;align-items:center;gap:8px}' +
      '.gps-btn{border:1px solid #e5e7eb;background:#fff;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:700;cursor:pointer}.gps-btn.pri{background:#111827;color:#fff;border-color:#111827}' +
      '.gps-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:12px}.gps-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:12px}.gps-card small{display:block;color:#6b7280;font-size:11px;font-weight:700}.gps-card strong{font-size:17px}.gps-card em{display:block;font-size:10px;color:#9ca3af;font-style:normal;margin-top:2px}' +
      '.gps .g{color:#16a34a}.gps .o{color:#ea580c}.gps .b{color:#7c3aed}.gps .r2{color:#dc2626}.gps .neg{color:#dc2626;font-weight:800}' +
      '.gps-banner{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:9px 12px;font-size:12px;margin-bottom:10px}.gps-search{width:100%;max-width:320px;box-sizing:border-box;height:36px;border:1px solid #e5e7eb;border-radius:9px;padding:0 10px;margin-bottom:10px}' +
      '.gps-table{overflow-x:auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px}.gps table{width:100%;border-collapse:collapse;font-size:12px}.gps th{background:#f8fafc;text-align:left;padding:9px 10px;font-size:11px;color:#6b7280}.gps td{padding:8px 10px;border-top:1px solid #f1f5f9;white-space:nowrap}.gps .r{text-align:right}' +
      '.gps-owner td{background:#fafafa;font-weight:600}.gps-bien td:first-child{padding-left:34px}.gps-loc td{font-size:11px;color:#6b7280}.gps-loc td:first-child{padding-left:50px}.gps-sub{display:block;font-size:10px;color:#9ca3af;font-weight:400}.gps-tog{border:0;background:none;cursor:pointer;margin-right:6px}' +
      '.gps-taux{width:78px;height:30px;border:1px solid #e5e7eb;border-radius:7px;padding:0 6px;font-size:12px}.gps-ok{color:#16a34a;font-weight:700;font-size:11px}.gps-empty{text-align:center;color:#9ca3af;padding:24px!important}' +
      '.gps-actions{flex-wrap:wrap}.gps-seg{display:inline-flex}.gps-seg .gps-btn{border-radius:0}.gps-seg .gps-btn:first-child{border-radius:8px 0 0 8px}.gps-seg .gps-btn:last-child{border-radius:0 8px 8px 0}.gps-btn.seg.on{background:#111827;color:#fff;border-color:#111827}.gps-chk{font-size:12px;color:#374151;display:inline-flex;align-items:center;gap:5px}.gps-chk input[type=month]{height:30px;border:1px solid #e5e7eb;border-radius:7px;padding:0 6px;font-size:12px}';
  }

  window.renderSituationProprietaires = render;
  window.GPSituation = { compute, render, exportRows: function(){ const rg = range(); return lines(compute(db(), rg.from, rg.to, st.arrears)); }, month: function(){ return st.month; }, range: range };
})();
