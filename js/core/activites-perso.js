/* Genius Property — Activités personnelles de l'agence (marchés + autres revenus)
 * Données ajoutées (aucune clé existante modifiée) :
 *   activites[]     { id, nom }                       liste LIBRE, créée par l'agence
 *   marches[]       { id, client, titre, activiteId, total, apport, apportDate, debut, fin, statut, notes,
 *                     paiements[{ id, date, montant, mode, ref, libelle }] }
 *   revenusAutres[] { id, date, activiteId, client, montant, mode, note }
 * Règles : encaissé = apport + paiements ; reste = total − encaissé (toujours calculé) ;
 *          un revenu est rattaché au mois de sa DATE d'encaissement (comme les commissions).
 * Lien Situation : window.GPActivites.revenue(from,to) → { marches, autres, total } */
(function () {
  'use strict';
  if (window.GPActivites) return;
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => { const n = Number(String(v ?? '').replace(/\s/g, '').replace(',', '.').replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
  const fmt = n => Math.round(n).toLocaleString('fr-FR') + ' FCFA';
  const pad = n => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const mk = s => String(s || '').slice(0, 7);
  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const db = () => (window.GPDB && GPDB.load ? GPDB.load() : (window.DB || {}));
  const save = async d => { if (window.GPDB && GPDB.save) return GPDB.save(d); window.DB = d; return typeof window.saveDB === 'function' ? window.saveDB() : true; };
  const notify = (m, t) => (typeof window.toast === 'function' ? window.toast(m, t) : console.log(m));
  const fdate = s => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '/' + m[2] + '/' + m[1] : '—'; };
  const MONTHS = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  const MODES = ['Espèces', 'Wave', 'Orange Money', 'Virement', 'Chèque'];
  const STATUTS = { cours: 'En cours', termine: 'Terminé', suspendu: 'Suspendu', litige: 'Litige' };
  const canWrite = () => { try { const P = window.GPPermissions; return !(P && P.has) || !!P.has(null, 'activites:write'); } catch (_) { return true; } };
  const ensure = d => { ['activites', 'marches', 'revenusAutres'].forEach(k => { if (!Array.isArray(d[k])) d[k] = []; }); return d; };
  const actName = (d, id) => ((d.activites || []).find(a => a.id === id) || {}).nom || 'Sans activité';

  /* ── calculs ── */
  function mStats(m) {
    const paid = num(m.apport) + (m.paiements || []).reduce((s, p) => s + num(p.montant), 0), total = num(m.total);
    const reste = Math.max(0, total - paid), late = m.statut === 'cours' && m.fin && m.fin < today() && reste > 0;
    return { paid, total, reste, pct: total ? Math.min(100, Math.round(paid / total * 100)) : 0, late, over: paid > total && total > 0 };
  }
  /** Flux d'argent encaissé : [{k:'YYYY-MM', date, montant, act, label, src}] */
  function flows(d) {
    const out = [];
    (d.marches || []).forEach(m => {
      const lab = (m.client || '') + (m.titre ? ' — ' + m.titre : '');
      if (num(m.apport) > 0) out.push({ date: m.apportDate || m.debut || today(), montant: num(m.apport), act: m.activiteId, label: lab + ' (apport)', src: 'marche' });
      (m.paiements || []).forEach(p => out.push({ date: p.date, montant: num(p.montant), act: m.activiteId, label: lab, src: 'marche' }));
    });
    (d.revenusAutres || []).forEach(r => out.push({ date: r.date, montant: num(r.montant), act: r.activiteId, label: r.client || r.note || 'Revenu', src: 'autre' }));
    return out.filter(f => /^\d{4}-\d{2}/.test(f.date || '')).map(f => Object.assign(f, { k: mk(f.date) }));
  }
  function revenue(from, to) {
    const f = flows(db()).filter(x => x.k >= from && x.k <= (to || from));
    const s = src => f.filter(x => x.src === src).reduce((a, x) => a + x.montant, 0);
    return { marches: s('marche'), autres: s('autre'), total: s('marche') + s('autre') };
  }
  function commissions(year) {
    try { return window.GPSituation ? GPSituation.compute(db(), year + '-01', year + '-12', false).reduce((s, o) => s + (o.commission || 0), 0) : 0; } catch (_) { return 0; }
  }

  /* ── état + styles ── */
  const st = { tab: 'dash', year: new Date().getFullYear(), q: '', f: 'tous', open: '' };
  function css() {
    if ($('gpa-style')) return;
    document.head.insertAdjacentHTML('beforeend', `<style id="gpa-style">
.gpa{--g:#d4af37;--l:#eef2f7;--m:#6b7280}.gpa *{box-sizing:border-box}
.gpa-top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
.gpa-tabs{display:flex;gap:4px;border-bottom:1px solid var(--l)}.gpa-tab{border:0;background:none;padding:9px 14px;font-size:12px;font-weight:900;color:var(--m);cursor:pointer;border-bottom:2px solid transparent}.gpa-tab.on{color:#111827;border-color:var(--g)}
.gpa-btn{height:34px;border-radius:9px;padding:0 12px;font-size:12px;font-weight:800;cursor:pointer;border:1px solid #e5e7eb;background:#fff;color:#111827;display:inline-flex;align-items:center;gap:6px}.gpa-btn.pri{background:var(--g);border-color:var(--g)}.gpa-btn.sm{height:28px;padding:0 8px}.gpa-btn.del{color:#dc2626}.gpa-btn .material-symbols-rounded{font-size:16px}
.gpa-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:12px 0}.gpa-card{background:#fff;border:1px solid var(--l);border-radius:12px;padding:12px}.gpa-card small{display:block;color:var(--m);font-size:10px;font-weight:700;text-transform:uppercase}.gpa-card strong{display:block;font-size:17px;margin-top:4px}
.gpa-g{color:#16a34a}.gpa-o{color:#d97706}.gpa-r{color:#dc2626}.gpa-box{background:#fff;border:1px solid var(--l);border-radius:12px;overflow:auto;margin-bottom:12px}.gpa-box h4{margin:0;padding:11px 12px;font-size:12px;border-bottom:1px solid var(--l)}
.gpa table{width:100%;border-collapse:collapse;font-size:12px}.gpa th{text-align:left;font-size:10px;text-transform:uppercase;color:var(--m);padding:9px 12px;border-bottom:1px solid var(--l);background:#fafbfc;white-space:nowrap}.gpa td{padding:9px 12px;border-bottom:1px solid #f4f6f9}.gpa .rt{text-align:right}.gpa .sub{display:block;color:var(--m);font-size:10.5px}
.gpa-bar{height:6px;background:#f1f5f9;border-radius:9px;overflow:hidden;min-width:70px}.gpa-bar i{display:block;height:100%;background:#16a34a}
.gpa-pill{border-radius:99px;padding:3px 9px;font-size:10.5px;font-weight:900;background:#f1f5f9;color:#475569}.gpa-pill.cours{background:#dbeafe;color:#1e40af}.gpa-pill.termine{background:#dcfce7;color:#166534}.gpa-pill.litige,.gpa-pill.late{background:#fee2e2;color:#991b1b}
.gpa-chart{display:flex;align-items:flex-end;gap:6px;height:130px;padding:14px 12px 4px}.gpa-chart div{flex:1;text-align:center;font-size:9px;color:var(--m)}.gpa-chart i{display:block;background:var(--g);border-radius:4px 4px 0 0;min-height:2px;margin-bottom:4px}
.gpa-empty{padding:30px;text-align:center;color:#94a3b8;font-size:12px}
#gpaOv{position:fixed;inset:0;background:rgba(15,23,42,.42);z-index:9998}#gpaDr{position:fixed;top:0;right:0;bottom:0;width:min(560px,96vw);background:#fff;z-index:9999;display:flex;flex-direction:column;box-shadow:-20px 0 45px rgba(15,23,42,.22)}
#gpaDr .h{display:flex;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--l)}#gpaDr .h b{font-size:17px}#gpaDr .b{flex:1;overflow:auto;padding:14px 20px}#gpaDr .f{display:flex;justify-content:space-between;gap:8px;padding:12px 20px;border-top:1px solid var(--l)}
#gpaDr label{display:block;font-size:11px;font-weight:800;margin:0 0 4px}#gpaDr input,#gpaDr select,#gpaDr textarea{width:100%;height:36px;border:1px solid #e5e7eb;border-radius:9px;font-size:12px;padding:0 10px;background:#fff}#gpaDr textarea{height:64px;padding:8px 10px}.gpa-g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.gpa-fd{margin-bottom:11px}
</style>`);
  }

  /* ── page ── */
  function render() {
    const page = $('page-activites'); if (!page) return;
    css(); const d = ensure(db()), w = canWrite();
    const tabs = [['dash', 'Tableau de bord'], ['marches', 'Marchés (' + d.marches.length + ')'], ['autres', 'Autres revenus (' + d.revenusAutres.length + ')']];
    page.innerHTML = '<div class="gpa"><div class="gpa-top"><div class="gpa-tabs">' + tabs.map(t => '<button class="gpa-tab' + (st.tab === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
      '<div style="display:flex;gap:8px;align-items:center"><button class="gpa-btn sm" data-yr="-1">‹</button><b style="font-size:13px">' + st.year + '</b><button class="gpa-btn sm" data-yr="1">›</button>' +
      (w ? '<button class="gpa-btn" data-acts>Activités</button>' + (st.tab === 'autres' ? '<button class="gpa-btn pri" data-newrev>+ Revenu</button>' : '<button class="gpa-btn pri" data-newm>+ Marché</button>') : '') + '</div></div><div id="gpaBody"></div></div>';
    ({ dash: dash, marches: marches, autres: autres })[st.tab](d);
  }
  function dash(d) {
    const fl = flows(d).filter(f => f.k.slice(0, 4) === String(st.year)), act = fl.reduce((s, f) => s + f.montant, 0), com = commissions(st.year);
    const open = d.marches.map(mStats), reste = open.reduce((s, x, i) => s + (d.marches[i].statut === 'cours' ? x.reste : 0), 0);
    const byM = Array(12).fill(0); fl.forEach(f => byM[+f.k.slice(5) - 1] += f.montant); const mx = Math.max(1, ...byM);
    const byA = {}; fl.forEach(f => { const n = actName(d, f.act); byA[n] = (byA[n] || 0) + f.montant; });
    const rows = Object.entries(byA).sort((a, b) => b[1] - a[1]);
    $('gpaBody').innerHTML = '<div class="gpa-cards"><div class="gpa-card"><small>Revenus d’activités</small><strong class="gpa-g">' + fmt(act) + '</strong></div>' +
      '<div class="gpa-card"><small>Commissions locatives</small><strong>' + fmt(com) + '</strong></div><div class="gpa-card"><small>Revenu global agence</small><strong>' + fmt(act + com) + '</strong></div>' +
      '<div class="gpa-card"><small>Reste à encaisser (marchés en cours)</small><strong class="gpa-o">' + fmt(reste) + '</strong></div>' +
      '<div class="gpa-card"><small>Marchés en retard</small><strong class="' + (open.some(x => x.late) ? 'gpa-r' : '') + '">' + open.filter(x => x.late).length + '</strong></div></div>' +
      '<div class="gpa-box"><h4>Évolution mensuelle ' + st.year + '</h4><div class="gpa-chart">' + byM.map((v, i) => '<div title="' + fmt(v) + '"><i style="height:' + Math.round(v / mx * 100) + 'px"></i>' + MONTHS[i] + '</div>').join('') + '</div></div>' +
      '<div class="gpa-box"><h4>Répartition par activité</h4>' + (rows.length ? '<table><tbody>' + rows.map(r => '<tr><td>' + esc(r[0]) + '</td><td class="rt"><b>' + fmt(r[1]) + '</b></td><td style="width:35%"><div class="gpa-bar"><i style="width:' + Math.round(r[1] / act * 100) + '%"></i></div></td></tr>').join('') + '</tbody></table>' : '<div class="gpa-empty">Aucun revenu saisi pour ' + st.year + '</div>') + '</div>';
  }
  function marches(d) {
    const w = canWrite(), q = st.q.toLowerCase();
    const list = d.marches.filter(m => !q || (m.client + ' ' + m.titre + ' ' + actName(d, m.activiteId)).toLowerCase().includes(q));
    $('gpaBody').innerHTML = '<div style="display:flex;gap:8px;margin-bottom:10px"><input id="gpaQ" placeholder="Rechercher un client, un marché…" value="' + esc(st.q) + '" style="flex:1;height:34px;border:1px solid #e5e7eb;border-radius:9px;padding:0 10px;font-size:12px"></div>' +
      '<div class="gpa-box">' + (list.length ? '<table><thead><tr><th>Marché</th><th>Activité</th><th class="rt">Total</th><th class="rt">Encaissé</th><th class="rt">Reste</th><th>Avancement</th><th>Fin</th><th>Statut</th><th></th></tr></thead><tbody>' + list.map(m => {
        const s = mStats(m);
        return '<tr><td><b>' + esc(m.client || '—') + '</b><span class="sub">' + esc(m.titre || '') + '</span></td><td>' + esc(actName(d, m.activiteId)) + '</td><td class="rt">' + fmt(s.total) + '</td><td class="rt gpa-g">' + fmt(s.paid) + '</td><td class="rt ' + (s.reste ? 'gpa-o' : 'gpa-g') + '"><b>' + fmt(s.reste) + '</b></td><td><div class="gpa-bar"><i style="width:' + s.pct + '%"></i></div><span class="sub">' + s.pct + ' %</span></td><td>' + fdate(m.fin) + (s.late ? '<span class="sub gpa-r">en retard</span>' : '') + '</td><td><span class="gpa-pill ' + m.statut + '">' + STATUTS[m.statut] + '</span></td>' +
          '<td class="rt" style="white-space:nowrap"><button class="gpa-btn sm" data-view="' + m.id + '" title="Détail / paiements"><span class="material-symbols-rounded">visibility</span></button>' + (w ? ' <button class="gpa-btn sm" data-editm="' + m.id + '"><span class="material-symbols-rounded">edit</span></button> <button class="gpa-btn sm del" data-delm="' + m.id + '"><span class="material-symbols-rounded">delete</span></button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="gpa-empty">Aucun marché. Cliquez sur « + Marché » pour en créer un.</div>') + '</div>';
  }
  function autres(d) {
    const w = canWrite(), list = d.revenusAutres.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    $('gpaBody').innerHTML = '<div class="gpa-box">' + (list.length ? '<table><thead><tr><th>Date</th><th>Activité</th><th>Client / note</th><th>Mode</th><th class="rt">Montant</th><th></th></tr></thead><tbody>' + list.map(r => '<tr><td>' + fdate(r.date) + '</td><td>' + esc(actName(d, r.activiteId)) + '</td><td>' + esc(r.client || '') + '<span class="sub">' + esc(r.note || '') + '</span></td><td>' + esc(r.mode || '—') + '</td><td class="rt gpa-g"><b>' + fmt(num(r.montant)) + '</b></td><td class="rt">' + (w ? '<button class="gpa-btn sm" data-editr="' + r.id + '"><span class="material-symbols-rounded">edit</span></button> <button class="gpa-btn sm del" data-delr="' + r.id + '"><span class="material-symbols-rounded">delete</span></button>' : '') + '</td></tr>').join('') + '</tbody></table>' : '<div class="gpa-empty">Aucun revenu. Saisissez ici vos revenus ponctuels (conseil, honoraires…).</div>') + '</div>';
  }

  /* ── tiroir générique ── */
  const close = () => { $('gpaOv') && $('gpaOv').remove(); $('gpaDr') && $('gpaDr').remove(); };
  function drawer(title, body, foot) {
    close(); document.body.insertAdjacentHTML('beforeend', '<div id="gpaOv"></div><aside id="gpaDr"><div class="h"><b>' + title + '</b><button class="gpa-btn sm" data-x>✕</button></div><div class="b">' + body + '</div>' + (foot ? '<div class="f">' + foot + '</div>' : '') + '</aside>');
    $('gpaOv').onclick = close;
  }
  const actOpts = (d, sel) => '<option value="">— Aucune —</option>' + d.activites.map(a => '<option value="' + a.id + '"' + (a.id === sel ? ' selected' : '') + '>' + esc(a.nom) + '</option>').join('');
  const val = id => ($(id) || {}).value || '';
  const fd = (l, h) => '<div class="gpa-fd"><label>' + l + '</label>' + h + '</div>';

  function actsDrawer() {
    const d = ensure(db());
    drawer('Mes activités', '<p style="font-size:12px;color:#6b7280;margin:0 0 12px">Créez vos propres catégories (ex. BTP, Syndic, Conseil…). Elles servent à classer marchés et revenus.</p>' +
      d.activites.map(a => '<div style="display:flex;gap:6px;margin-bottom:6px"><input value="' + esc(a.nom) + '" data-actname="' + a.id + '"><button class="gpa-btn sm del" data-delact="' + a.id + '">✕</button></div>').join('') +
      '<div style="display:flex;gap:6px;margin-top:10px"><input id="gpaNewAct" placeholder="Nouvelle activité…"><button class="gpa-btn pri" data-addact>Ajouter</button></div>', '<button class="gpa-btn" data-x>Fermer</button>');
  }
  function marcheDrawer(id) {
    const d = ensure(db()), m = d.marches.find(x => x.id === id) || { statut: 'cours', debut: today() };
    drawer(id ? 'Modifier le marché' : 'Nouveau marché',
      fd('Client *', '<input id="gm-client" value="' + esc(m.client || '') + '">') + fd('Intitulé du marché', '<input id="gm-titre" value="' + esc(m.titre || '') + '">') +
      '<div class="gpa-g2">' + fd('Activité', '<select id="gm-act">' + actOpts(d, m.activiteId) + '</select>') + fd('Statut', '<select id="gm-st">' + Object.keys(STATUTS).map(k => '<option value="' + k + '"' + (m.statut === k ? ' selected' : '') + '>' + STATUTS[k] + '</option>').join('') + '</select>') +
      fd('Montant total (FCFA) *', '<input id="gm-total" type="number" min="0" value="' + (m.total || '') + '">') + fd('Apport (FCFA)', '<input id="gm-apport" type="number" min="0" value="' + (m.apport || '') + '">') +
      fd('Date de début', '<input id="gm-debut" type="date" value="' + esc(m.debut || '') + '">') + fd('Date de fin / délai', '<input id="gm-fin" type="date" value="' + esc(m.fin || '') + '">') + '</div>' + fd('Notes', '<textarea id="gm-notes">' + esc(m.notes || '') + '</textarea>'),
      '<button class="gpa-btn" data-x>Annuler</button><button class="gpa-btn pri" data-savem="' + (id || '') + '">Enregistrer</button>');
  }
  async function saveMarche(id) {
    const d = ensure(db()), total = num(val('gm-total')), apport = num(val('gm-apport'));
    if (!val('gm-client').trim()) return notify('Client obligatoire', 'err');
    if (!(total > 0)) return notify('Saisissez un montant total supérieur à 0', 'err');
    if (apport > total) return notify('L’apport dépasse le montant total', 'err');
    let m = d.marches.find(x => x.id === id); if (!m) { m = { id: uid('mk'), paiements: [] }; d.marches.unshift(m); }
    Object.assign(m, { client: val('gm-client').trim(), titre: val('gm-titre').trim(), activiteId: val('gm-act'), statut: val('gm-st'), total, apport, debut: val('gm-debut'), fin: val('gm-fin'), notes: val('gm-notes') });
    if (apport > 0 && !m.apportDate) m.apportDate = m.debut || today();
    await save(d); close(); render(); notify('Marché enregistré ✓');
  }
  function viewDrawer(id) {
    const d = ensure(db()), m = d.marches.find(x => x.id === id); if (!m) return; const s = mStats(m), w = canWrite();
    const pays = (m.paiements || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    drawer(esc(m.client) + '<span class="sub" style="font-weight:400">' + esc(m.titre || '') + ' · ' + esc(actName(d, m.activiteId)) + '</span>',
      '<div class="gpa-cards" style="grid-template-columns:repeat(3,1fr)"><div class="gpa-card"><small>Total</small><strong>' + fmt(s.total) + '</strong></div><div class="gpa-card"><small>Encaissé</small><strong class="gpa-g">' + fmt(s.paid) + '</strong></div><div class="gpa-card"><small>Reste</small><strong class="' + (s.reste ? 'gpa-o' : 'gpa-g') + '">' + fmt(s.reste) + '</strong></div></div>' +
      '<div class="gpa-bar" style="margin-bottom:6px"><i style="width:' + s.pct + '%"></i></div><p class="sub" style="margin:0 0 12px">' + s.pct + ' % encaissé · début ' + fdate(m.debut) + ' · fin ' + fdate(m.fin) + (s.late ? ' · <b class="gpa-r">en retard</b>' : '') + '</p>' +
      '<div class="gpa-box"><h4>Paiements</h4><table><tbody>' + (num(m.apport) > 0 ? '<tr><td>' + fdate(m.apportDate || m.debut) + '</td><td>Apport</td><td class="rt gpa-g"><b>' + fmt(num(m.apport)) + '</b></td><td></td></tr>' : '') +
      pays.map(p => '<tr><td>' + fdate(p.date) + '</td><td>' + esc(p.libelle || 'Paiement') + '<span class="sub">' + esc(p.mode || '') + (p.ref ? ' · ' + esc(p.ref) : '') + '</span></td><td class="rt gpa-g"><b>' + fmt(num(p.montant)) + '</b></td><td class="rt">' + (w ? '<button class="gpa-btn sm" data-editp="' + id + '|' + p.id + '"><span class="material-symbols-rounded">edit</span></button> <button class="gpa-btn sm del" data-delp="' + id + '|' + p.id + '"><span class="material-symbols-rounded">delete</span></button>' : '') + '</td></tr>').join('') +
      '</tbody></table>' + (!pays.length && !num(m.apport) ? '<div class="gpa-empty">Aucun paiement</div>' : '') + '</div>' +
      '<div class="gpa-box"><h4>Documents</h4><div class="gpa-empty">Espace documents (contrat, devis, factures, PV…) — prochaine étape.</div></div>',
      '<button class="gpa-btn" data-x>Fermer</button>' + (w && s.reste > 0 ? '<button class="gpa-btn pri" data-newp="' + id + '">+ Paiement</button>' : ''));
  }
  function payDrawer(mid, pid) {
    const d = ensure(db()), m = d.marches.find(x => x.id === mid); if (!m) return; const p = (m.paiements || []).find(x => x.id === pid) || { date: today(), mode: 'Espèces' };
    const reste = mStats(m).reste + (pid ? num(p.montant) : 0);
    drawer(pid ? 'Modifier le paiement' : 'Nouveau paiement', '<div class="gpa-card" style="margin-bottom:12px"><small>Reste à encaisser</small><strong class="gpa-o">' + fmt(reste) + '</strong></div>' +
      fd('Montant (FCFA) *', '<input id="gp-m" type="number" min="0" value="' + (p.montant || '') + '">') + '<div class="gpa-g2">' + fd('Date', '<input id="gp-d" type="date" value="' + esc(p.date) + '">') + fd('Mode', '<select id="gp-mode">' + MODES.map(x => '<option' + (x === p.mode ? ' selected' : '') + '>' + x + '</option>').join('') + '</select>') + '</div>' +
      fd('Libellé (acompte, situation n°2, solde…)', '<input id="gp-lib" value="' + esc(p.libelle || '') + '">') + fd('Référence', '<input id="gp-ref" value="' + esc(p.ref || '') + '">'),
      '<button class="gpa-btn" data-view="' + mid + '">Annuler</button><button class="gpa-btn pri" data-savep="' + mid + '|' + (pid || '') + '">Enregistrer</button>');
  }
  async function savePay(mid, pid) {
    const d = ensure(db()), m = d.marches.find(x => x.id === mid); if (!m) return; const a = num(val('gp-m'));
    if (!(a > 0)) return notify('Saisissez un montant supérieur à 0', 'err');
    const others = mStats(m).paid - (pid ? num((m.paiements.find(x => x.id === pid) || {}).montant) : 0);
    if (others + a > num(m.total)) return notify('Dépasse le montant du marché (max ' + fmt(num(m.total) - others) + ')', 'err');
    m.paiements = m.paiements || []; let p = m.paiements.find(x => x.id === pid); if (!p) { p = { id: uid('p') }; m.paiements.push(p); }
    Object.assign(p, { montant: a, date: val('gp-d') || today(), mode: val('gp-mode'), libelle: val('gp-lib').trim(), ref: val('gp-ref').trim() });
    if (mStats(m).reste <= 0 && m.statut === 'cours') m.statut = 'termine';
    await save(d); render(); viewDrawer(mid); notify('Paiement enregistré ✓');
  }
  function revDrawer(id) {
    const d = ensure(db()), r = d.revenusAutres.find(x => x.id === id) || { date: today(), mode: 'Espèces' };
    drawer(id ? 'Modifier le revenu' : 'Nouveau revenu', fd('Montant (FCFA) *', '<input id="gr-m" type="number" min="0" value="' + (r.montant || '') + '">') + '<div class="gpa-g2">' + fd('Date', '<input id="gr-d" type="date" value="' + esc(r.date) + '">') + fd('Activité', '<select id="gr-a">' + actOpts(d, r.activiteId) + '</select>') + '</div>' +
      fd('Client / source', '<input id="gr-c" value="' + esc(r.client || '') + '">') + fd('Mode', '<select id="gr-mode">' + MODES.map(x => '<option' + (x === r.mode ? ' selected' : '') + '>' + x + '</option>').join('') + '</select>') + fd('Note', '<textarea id="gr-n">' + esc(r.note || '') + '</textarea>'),
      '<button class="gpa-btn" data-x>Annuler</button><button class="gpa-btn pri" data-saver="' + (id || '') + '">Enregistrer</button>');
  }
  async function saveRev(id) {
    const d = ensure(db()), a = num(val('gr-m')); if (!(a > 0)) return notify('Saisissez un montant supérieur à 0', 'err');
    let r = d.revenusAutres.find(x => x.id === id); if (!r) { r = { id: uid('rv') }; d.revenusAutres.unshift(r); }
    Object.assign(r, { montant: a, date: val('gr-d') || today(), activiteId: val('gr-a'), client: val('gr-c').trim(), mode: val('gr-mode'), note: val('gr-n') });
    await save(d); close(); render(); notify('Revenu enregistré ✓');
  }
  async function del(kind, a, b) {
    if (!canWrite()) return notify('Action non autorisée', 'err'); const d = ensure(db());
    if (kind === 'm') { const m = d.marches.find(x => x.id === a); if (!m || !confirm('Supprimer le marché « ' + m.client + ' » et ses ' + ((m.paiements || []).length) + ' paiement(s) ?')) return; d.marches = d.marches.filter(x => x.id !== a); }
    if (kind === 'r') { if (!confirm('Supprimer ce revenu ?')) return; d.revenusAutres = d.revenusAutres.filter(x => x.id !== a); }
    if (kind === 'p') { if (!confirm('Supprimer ce paiement ?')) return; const m = d.marches.find(x => x.id === a); m.paiements = m.paiements.filter(x => x.id !== b); }
    await save(d); render(); if (kind === 'p') viewDrawer(a); notify('Supprimé ✓');
  }

  /* ── événements ── */
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-tab],[data-yr],[data-acts],[data-newm],[data-newrev],[data-x],[data-view],[data-editm],[data-delm],[data-savem],[data-newp],[data-editp],[data-delp],[data-savep],[data-editr],[data-delr],[data-saver],[data-addact],[data-delact]');
    if (!t || !(t.closest('#page-activites') || t.closest('#gpaDr'))) return; const D = t.dataset, pr = v => String(v).split('|');
    if ('x' in D) return close(); if (D.tab) { st.tab = D.tab; return render(); } if (D.yr) { st.year += +D.yr; return render(); }
    if ('acts' in D) return actsDrawer(); if ('newm' in D) return marcheDrawer(); if ('newrev' in D) return revDrawer();
    if (D.view) return viewDrawer(D.view); if (D.editm) return marcheDrawer(D.editm); if (D.delm) return del('m', D.delm); if ('savem' in D) return saveMarche(D.savem);
    if (D.newp) return payDrawer(D.newp); if (D.editp) return payDrawer(...pr(D.editp)); if (D.delp) return del('p', ...pr(D.delp)); if ('savep' in D) return savePay(...pr(D.savep));
    if (D.editr) return revDrawer(D.editr); if (D.delr) return del('r', D.delr); if ('saver' in D) return saveRev(D.saver);
    if ('addact' in D) { const n = val('gpaNewAct').trim(); if (!n) return; const d = ensure(db()); if (d.activites.some(a => a.nom.toLowerCase() === n.toLowerCase())) return notify('Cette activité existe déjà', 'err'); d.activites.push({ id: uid('ac'), nom: n }); await save(d); actsDrawer(); return render(); }
    if (D.delact) { const d = ensure(db()), used = d.marches.some(m => m.activiteId === D.delact) || d.revenusAutres.some(r => r.activiteId === D.delact); if (used && !confirm('Cette activité est utilisée : les revenus resteront, classés « Sans activité ». Supprimer ?')) return; d.activites = d.activites.filter(a => a.id !== D.delact); d.marches.forEach(m => { if (m.activiteId === D.delact) m.activiteId = ''; }); d.revenusAutres.forEach(r => { if (r.activiteId === D.delact) r.activiteId = ''; }); await save(d); actsDrawer(); render(); }
  });
  document.addEventListener('input', e => { if (e.target.id === 'gpaQ') { st.q = e.target.value; marches(ensure(db())); const i = $('gpaQ'); i && i.focus(); i && i.setSelectionRange(st.q.length, st.q.length); } });
  document.addEventListener('change', async e => { const n = e.target.dataset && e.target.dataset.actname; if (n && e.target.value.trim()) { const d = ensure(db()), a = d.activites.find(x => x.id === n); if (a) { a.nom = e.target.value.trim(); await save(d); render(); } } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('gpaDr')) close(); });

  window.renderActivites = render;
  if (window.GPNavigation && GPNavigation.registerRenderer) GPNavigation.registerRenderer('activites', render);
  window.GPActivites = { render, revenue, commissions, flows, stats: mStats };
})();
