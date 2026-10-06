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
      '<td class="r">' + (o.id && single && o.aReverser > 0 ? '<button class="gps-btn pri" data-rev="' + esc(o.id) + '" data-amt="' + o.aReverser + '">' + (o.reverse > 0 ? 'Reverser le reste' : 'Reverser') + '</button>' : '') + (o.id && o.net > 0 && o.aReverser <= 0 ? '<span class="gps-ok">✓ Reversé</span>' : '') + (o.id && o.reverse > 0 ? ' <button class="gps-btn" data-hist="' + esc(o.id) + '" title="Modifier ou supprimer un reversement" aria-label="Modifier ou supprimer un reversement">✏️</button>' : '') + (o.id ? ' <button class="gps-btn" data-bilan="' + esc(o.id) + '" title="Facture / bilan à remettre au propriétaire">🖨</button>' : '') + '</td></tr>';
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
      if (t.dataset.bilan) return printBilan(t.dataset.bilan);
      if (t.dataset.hist) return showHistory(t.dataset.hist);
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
  /* ── Fenêtre de reversement : montant libre (≤ disponible) ou total ── */
  function askPayout(nom, periode, dispo, init) {
    init = init || null;
    return new Promise(resolve => {
      const ov = document.createElement('div'); ov.className = 'gps-ov';
      ov.innerHTML = '<style>.gps-ov{position:fixed;inset:0;background:rgba(17,24,39,.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px}.gps-md{background:#fff;border-radius:14px;padding:20px;width:100%;max-width:420px;font:13px Arial,sans-serif;box-shadow:0 20px 50px rgba(0,0,0,.25)}.gps-md h3{margin:0 0 4px;font-size:17px}.gps-md p{margin:0 0 12px;color:#6b7280}.gps-md label{display:block;font-weight:700;font-size:11px;color:#374151;margin:10px 0 4px}.gps-md input,.gps-md select{width:100%;box-sizing:border-box;height:38px;border:1px solid #e5e7eb;border-radius:8px;padding:0 10px;font-size:14px}.gps-dispo{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px;color:#166534;font-weight:700}.gps-q{display:flex;gap:8px;margin-top:8px}.gps-q button{flex:1}.gps-err{color:#dc2626;font-size:12px;min-height:16px;margin-top:6px}.gps-foot{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}.gps-md .gps-btn{padding:8px 14px}.gps-md .gps-btn.pri{background:#111827;color:#fff;border-color:#111827}</style>' +
        '<div class="gps-md"><h3>' + (init ? 'Modifier le reversement' : 'Reversement') + '</h3><p>' + esc(nom) + ' · ' + esc(periode) + '</p>' +
        '<div class="gps-dispo">' + (init ? 'Maximum possible pour ce reversement : ' : 'Disponible à reverser : ') + fmt(dispo) + '</div>' +
        '<div class="gps-q"><button type="button" class="gps-btn pri" id="gpmTot">Reverser le total</button><button type="button" class="gps-btn" id="gpmPart">Montant partiel</button></div>' +
        '<label>Montant à reverser (FCFA)</label><input id="gpmAmt" type="number" min="1" max="' + dispo + '" step="1" value="' + (init ? init.montant : dispo) + '">' +
        '<label>Mode de paiement</label><select id="gpmMode"><option>Espèces</option><option>Virement</option><option>Wave</option><option>Orange Money</option><option>Chèque</option></select>' +
        '<label>Date</label><input id="gpmDate" type="date" value="' + (init && init.date ? init.date : new Date().toISOString().slice(0, 10)) + '">' +
        '<label>Note (facultatif)</label><input id="gpmNote" type="text" placeholder="Ex : acompte, solde…" value="' + esc(init ? init.note || '' : '') + '">' +
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
      if (init && init.mode) g('gpmMode').value = init.mode;
      amt.focus(); amt.select();
    });
  }

  /* ── Historique des reversements : modifier / supprimer ── */
  function showHistory(id) {
    const rg = range(), d = db(), o = compute(d, rg.from, rg.to, false).find(x => x.id === id);
    const list = (d.reversements || []).filter(v => String(v.proprietaireId) === id && v.periode >= rg.from && v.periode <= rg.to);
    const old = document.querySelector('.gps-ov.hist'); if (old) old.remove();
    const ov = document.createElement('div'); ov.className = 'gps-ov hist';
    ov.innerHTML = '<style>.gps-ov{position:fixed;inset:0;background:rgba(17,24,39,.5);z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px}.gps-md{background:#fff;border-radius:14px;padding:20px;width:100%;max-width:520px;max-height:85vh;overflow:auto;font:13px Arial,sans-serif}.gps-md h3{margin:0 0 4px;font-size:17px}.gps-md p{margin:0 0 12px;color:#6b7280}.gps-md table{width:100%;border-collapse:collapse}.gps-md td,.gps-md th{padding:7px 6px;border-top:1px solid #f1f5f9;text-align:left;font-size:12px}.gps-md .r{text-align:right;white-space:nowrap}.gps-btn{border:1px solid #e5e7eb;background:#fff;border-radius:8px;padding:5px 9px;font-size:12px;font-weight:700;cursor:pointer}</style>' +
      '<div class="gps-md"><h3>Reversements — ' + esc(o ? o.nom : '') + '</h3><p>' + esc(rg.label) + '</p><table><tr><th>Date</th><th>Mode</th><th>Note</th><th class="r">Montant</th><th></th></tr>' +
      (list.length ? list.map(v => '<tr><td>' + dFr(v.date) + '</td><td>' + esc(v.mode || '') + '</td><td>' + esc(v.note || '') + '</td><td class="r">' + fmt(num(v.montant)) + '</td><td class="r"><button class="gps-btn" data-e="' + esc(v.id) + '">Modifier</button> <button class="gps-btn" data-d="' + esc(v.id) + '" style="color:#dc2626">Supprimer</button></td></tr>').join('') : '<tr><td colspan="5">Aucun reversement</td></tr>') +
      '</table><div style="text-align:right;margin-top:12px"><button class="gps-btn" data-x="1">Fermer</button></div></div>';
    document.body.appendChild(ov);
    ov.onclick = async e => {
      if (e.target === ov || e.target.dataset.x) return ov.remove();
      const eid = e.target.dataset.e, did = e.target.dataset.d; if (!eid && !did) return;
      const dd = db(), v = (dd.reversements || []).find(x => String(x.id) === (eid || did)); if (!v) return;
      if (did) {
        ov.style.display = 'none'; /* sinon la confirmation s'affiche derrière cette fenêtre */
        const ok = window.GPForms && GPForms.confirm ? await GPForms.confirm('Supprimer ce reversement de ' + fmt(num(v.montant)) + ' ?', { title: 'Suppression', okText: 'Supprimer' }) : confirm('Supprimer ce reversement de ' + fmt(num(v.montant)) + ' ?');
        ov.style.display = '';
        if (!ok) return;
        dd.reversements = dd.reversements.filter(x => x !== v); await save(dd); notify('Reversement supprimé ✓');
      } else {
        const cur = compute(dd, rg.from, rg.to, false).find(x => x.id === id);
        const max = Math.round((cur ? cur.aReverser : 0) + num(v.montant));
        ov.style.display = 'none';
        const res = await askPayout(ownerName((dd.proprietaires || []).find(x => String(x.id) === id) || {}), monthLabel(v.periode), max, { montant: Math.round(num(v.montant)), mode: v.mode, date: v.date, note: v.note });
        ov.style.display = '';
        if (!res) return;
        v.montant = res.montant; v.mode = res.mode; v.date = res.date; v.note = res.note; await save(dd); notify('Reversement modifié ✓');
      }
      render(); showHistory(id);
    };
  }

  const LS = k => { try { return localStorage.getItem(k) || ''; } catch (_) { return ''; } };
  const dFr = v => { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '/' + m[2] + '/' + m[1] : esc(v || ''); };

  /* ── Facture / bilan à remettre au propriétaire (PDF, même identité visuelle que les reçus) ── */
  function agencyInfo() {
    let ag = {};
    try { if (typeof window._getAgenceInfo === 'function') ag = window._getAgenceInfo() || {}; } catch (_) {}
    const val = id => { const e = document.getElementById(id); return e && e.value ? String(e.value).trim() : ''; };
    const g = k => ag[k] || '';
    let nom = LS('geniusproperty_agence') || '';
    if (!nom) { try { const c = window.GPAgencies && GPAgencies.current(); if (c && c.name) nom = c.name; } catch (_) {} }
    if (!nom) nom = g('agence') || val('cfg-agence') || 'Genius Property';
    /* logo : Paramètres (stocké) → aperçu du logo dans Paramètres → logo de l'application (menu) */
    let logo = LS('geniusproperty_logo') || g('logo');
    if (!logo) { const pv = document.getElementById('cfg-logo-preview'); if (pv && pv.getAttribute('src') && pv.style.display !== 'none') logo = pv.src; }
    if (!logo) { const sb = document.getElementById('sidebar-logo'); if (sb && sb.src) logo = sb.src; }
    return {
      nom, logo,
      adresse: LS('geniusproperty_adresse') || val('cfg-adresse'), tel: LS('geniusproperty_tel') || val('cfg-tel'), email: LS('geniusproperty_email') || val('cfg-email'),
      rccm: LS('geniusproperty_rccm') || val('cfg-rccm'), ninea: LS('geniusproperty_ninea') || val('cfg-ninea')
    };
  }

  function bilanHtml(o, rg, revs, ag) {
    const totalVerse = revs.reduce((s, v) => s + num(v.montant), 0), solde = o.net - totalVerse, solded = solde <= 0;
    const numero = 'BIL-' + rg.from.replace('-', '') + (rg.single ? '' : '-' + rg.to.replace('-', '')) + '-' + String(o.id).slice(-4).toUpperCase();
    const tenants = [], deps = [];
    o.biens.forEach(r => { r.lignes.forEach(l => tenants.push({ bien: r.nom, loc: l.loc, due: l.due, paid: l.paid, solde: l.solde })); r.depLignes.forEach(x => deps.push({ bien: r.nom, lib: x.lib, date: x.date, m: x.m })); });
    o.depAutres.forEach(x => deps.push({ bien: '—', lib: x.lib, date: '', m: x.m }));
    const loyersNets = o.paid - o.commission; /* la commission n'est pas détaillée : loyers présentés nets de frais de gestion */
    const INK = '#111827', MUT = '#6b7280', LINE = '#e5e7eb', GOLD = '#D4AF37',
      TH = 'padding:0 8px 8px;font-size:8.5px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:' + MUT + ';border-bottom:1.5px solid ' + INK + ';text-align:left',
      THR = TH + ';text-align:right', TD = 'padding:11px 8px;font-size:11px;color:' + INK + ';border-bottom:1px solid ' + LINE + ';vertical-align:top',
      TDR = TD + ';text-align:right;white-space:nowrap', TOT = 'padding:12px 8px 0;font-size:11.5px;font-weight:800;color:' + INK,
      sec = t => '<div style="font-size:9px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:' + INK + ';margin:0 0 10px">' + t + '</div>',
      wrap = h => '<div style="margin-top:34px;page-break-inside:avoid">' + h + '</div>',
      lab = (l, v) => '<div><div style="font-size:8.5px;letter-spacing:.9px;text-transform:uppercase;color:' + MUT + ';font-weight:700">' + l + '</div><div style="font-size:12.5px;font-weight:700;margin-top:5px;color:' + INK + '">' + v + '</div></div>',
      empty = (n, t) => '<tr><td colspan="' + n + '" style="' + TD + ';color:#9ca3af">' + t + '</td></tr>';
    const contact = [ag.adresse, ag.tel, ag.email].filter(Boolean).map(esc).join('  ·  ');
    const legal = [ag.rccm && 'RCCM ' + esc(ag.rccm), ag.ninea && 'NINEA ' + esc(ag.ninea)].filter(Boolean).join('  ·  ');
    const line = (l, v, bold, color) => '<tr><td style="padding:9px 0;font-size:' + (bold ? 12.5 : 11.5) + 'px;font-weight:' + (bold ? 800 : 400) + ';color:' + INK + ';border-bottom:1px solid ' + LINE + '">' + l + '</td><td style="padding:9px 0;font-size:' + (bold ? 13.5 : 11.5) + 'px;font-weight:' + (bold ? 800 : 600) + ';text-align:right;white-space:nowrap;color:' + (color || INK) + ';border-bottom:1px solid ' + LINE + '">' + v + '</td></tr>';
    return '<div style="width:794px;box-sizing:border-box;padding:46px 54px;font-family:\'Inter\',\'Helvetica Neue\',Arial,sans-serif;color:' + INK + ';background:#fff">' +
      /* en-tête : identité de l'agence | titre du document */
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px">' +
        '<div style="display:flex;align-items:center;gap:16px;min-width:0">' + (ag.logo ? '<img src="' + esc(ag.logo) + '" style="flex:none;max-width:96px;max-height:84px;width:auto;height:auto;object-fit:contain">' : '') +
          '<div style="min-width:0"><div style="font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.3px;line-height:1.3">' + esc(ag.nom) + '</div>' + (contact ? '<div style="font-size:9px;color:' + MUT + ';margin-top:5px;line-height:1.6">' + contact + '</div>' : '') + (legal ? '<div style="font-size:9px;color:' + MUT + ';line-height:1.6">' + legal + '</div>' : '') + '</div></div>' +
        '<div style="text-align:right;flex:none"><div style="font-size:21px;font-weight:800;letter-spacing:.2px">Bilan propriétaire</div><div style="font-size:10px;color:' + MUT + ';margin-top:6px">N° ' + esc(numero) + '</div><div style="font-size:10px;color:' + MUT + '">Émis le ' + dFr(new Date().toISOString().slice(0, 10)) + '</div></div></div>' +
      '<div style="height:2px;background:' + GOLD + ';margin:22px 0 26px"></div>' +
      /* propriétaire / période */
      '<div style="display:flex;gap:60px">' + lab('Propriétaire', esc(o.nom)) + lab('Période', esc(rg.label)) + lab('Biens en gestion', String(o.biens.length)) + '</div>' +
      /* 1. loyers */
      wrap(sec('Loyers') + '<table style="width:100%;border-collapse:collapse"><thead><tr><th style="' + TH + '">Bien</th><th style="' + TH + '">Locataire</th><th style="' + THR + '">Loyer dû</th><th style="' + THR + '">Encaissé</th><th style="' + THR + '">Reste</th></tr></thead><tbody>' +
        (tenants.length ? tenants.map(t => '<tr><td style="' + TD + '">' + esc(t.bien) + '</td><td style="' + TD + '">' + esc(t.loc) + '</td><td style="' + TDR + '">' + fmt(t.due) + '</td><td style="' + TDR + ';font-weight:700">' + fmt(t.paid) + '</td><td style="' + TDR + ';color:' + (t.solde > 0 ? '#b45309' : '#9ca3af') + '">' + fmt(t.solde) + '</td></tr>').join('') : empty(5, 'Aucun loyer sur la période')) +
        '<tr><td colspan="2" style="' + TOT + '">Total</td><td style="' + TOT + ';text-align:right;white-space:nowrap">' + fmt(o.due) + '</td><td style="' + TOT + ';text-align:right;white-space:nowrap">' + fmt(o.paid) + '</td><td style="' + TOT + ';text-align:right;white-space:nowrap">' + fmt(tenants.reduce((a, t) => a + t.solde, 0)) + '</td></tr></tbody></table>') +
      /* 2. dépenses */
      wrap(sec('Dépenses et réparations') + '<table style="width:100%;border-collapse:collapse"><thead><tr><th style="' + TH + '">Désignation</th><th style="' + TH + '">Bien</th><th style="' + TH + '">Date</th><th style="' + THR + '">Montant</th></tr></thead><tbody>' +
        (deps.length ? deps.map(x => '<tr><td style="' + TD + '">' + esc(x.lib) + '</td><td style="' + TD + '">' + esc(x.bien) + '</td><td style="' + TD + ';white-space:nowrap">' + dFr(x.date) + '</td><td style="' + TDR + ';font-weight:700">' + fmt(x.m) + '</td></tr>').join('') : empty(4, 'Aucune dépense sur la période')) +
        '<tr><td colspan="3" style="' + TOT + '">Total</td><td style="' + TOT + ';text-align:right;white-space:nowrap">' + fmt(o.depTotal) + '</td></tr></tbody></table>') +
      /* 3. bilan */
      wrap(sec('Bilan') + '<table style="width:100%;border-collapse:collapse">' +
        line('Loyers encaissés, nets de frais de gestion', fmt(loyersNets)) + line('− Dépenses et réparations', fmt(o.depTotal)) + line('Net dû au propriétaire', fmt(o.net), true) + line('− Total déjà reversé', fmt(totalVerse)) +
        '<tr><td style="padding:14px 0 4px;font-size:13px;font-weight:800;border-top:2px solid ' + INK + '">Solde restant dû' + (solded ? ' <span style="margin-left:10px;font-size:9px;letter-spacing:1px;color:#15803d;border:1.5px solid #15803d;border-radius:4px;padding:2px 7px;vertical-align:middle">SOLDÉ</span>' : '') + '</td><td style="padding:14px 0 4px;font-size:15px;font-weight:800;text-align:right;white-space:nowrap;border-top:2px solid ' + INK + ';color:' + (solded ? '#15803d' : '#b45309') + '">' + fmt(Math.max(0, solde)) + '</td></tr></table>') +
      /* 4. reversements */
      wrap(sec('Reversements effectués') + '<table style="width:100%;border-collapse:collapse"><thead><tr><th style="' + TH + '">Date</th><th style="' + TH + '">Mode</th><th style="' + TH + '">Note</th><th style="' + THR + '">Montant</th></tr></thead><tbody>' +
        (revs.length ? revs.map(v => '<tr><td style="' + TD + ';white-space:nowrap">' + dFr(v.date) + '</td><td style="' + TD + '">' + esc(v.mode || '') + '</td><td style="' + TD + ';color:' + MUT + '">' + esc(v.note || '') + '</td><td style="' + TDR + ';font-weight:700">' + fmt(num(v.montant)) + '</td></tr>').join('') : empty(4, 'Aucun reversement')) +
        '<tr><td colspan="3" style="' + TOT + '">Total versé</td><td style="' + TOT + ';text-align:right;white-space:nowrap">' + fmt(totalVerse) + '</td></tr></tbody></table>') +
      /* signatures */
      '<div style="page-break-inside:avoid;display:flex;justify-content:space-between;gap:80px;margin-top:60px;font-size:10px"><div style="flex:1"><div style="font-weight:700">Pour l’agence</div><div style="color:' + MUT + ';font-size:9px;margin-top:2px">Cachet et signature</div><div style="height:60px;border-bottom:1px solid #9ca3af"></div></div><div style="flex:1"><div style="font-weight:700">Le propriétaire</div><div style="color:' + MUT + ';font-size:9px;margin-top:2px">« Reçu » · date et signature</div><div style="height:60px;border-bottom:1px solid #9ca3af"></div></div></div>' +
      '<div style="margin-top:34px;text-align:center;font-size:8.5px;color:#9ca3af">' + esc(ag.nom) + '</div></div>';
  }

  async function printBilan(id) {
    const d = db(), rg = range(), o = compute(d, rg.from, rg.to, false).find(x => x.id === id); if (!o) return;
    const revs = (d.reversements || []).filter(v => String(v.proprietaireId) === id && v.periode >= rg.from && v.periode <= rg.to).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const html = bilanHtml(o, rg, revs, agencyInfo());
    const fname = 'bilan_' + norm(o.nom).replace(/[^a-z0-9]+/g, '_') + '_' + rg.from + (rg.single ? '' : '_' + rg.to) + '.pdf';
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:0;top:0;width:794px;background:#fff;z-index:-1;opacity:0;pointer-events:none';
    box.innerHTML = html; document.body.appendChild(box);
    const el = box.firstElementChild;
    try {
      if (window.ensureHtml2Pdf) await window.ensureHtml2Pdf();
      const lib = window.__html2pdfReal || window.html2pdf;
      if (typeof lib !== 'function') throw new Error('html2pdf indisponible');
      if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (_) {} }
      await Promise.all(Array.from(el.querySelectorAll('img')).map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; })));
      const blob = await lib().set({
        margin: [0, 0, 0, 0], filename: fname, image: { type: 'jpeg', quality: .98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#fff', logging: false, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['css'], avoid: 'tr' }
      }).from(el).outputPdf('blob');
      if (!blob || blob.size < 1500) throw new Error('PDF vide');
      const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = fname; a.style.display = 'none';
      document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 60000);
      notify('Facture générée ✓ — ' + fname);
    } catch (err) {
      /* secours : impression navigateur */
      console.error('[Situation] PDF bilan', err);
      const w = window.open('', '_blank'); if (!w) return notify('Erreur génération PDF', 'err');
      w.document.write('<html><head><meta charset="utf-8"><title>' + esc(fname) + '</title></head><body style="margin:0">' + html + '<script>setTimeout(function(){print()},500)<\/script></body></html>'); w.document.close();
    } finally { box.remove(); }
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
