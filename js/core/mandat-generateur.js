/* Genius Property — Générateur de mandat de gérance immobilière (page Propriétaires)
 * Même logique que le générateur de bail (contrats-generateur.js) :
 *  1. on clique sur « Mandat de gérance » depuis la ligne ou la fiche du propriétaire ;
 *  2. une fenêtre pré-remplie (propriétaire, bien, unités/loyers, agence) permet de compléter ce qui manque ;
 *  3. les compléments sont mémorisés dans proprietaires[].mandats[bienId] (+ pièce d'identité dans proprietaires[].mandatId) ;
 *  4. le mandat s'ouvre dans un nouvel onglet, prêt à imprimer / enregistrer en PDF.
 * Les champs vides restent en pointillés pour être complétés à la main.
 * Expose : window.GPMandat { open, build, html, words }, window.generateMandatGerance(ownerIdx, bienId?)
 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const num = v => { const n = Number(String(v ?? '').replace(/\s/g, '').replace(',', '.').replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
  const db = () => (window.GPDB && GPDB.load ? GPDB.load() : (window.DB || {}));
  const toast = (m, t) => (typeof window.toast === 'function' ? window.toast(m, t) : alert(m));
  const LS = k => { try { return localStorage.getItem(k) || ''; } catch (_) { return ''; } };
  const LSset = (k, v) => { try { localStorage.setItem(k, v || ''); } catch (_) {} };
  const fname = o => [o && o.prenom, o && o.nom].filter(Boolean).join(' ').trim() || (o && (o.nom || o.name)) || '';

  /* ── nombres en lettres ── */
  const U = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const T = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
  function b100(n, fin) {
    if (n < 20) return U[n];
    if (n < 70) { const t = Math.floor(n / 10), u = n % 10; return T[t] + (u ? (u === 1 ? ' et un' : '-' + U[u]) : ''); }
    if (n < 80) { const u = n - 60; return 'soixante' + (u === 11 ? ' et onze' : '-' + U[u]); }
    const u = n - 80; return u ? 'quatre-vingt-' + U[u] : 'quatre-vingt' + (fin ? 's' : '');
  }
  function b1000(n, fin) { let s = ''; const c = Math.floor(n / 100), r = n % 100; if (c) s = c === 1 ? 'cent' : U[c] + ' cent' + (r === 0 && fin ? 's' : ''); if (r) s += (s ? ' ' : '') + b100(r, fin); return s; }
  function words(n) {
    n = Math.round(n); if (!n) return 'ZÉRO';
    const bn = Math.floor(n / 1e9), mi = Math.floor(n % 1e9 / 1e6), th = Math.floor(n % 1e6 / 1e3), r = n % 1e3, p = [];
    if (bn) p.push(b1000(bn, false) + ' milliard' + (bn > 1 ? 's' : ''));
    if (mi) p.push(b1000(mi, false) + ' million' + (mi > 1 ? 's' : ''));
    if (th) p.push((th === 1 ? '' : b1000(th, false) + ' ') + 'mille');
    if (r) p.push(b1000(r, true));
    return p.join(' ').toUpperCase();
  }
  const nf = n => Math.round(n).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');
  const lw = n => words(n).toLowerCase();
  const withWords = n => lw(n) + ' (' + n + ')';

  /* ── dates ── */
  function pd(v) { if (!v) return null; const s = String(v); let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return new Date(+m[1], +m[2] - 1, +m[3]); m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; }
  const dshort = v => { const d = pd(v); return d ? String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear() : ''; };
  const dots = (s, n) => (s !== undefined && s !== null && String(s).trim() !== '') ? esc(s) : '.'.repeat(n || 22);

  /* ── données ── */
  function agency() {
    return {
      nom: LS('geniusproperty_agence') || 'Agence', email: LS('geniusproperty_email'), tel: LS('geniusproperty_tel'),
      adresse: LS('geniusproperty_adresse') || 'Dakar, Sénégal', rccm: LS('geniusproperty_rccm'), ninea: LS('geniusproperty_ninea'),
      logo: LS('geniusproperty_logo'), autorisation: LS('geniusproperty_autorisation')
    };
  }
  function biensOf(d, o) {
    try { window.GPRelationsV52 && GPRelationsV52.ensure(d); } catch (_) {}
    try { if (window.GPRelationsV52 && GPRelationsV52.propertiesForOwner) return GPRelationsV52.propertiesForOwner(d, o) || []; } catch (_) {}
    const pid = String(o && o.id || '');
    return (d.biens || []).filter(b => (pid && String(b.proprietaireId || b.proprioId || '') === pid) || (norm(b.proprio || b.proprietaire) && norm(b.proprio || b.proprietaire) === norm(fname(o))));
  }
  /* Regroupe les unités du bien en lignes « désignation / nombre / loyer unitaire » (modifiables dans la fenêtre). */
  function lotsFor(b) {
    if (!b) return [{ des: 'Appartements', nb: '', loyer: '' }];
    const us = Array.isArray(b.unites) ? b.unites : [];
    if (!us.length) return [{ des: b.type && b.type !== 'Immeuble' ? b.type : 'Appartements', nb: num(b.nbAppart || b.nbAppartements) || 1, loyer: num(b.loyer) || '' }];
    const g = new Map();
    us.forEach(u => {
      const base = String(u.nom || u.type || 'Appartement').replace(/[\s\-_#]*\d+\s*$/, '').trim() || 'Appartement';
      const loyer = num(u.loyer), key = norm(base) + '|' + loyer;
      if (!g.has(key)) g.set(key, { des: base, nb: 0, loyer: loyer || '' });
      g.get(key).nb++;
    });
    return [...g.values()].map(l => ({ des: l.nb > 1 && !/s$/i.test(l.des) ? l.des + 's' : l.des, nb: l.nb, loyer: l.loyer }));
  }
  const TRAVAUX_DEFAUT = 'la peinture extérieure de l’immeuble ;\nles réparations liées à la vétusté des installations et de la tuyauterie, lorsqu’elles ne résultent pas d’une faute du locataire ou du Mandataire.';

  /* Taux de commission réellement appliqué : surcharge du bien, sinon taux du propriétaire (0 / vide = non renseigné). */
  function effectiveTaux(o, b) {
    const has = x => x !== '' && x != null && num(x) > 0;
    if (b && has(b.commissionTaux)) return num(b.commissionTaux);
    if (o && has(o.commissionTaux)) return num(o.commissionTaux);
    return 0;
  }

  function context(d, oi, bienId) {
    const o = (d.proprietaires || [])[oi] || {};
    const bs = biensOf(d, o);
    const b = bs.find(x => String(x.id) === String(bienId)) || bs[0] || null;
    const key = b ? String(b.id) : '_';
    const saved = Object.assign({}, o.mandatId || {}, (o.mandats || {})[key] || {});
    const ag = agency();
    const typ = b && (b.type || 'Immeuble'), nomB = b && b.nom || '';
    const desig = b ? (nomB && norm(nomB).startsWith(norm(typ)) ? nomB : [typ, nomB].filter(Boolean).join(' ')) + (b.adresse ? ' sis à ' + b.adresse : '') : '';
    const lots = Array.isArray(saved.lots) && saved.lots.length ? saved.lots : lotsFor(b);
    const v = Object.assign({
      civM: o.civilite || '', mandant: [o.prenom, String(o.nom || '').toUpperCase()].filter(Boolean).join(' ') || fname(o),
      typePiece: 'CNI', cni: o.cni || o.passeport || o.numpiece || '', cniDate: o.cniDate || '', cniLieu: o.cniLieu || '',
      adresseM: o.adresse || '', telM: o.tel || o.telephone || '', emailM: o.email || '',
      repCiv: LS('geniusproperty_rep_civ') || 'Monsieur', repNom: LS('geniusproperty_representant'), repFonction: LS('geniusproperty_fonction') || 'Administrateur Général',
      autorisation: ag.autorisation,
      desig: desig, tf: b && (b.tf || b.titreFoncier) || '',
      duree: '3', reconduction: '3', preavis: '6', taux: '8', comptes: '2', travaux: TRAVAUX_DEFAUT,
      banque: '', titulaire: '', iban: '',
      lieu: 'Dakar', sign: '', exemplaires: '2'
    }, saved);
    /* Une seule source de vérité pour le taux : commissionTaux (bien, sinon propriétaire), celui que lit « Situation propriétaires ». */
    const eff = effectiveTaux(o, b);
    if (eff > 0) v.taux = String(eff);
    return { o, b, key, bs, ag, v, lots, num: saved.num || '' };
  }

  /* ── fenêtre de complément ── */
  const lotRow = l => '<div class="gpm-lot"><input data-k="des" value="' + esc(l.des) + '" placeholder="Ex : Appartements F3"><input data-k="nb" type="number" min="0" value="' + esc(l.nb) + '" placeholder="Nb"><input data-k="loyer" type="number" min="0" value="' + esc(l.loyer) + '" placeholder="Loyer mensuel"><button type="button" data-del title="Retirer">×</button></div>';
  function dialog(oi, bienId) {
    const d = db(), o = (d.proprietaires || [])[oi]; if (!o) return toast('Propriétaire introuvable', 'err');
    const X = context(d, oi, bienId), v = X.v;
    const f = (id, label, val, type, ph, cls) => '<div class="gpm-f' + (cls ? ' ' + cls : '') + '"><label>' + label + '</label><input id="gpm-' + id + '" type="' + (type || 'text') + '" value="' + esc(val) + '" placeholder="' + esc(ph || '') + '"></div>';
    const sel = (id, label, val, opts) => '<div class="gpm-f"><label>' + label + '</label><select id="gpm-' + id + '">' + opts.map(x => '<option ' + (x === val ? 'selected' : '') + '>' + x + '</option>').join('') + '</select></div>';
    const bienSel = X.bs.length > 1 ? '<div class="gpm-f w"><label>Bien concerné par ce mandat</label><select id="gpm-bien">' + X.bs.map(b => '<option value="' + esc(b.id) + '" ' + (String(b.id) === X.key ? 'selected' : '') + '>' + esc(b.nom || 'Bien') + '</option>').join('') + '</select></div>' : '';
    $('gpmOv') && $('gpmOv').remove();
    document.body.insertAdjacentHTML('beforeend', '<div id="gpmOv"><style>#gpmOv{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:14px}#gpmOv .m{background:#fff;border-radius:14px;max-width:700px;width:100%;max-height:92vh;display:flex;flex-direction:column;font-family:inherit}#gpmOv .h{padding:16px 20px;border-bottom:1px solid #e5e7eb}#gpmOv .h b{font-size:15px}#gpmOv .h small{display:block;color:#6b7280;margin-top:2px}#gpmOv .b{padding:14px 20px;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:10px 12px}#gpmOv h4{grid-column:1/-1;margin:8px 0 0;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#a07d1c}.gpm-f label{display:block;font-size:11px;font-weight:700;margin-bottom:4px;color:#374151}.gpm-f.w{grid-column:1/-1}.gpm-f input,.gpm-f select,.gpm-f textarea{width:100%;box-sizing:border-box;height:36px;border:1px solid #e5e7eb;border-radius:8px;padding:0 9px;font-size:12px;font-family:inherit}.gpm-f textarea{height:84px;padding:8px 9px;resize:vertical}#gpmOv .lots{grid-column:1/-1;display:flex;flex-direction:column;gap:6px}.gpm-lot{display:grid;grid-template-columns:1fr 70px 130px 32px;gap:6px}.gpm-lot input{height:34px;border:1px solid #e5e7eb;border-radius:8px;padding:0 8px;font-size:12px;box-sizing:border-box;width:100%}.gpm-lot button{border:1px solid #e5e7eb;background:#fff;border-radius:8px;cursor:pointer;font-size:16px;line-height:1;padding:0}#gpmOv .tot{grid-column:1/-1;font-size:12px;color:#374151;display:flex;justify-content:space-between;align-items:center}#gpmOv .f{padding:12px 20px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px}#gpmOv .f button,#gpmOv .tot button{border:1px solid #e5e7eb;background:#fff;border-radius:9px;padding:9px 14px;font-weight:700;font-size:12px;cursor:pointer}#gpmOv button.p{background:#111827;color:#fff;border-color:#111827}@media(max-width:560px){#gpmOv .b{grid-template-columns:1fr}.gpm-lot{grid-template-columns:1fr 60px 100px 32px}}</style><div class="m"><div class="h"><b>Mandat de gérance — ' + esc(fname(o)) + '</b><small>Vérifiez les informations. Ce qui manque restera en pointillés à compléter à la main.</small></div><div class="b">' +
      bienSel +
      '<h4>Mandant (propriétaire)</h4>' + sel('civM', 'Civilité', v.civM, ['', 'Monsieur', 'Madame']) + f('mandant', 'Nom complet', v.mandant) +
      sel('typePiece', 'Pièce d’identité', v.typePiece, ['CNI', 'Passeport', 'Carte de séjour']) + f('cni', 'N° de la pièce', v.cni) + f('cniDate', 'Délivrée le', v.cniDate, 'date') + f('cniLieu', 'Délivrée à', v.cniLieu) +
      f('adresseM', 'Demeurant à', v.adresseM, 'text', '', 'w') + f('telM', 'Téléphone', v.telM) + f('emailM', 'E-mail', v.emailM) +
      '<h4>Mandataire (agence)</h4>' + sel('repCiv', 'Civilité du représentant', v.repCiv, ['Monsieur', 'Madame']) + f('repNom', 'Représentée par', v.repNom, 'text', 'Ex : Babacar Sadikh FALL') + f('repFonction', 'Fonction', v.repFonction) + f('autorisation', 'Autorisation d’exercer n°', v.autorisation, 'text', 'Ex : 0008200-23 du 23 avril 2024') +
      '<h4>Immeuble</h4>' + f('desig', 'Désignation', v.desig, 'text', 'Ex : Immeuble R+4 sis à Almadies 2, Cité …, Villa n° …', 'w') + f('tf', 'Titre foncier (TF) n°', v.tf, 'text', '', 'w') +
      '<div class="lots" id="gpm-lots">' + X.lots.map(lotRow).join('') + '</div><div class="tot"><button type="button" data-add>+ Ajouter une ligne</button><span id="gpm-tot"></span></div>' +
      '<h4>Conditions</h4>' + f('duree', 'Durée du mandat (années)', v.duree, 'number') + f('reconduction', 'Reconduction tacite (années)', v.reconduction, 'number') + f('preavis', 'Préavis de non-renouvellement (mois)', v.preavis, 'number') + f('taux', 'Honoraires de gestion (% des loyers encaissés)', v.taux, 'number') + f('comptes', 'Comptes de gestion par an', v.comptes, 'number') +
      '<div class="gpm-f w"><label>Restent à la charge du Mandant (une ligne par point)</label><textarea id="gpm-travaux">' + esc(v.travaux) + '</textarea></div>' +
      '<h4>Reversement des loyers</h4>' + f('banque', 'Banque', v.banque) + f('titulaire', 'Titulaire du compte', v.titulaire) + f('iban', 'N° de compte / IBAN', v.iban, 'text', '', 'w') +
      '<h4>Signature</h4>' + f('lieu', 'Fait à', v.lieu) + f('sign', 'Date de signature', v.sign, 'date') + f('exemplaires', 'Nombre d’exemplaires', v.exemplaires, 'number') +
      '</div><div class="f"><button data-x>Annuler</button><button class="p" data-go>Générer le mandat</button></div></div></div>');

    const readLots = () => [...document.querySelectorAll('#gpm-lots .gpm-lot')].map(r => ({ des: r.querySelector('[data-k=des]').value.trim(), nb: num(r.querySelector('[data-k=nb]').value), loyer: num(r.querySelector('[data-k=loyer]').value) })).filter(l => l.des || l.nb || l.loyer);
    const refreshTot = () => { const ls = readLots(), n = ls.reduce((s, l) => s + l.nb, 0), t = ls.reduce((s, l) => s + l.nb * l.loyer, 0); $('gpm-tot') && ($('gpm-tot').innerHTML = '<b>' + n + '</b> lot(s) · total mensuel théorique <b>' + nf(t) + ' FCFA</b>'); };
    refreshTot();
    $('gpmOv').addEventListener('input', e => { if (e.target.closest('.gpm-lot')) refreshTot(); });
    $('gpmOv').addEventListener('change', e => { if (e.target.id === 'gpm-bien') dialog(oi, e.target.value); });
    $('gpmOv').onclick = async e => {
      if (e.target === $('gpmOv') || e.target.closest('[data-x]')) return $('gpmOv').remove();
      if (e.target.closest('[data-add]')) { $('gpm-lots').insertAdjacentHTML('beforeend', lotRow({ des: '', nb: '', loyer: '' })); return refreshTot(); }
      const del = e.target.closest('[data-del]'); if (del) { del.closest('.gpm-lot').remove(); return refreshTot(); }
      if (!e.target.closest('[data-go]')) return;
      const w = window.open('', '_blank'); // ouvert tout de suite (clic utilisateur) pour éviter le blocage pop-up
      if (!w) return toast('Pop-up bloquée : autorisez les pop-ups pour générer le mandat', 'err');
      const keys = ['civM', 'mandant', 'typePiece', 'cni', 'cniDate', 'cniLieu', 'adresseM', 'telM', 'emailM', 'repCiv', 'repNom', 'repFonction', 'autorisation', 'desig', 'tf', 'duree', 'reconduction', 'preavis', 'taux', 'comptes', 'travaux', 'banque', 'titulaire', 'iban', 'lieu', 'sign', 'exemplaires'];
      const ex = {}; keys.forEach(k => { const el = $('gpm-' + k); if (el) ex[k] = el.value.trim(); });
      ex.lots = readLots();
      const key = $('gpm-bien') ? $('gpm-bien').value : X.key;
      LSset('geniusproperty_representant', ex.repNom); LSset('geniusproperty_fonction', ex.repFonction); LSset('geniusproperty_rep_civ', ex.repCiv); LSset('geniusproperty_autorisation', ex.autorisation);
      try { await persist(oi, key, ex); } catch (err) { console.warn('[Mandat] sauvegarde', err); }
      $('gpmOv').remove(); build(oi, key, w);
    };
  }

  /* ── mémorisation ── */
  async function persist(oi, key, ex) {
    const d = db(), o = (d.proprietaires || [])[oi]; if (!o) return false;
    const ident = { civM: ex.civM, typePiece: ex.typePiece, cni: ex.cni, cniDate: ex.cniDate, cniLieu: ex.cniLieu };
    const mandats = Object.assign({}, o.mandats || {});
    const prev = mandats[key] || {};
    let ref = prev.num;
    if (!ref) {
      const all = (d.proprietaires || []).reduce((s, p) => s + Object.keys(p.mandats || {}).length, 0);
      const yr = (pd(ex.sign) || new Date()).getFullYear();
      ref = 'MG-' + yr + '-' + String(all + 1).padStart(3, '0');
    }
    mandats[key] = Object.assign({}, prev, ex, { num: ref, updatedAt: new Date().toISOString() });
    o.mandats = mandats; o.mandatId = ident;

    /* Le taux signé dans le mandat doit être celui utilisé pour le calcul des reversements (Situation propriétaires) :
     *  - taux du propriétaire vide  → on lui applique le taux du mandat ;
     *  - taux du mandat = taux du propriétaire → on retire une éventuelle surcharge sur le bien ;
     *  - sinon → surcharge sur le bien concerné par ce mandat. */
    const tx = String(ex.taux == null ? '' : ex.taux).trim() === '' ? null : Math.min(100, Math.max(0, num(ex.taux)));
    const ownerPatch = { mandats, mandatId: ident };
    let bienPatch = null;
    if (tx != null && tx > 0) {
      const ownerEmpty = o.commissionTaux === '' || o.commissionTaux == null || num(o.commissionTaux) === 0;
      if (ownerEmpty) { o.commissionTaux = tx; ownerPatch.commissionTaux = tx; }
      const b = key !== '_' ? (d.biens || []).find(x => String(x.id) === String(key)) : null;
      if (b) {
        const sameAsOwner = num(o.commissionTaux) === tx;
        const target = sameAsOwner ? '' : tx;
        const cur = b.commissionTaux === '' || b.commissionTaux == null ? '' : num(b.commissionTaux);
        if (cur !== target) { b.commissionTaux = target; bienPatch = { id: b.id, commissionTaux: target }; }
      }
    }

    if (o.id && window.GPDB && typeof GPDB.commitRecord === 'function') {
      let ok = GPDB.commitRecord('proprietaires', o.id, ownerPatch);
      if (bienPatch && ok !== false) ok = GPDB.commitRecord('biens', bienPatch.id, { commissionTaux: bienPatch.commissionTaux });
      return ok;
    }
    if (window.GPDB && GPDB.save) return GPDB.save(d);
    window.DB = d; return typeof window.saveDB === 'function' ? window.saveDB() : true;
  }

  /* ── clauses (reprennent le modèle de mandat de l'agence) ── */
  const P = t => '<p>' + t + '</p>';
  const UL = items => '<ul>' + items.map(i => '<li>' + i + '</li>').join('') + '</ul>';
  function totals(X) { const nb = X.lots.reduce((s, l) => s + num(l.nb), 0), tot = X.lots.reduce((s, l) => s + num(l.nb) * num(l.loyer), 0); return { nb, tot }; }
  function lotsTable(X) {
    const { nb, tot } = totals(X);
    const rows = X.lots.length ? X.lots : [{ des: '', nb: '', loyer: '' }];
    return '<table class="lots"><thead><tr><th>Désignation</th><th>Nombre</th><th>Loyer mensuel unitaire</th><th>Total mensuel</th></tr></thead><tbody>' +
      rows.map(l => '<tr><td>' + dots(l.des, 14) + '</td><td>' + (num(l.nb) ? num(l.nb) : '……') + '</td><td>' + (num(l.loyer) ? nf(num(l.loyer)) + ' FCFA' : '………… FCFA') + '</td><td>' + (num(l.nb) * num(l.loyer) ? nf(num(l.nb) * num(l.loyer)) + ' FCFA' : '………… FCFA') + '</td></tr>').join('') +
      '<tr class="tt"><td>TOTAL</td><td>' + (nb || '……') + '</td><td></td><td>' + (tot ? nf(tot) + ' FCFA' : '………… FCFA') + '</td></tr></tbody></table>';
  }
  function articles(X) {
    const v = X.v, { tot } = totals(X);
    const duree = num(v.duree) || 3, recond = num(v.reconduction) || 3, preavis = num(v.preavis) || 6, comptes = num(v.comptes) || 2;
    const taux = num(v.taux) || 8, tauxTxt = Number.isInteger(taux) ? lw(taux) : String(taux).replace('.', ',');
    const travaux = String(v.travaux || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
    return [
      ['OBJET DU MANDAT',
        P('Le Mandant confie au Mandataire, qui accepte, la mission d’administrer et de gérer, en son nom et pour son compte, l’immeuble désigné ci-dessous, notamment pour la mise en location, la perception des loyers, le suivi des locataires et l’accomplissement des diligences nécessaires à la bonne administration du bien.') +
        P('Le présent mandat est soumis aux dispositions du Code des obligations civiles et commerciales du Sénégal relatives au mandat, notamment aux articles 457 à 472, ainsi qu’aux dispositions légales et réglementaires applicables à l’activité du Mandataire.')],
      ['DÉSIGNATION DE L’IMMEUBLE',
        P('<b>' + dots(v.desig, 60) + '</b>') + P('Titre foncier (TF) n° : ' + dots(v.tf, 40)) + lotsTable(X) +
        P('Le montant total théorique des loyers mensuels est de <b>' + (tot ? nf(tot) + ' FCFA' : '………… FCFA') + '</b>, sous réserve de la vacance, des impayés, des révisions de loyers ou de toute modification convenue par écrit.')],
      ['DURÉE',
        P('Le présent mandat prend effet à compter de sa signature pour une durée de ' + withWords(duree) + ' ans. À l’issue de cette période, il sera renouvelé par tacite reconduction pour des périodes successives de ' + withWords(recond) + ' ans, sauf dénonciation par l’une des Parties dans les conditions prévues à l’article 4.') +
        P('Si l’immeuble est encore en cours de travaux à la date de signature, les Parties pourront fixer par écrit une date de prise d’effet différente.')],
      ['RÉSILIATION ET FIN DU MANDAT',
        P('Chaque Partie peut s’opposer au renouvellement du mandat en notifiant sa décision à l’autre Partie au moins ' + withWords(preavis) + ' mois avant l’expiration de la période contractuelle en cours, par acte extrajudiciaire ou par tout moyen écrit permettant d’établir la réception de la notification.') +
        P('La résiliation anticipée du mandat peut intervenir d’un commun accord ou en cas de manquement grave de l’une des Parties à ses obligations, après mise en demeure restée sans effet dans un délai raisonnable, sauf urgence ou disposition légale contraire.') +
        P('Conformément aux règles du mandat, le Mandant peut révoquer le Mandataire. En cas de révocation abusive, la Partie lésée pourra demander la réparation du préjudice effectivement subi. Le Mandataire qui renonce abusivement au mandat pourra être tenu à réparation dans les mêmes conditions.') +
        P('La fin du mandat n’affecte pas les actes valablement accomplis antérieurement et n’exonère pas les Parties de leurs obligations nées avant sa cessation.')],
      ['HONORAIRES DE GESTION',
        P('En rémunération de sa mission, le Mandataire percevra des honoraires de gestion fixés à ' + tauxTxt + ' pour cent (' + String(taux).replace('.', ',') + ' %) des sommes effectivement encaissées au titre des loyers, majorés de la TVA applicable.') +
        P('Les honoraires sont calculés sur les sommes effectivement encaissées et sont prélevés selon la périodicité de reversement convenue entre les Parties. Un bordereau détaillé sera remis au Mandant à l’appui de chaque reversement.') +
        P('Toute modification du taux d’honoraires devra faire l’objet d’un accord écrit entre les Parties.')],
      ['OBLIGATIONS DU MANDATAIRE',
        UL(['Gérer le bien avec diligence et conformément aux instructions du Mandant, dans les limites du présent mandat.',
          'Rechercher et sélectionner les locataires, préparer et faire signer les contrats de location dans les limites de ses pouvoirs.',
          'Percevoir les loyers, dépôts de garantie et autres sommes autorisées au titre des locations.',
          'Tenir le Mandant régulièrement informé de la gestion et lui transmettre au moins ' + withWords(comptes) + ' fois par an un compte détaillé de gestion, sans préjudice du droit du Mandant de demander des informations complémentaires.',
          'Restituer au Mandant les sommes lui revenant, déduction faite des honoraires et dépenses autorisées ou justifiées.',
          'Conserver et communiquer les pièces justificatives relatives aux encaissements, dépenses et démarches effectuées pour le compte du Mandant.'])],
      ['POUVOIRS CONFIÉS AU MANDATAIRE',
        P('Pour l’exécution de sa mission, le Mandant donne au Mandataire pouvoir de :') +
        UL(['mettre en location les lots désignés à l’article 2, aux conditions validées ou compatibles avec les instructions du Mandant ;',
          'renouveler ou résilier les locations dans les limites de la réglementation applicable et du présent mandat ;',
          'donner et recevoir les congés et notifications nécessaires à la gestion locative ;',
          'percevoir les loyers, dépôts de garantie et autres sommes légalement exigibles ;',
          'engager, lorsque cela est nécessaire et dans la limite d’un pouvoir spécial, les procédures judiciaires ou extrajudiciaires utiles au recouvrement des loyers et à la protection des intérêts du Mandant ;',
          'transiger ou conclure un accord amiable uniquement dans la limite d’un pouvoir spécial ou d’une autorisation écrite du Mandant lorsque celle-ci est requise ;',
          'délivrer les quittances, reçus et décharges correspondant aux sommes effectivement encaissées ;',
          'accomplir, plus généralement, les actes nécessaires à la bonne administration du bien, dans les limites du présent mandat.']) +
        P('Le Mandataire ne peut aliéner, hypothéquer ou autrement disposer de l’immeuble sans un pouvoir spécial et écrit du Mandant.')],
      ['IMPAYÉS ET FRAIS DE RECOUVREMENT',
        P('En cas d’impayé, le Mandataire entreprendra les diligences amiables et, si nécessaire, les démarches judiciaires appropriées, dans les limites de ses pouvoirs.') +
        P('Les frais judiciaires et extrajudiciaires nécessaires au recouvrement, lorsqu’ils sont engagés pour le compte du Mandant, pourront être avancés par le Mandataire sur présentation des justificatifs. Ces avances seront remboursées par le Mandant, sauf lorsqu’elles résultent d’une faute du Mandataire.') +
        P('Le Mandataire n’est pas garant du paiement des loyers par les locataires, sauf engagement écrit contraire.')],
      ['ÉTAT DU BIEN ET TRAVAUX',
        P('Le Mandataire prend le bien en gestion dans son état au jour de la prise d’effet du mandat. Il ne répond pas des vices, malfaçons, défauts de construction ou dégradations antérieurs à sa prise en charge, sauf faute qui lui serait personnellement imputable.') +
        (travaux.length ? P('Restent notamment à la charge du Mandant, sous réserve des obligations légales des locataires ou des entreprises responsables :') + UL(travaux.map(esc)) : '') +
        P('Les travaux importants ou non urgents seront, sauf urgence, soumis à l’accord préalable du Mandant. Les travaux urgents nécessaires à la sauvegarde du bien ou à la sécurité des occupants pourront être engagés dans la limite des nécessités, avec information rapide du Mandant.')],
      ['OBLIGATIONS DU MANDANT',
        UL(['mettre le Mandataire en mesure d’exécuter sa mission et lui remettre les documents utiles relatifs au bien ;',
          'payer ou rembourser les dépenses et avances engagées régulièrement pour l’exécution du mandat, sur justificatifs ;',
          'assurer ou faire assurer le bien contre les risques relevant de sa qualité de propriétaire ;',
          'informer le Mandataire de toute décision ou circonstance susceptible d’affecter la gestion du bien ;',
          'régler les impôts, taxes, charges et dépenses qui restent légalement à sa charge.'])],
      ['DÉCLARATION FISCALE',
        P('Si le Mandant souhaite confier au Mandataire l’accomplissement de formalités fiscales, il devra lui donner une instruction écrite précisant la mission confiée et lui fournir, sous sa responsabilité, les informations et justificatifs nécessaires.') +
        P('La responsabilité du Mandataire ne pourra être engagée du fait d’une information inexacte, incomplète ou tardivement communiquée par le Mandant.')],
      ['REVERSEMENT DES LOYERS',
        P('Les loyers encaissés seront reversés au Mandant sur le compte suivant :') +
        '<p class="cpt">Banque : ' + dots(v.banque, 60) + '<br>Titulaire du compte : ' + dots(v.titulaire, 55) + '<br>Numéro de compte / IBAN : ' + dots(v.iban, 50) + '</p>' +
        P('À défaut, les Parties peuvent convenir par écrit d’un reversement par service de monnaie électronique, notamment Wave ou Orange Money, sous réserve des règles applicables et de la traçabilité des opérations.') +
        P('Les modalités de reversement ne pourront être modifiées que sur instruction écrite du Mandant.')],
      ['RESPONSABILITÉ',
        P('Chaque Partie répond des manquements qui lui sont personnellement imputables. Le Mandataire est responsable de l’exécution de sa mission dans les conditions prévues par la loi. Il ne répond pas des impayés, de la vacance locative, des vices cachés, de la vétusté ou des événements de force majeure qui ne lui sont pas imputables.') +
        P('Toute limitation de responsabilité s’applique sous réserve des dispositions impératives de la loi.')],
      ['NOTIFICATIONS ET RÈGLEMENT DES DIFFÉRENDS',
        P('Les Parties s’engagent à rechercher en priorité une solution amiable à tout différend relatif à l’interprétation ou à l’exécution du présent mandat.') +
        P('À défaut d’accord amiable, le litige sera porté devant la juridiction sénégalaise compétente, conformément aux règles de compétence applicables.')],
      ['DISPOSITIONS FINALES',
        P('Toute modification du présent mandat doit être constatée par écrit et signée par les Parties.') +
        P('Si une stipulation du présent mandat est déclarée nulle ou inapplicable, les autres stipulations demeureront en vigueur, dans la mesure permise par la loi.') +
        P('Le présent mandat est établi en ' + withWords(num(v.exemplaires) || 2) + ' exemplaires originaux, un pour chacune des Parties.')]
    ];
  }

  /* ── document ── */
  const mandantLabel = v => (v.civM ? v.civM + ' ' : '') + (v.mandant || '');
  const repLabel = v => (v.repCiv ? v.repCiv + ' ' : '') + (v.repNom || '');
  function parties(X) {
    const v = X.v, ag = X.ag;
    const pieceDate = v.cniDate ? dshort(v.cniDate) : '';
    const left = '<b>' + (mandantLabel(v).trim() ? esc(mandantLabel(v)) : dots('', 30)) + '</b><br>' +
      esc(v.typePiece || 'CNI') + ' n° ' + dots(v.cni, 14) + ', délivré(e) le ' + dots(pieceDate, 10) + ' à ' + dots(v.cniLieu, 10) + '<br>' +
      'Demeurant à ' + dots(v.adresseM, 34) + '<br>Tél. : ' + dots(v.telM, 16) + '<br>E-mail : ' + dots(v.emailM, 26);
    const right = '<b>' + esc(ag.nom.toUpperCase()) + '</b><br>Représenté par son ' + esc(v.repFonction || 'Administrateur') + ', ' + (repLabel(v).trim() ? '<b>' + esc(repLabel(v)) + '</b>' : dots('', 24)) + '<br>' + esc(ag.adresse) +
      (ag.rccm || ag.ninea ? '<br>' + [ag.rccm && 'RCCM : ' + esc(ag.rccm), ag.ninea && 'NINEA : ' + esc(ag.ninea)].filter(Boolean).join(' – ') : '') +
      (ag.tel ? '<br>Tél. : ' + esc(ag.tel) : '') + (v.autorisation ? '<br>Autorisation d’exercer n° ' + esc(v.autorisation) : '');
    return '<h5>Entre les soussignés</h5><table class="pt"><thead><tr><th>LE MANDANT / PROPRIÉTAIRE</th><th>LE MANDATAIRE / ADMINISTRATEUR DE BIENS</th></tr></thead><tbody><tr><td>' + left + '</td><td>' + right + '</td></tr></tbody></table>' +
      '<p class="def">Le Mandant et le Mandataire sont ci-après désignés individuellement comme la « Partie » et ensemble comme les « Parties ».</p>';
  }
  function signatures(X) {
    const v = X.v, ag = X.ag, nbx = num(v.exemplaires) || 2;
    const blk = (t, name, sub) => '<div class="sig"><h6>' + t + '</h6><p><b>' + esc(name) + '</b>' + (sub ? '<br><span>' + esc(sub) + '</span>' : '') + '</p><div class="lu">Lu et approuvé</div><div class="sg">Signature :</div><div class="line"></div></div>';
    return '<div class="fait"><b>Fait à ' + esc(v.lieu || 'Dakar') + ', le ' + (v.sign ? esc(dshort(v.sign)) : '…… / …… / ……….') + '</b><br><span>(En ' + lw(nbx) + ' exemplaires originaux)</span></div><div class="sigs">' +
      blk('LE MANDANT / PROPRIÉTAIRE', mandantLabel(v).trim() || '', '') +
      blk('LE MANDATAIRE / ADMINISTRATEUR DE BIENS', repLabel(v).trim() || ag.nom, repLabel(v).trim() ? (v.repFonction || '') + ', ' + ag.nom : '') + '</div>';
  }
  function html(oi, bienId) {
    const d = db(), X = context(d, oi, bienId), ag = X.ag, v = X.v;
    const arts = articles(X).map((a, i) => '<section class="art"><h3><i>' + String(i + 1).padStart(2, '0') + '</i>ARTICLE ' + (i + 1) + ' — ' + a[0] + '</h3>' + a[1] + '</section>').join('');
    const ref = X.num || '';
    const foot = 'Mandat de gérance immobilière – ' + esc((v.mandant || fname(X.o))) + ' / ' + esc(ag.nom);
    const head = '<div class="hd">' + (ag.logo ? '<img src="' + esc(ag.logo) + '" alt="">' : '') + '<div class="hn"><b>' + esc(ag.nom.toUpperCase()) + '</b><span>' + esc(ag.adresse) + '</span><span>' + [ag.rccm && 'RCCM : ' + esc(ag.rccm), ag.ninea && 'NINEA : ' + esc(ag.ninea)].filter(Boolean).join(' | ') + '</span></div></div>';
    return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>' + esc('MANDAT DE GÉRANCE IMMOBILIÈRE — ' + (v.mandant || fname(X.o))) + '</title><style>' +
      '@page{size:A4;margin:14mm 16mm 16mm;@bottom-center{content:"Page " counter(page) " / " counter(pages);font:8pt Arial;color:#9ca3af}}*{box-sizing:border-box}body{margin:0;font:10.5pt/1.5 "Segoe UI",Arial,sans-serif;color:#1f2937}table.pg{width:100%;border-collapse:collapse}table.pg>thead>tr>td,table.pg>tbody>tr>td,table.pg>tfoot>tr>td{padding:0}' +
      '.hd{display:flex;align-items:center;gap:14px;border-bottom:2px solid #b8962e;padding-bottom:8px;margin-bottom:10px}.hd img{height:54px;max-width:130px;object-fit:contain}.hn b{display:block;font-size:12.5pt;letter-spacing:.3px;color:#111827}.hn span{display:block;font-size:8.5pt;color:#6b7280}' +
      '.ft{border-top:1px solid #e5e7eb;margin-top:8px;padding-top:5px;text-align:center;font-size:7.5pt;color:#6b7280}' +
      '.ttl{background:#111827;color:#fff;border-radius:6px;padding:14px 18px;margin:6px 0 14px;border-left:6px solid #b8962e}.ttl h1{margin:0;font-size:16pt;letter-spacing:.8px}.ttl small{display:block;margin-top:3px;color:#d6c27a;font-size:8.5pt}' +
      '.parties{background:#faf8f1;border:1px solid #eee3bd;border-radius:6px;padding:10px 16px;margin-bottom:12px}.parties h5{margin:0 0 6px;font-size:9pt;letter-spacing:1.2px;text-transform:uppercase;color:#a07d1c}' +
      'table.pt{width:100%;border-collapse:collapse;background:#fff}table.pt th{background:#111827;color:#fff;font-size:8.5pt;letter-spacing:.5px;text-align:left;padding:5px 8px;border:1px solid #111827}table.pt td{vertical-align:top;border:1px solid #d6c27a;padding:7px 8px;font-size:9.5pt;width:50%}.def{margin:8px 0 0;text-align:justify}' +
      '.art{margin:0 0 9px;break-inside:avoid}.art h3{margin:0 0 3px;font-size:10.5pt;color:#111827;display:flex;align-items:center;gap:8px}.art h3 i{font-style:normal;background:#b8962e;color:#fff;border-radius:4px;padding:1px 6px;font-size:8.5pt}.art p{margin:0 0 4px;text-align:justify}.art ul{margin:2px 0 4px 18px;padding:0}.art p.cpt{line-height:1.9}' +
      'table.lots{width:100%;border-collapse:collapse;margin:4px 0 6px;font-size:9.5pt}table.lots th{background:#f3ecd0;border:1px solid #d6c27a;padding:4px 7px;text-align:left;font-size:8.5pt}table.lots td{border:1px solid #e5e7eb;padding:4px 7px}table.lots tr.tt td{font-weight:700;background:#faf8f1}' +
      '.fait{text-align:center;margin:16px 0 10px;break-inside:avoid}.fait span{font-size:9.5pt;color:#4b5563}.sigs{display:flex;gap:18px;break-inside:avoid}.sig{flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;min-height:140px}.sig h6{margin:0 0 6px;font-size:9pt;letter-spacing:.6px;color:#a07d1c}.sig p{margin:0 0 8px;font-size:10pt}.sig p span{font-size:8.5pt;color:#6b7280}.lu{font-size:9pt;color:#374151}.sg{font-size:9pt;color:#6b7280;margin-top:6px}.line{border-bottom:1px dashed #9ca3af;margin-top:30px}' +
      '</style></head><body><table class="pg"><thead><tr><td>' + head + '</td></tr></thead><tfoot><tr><td><div class="ft">' + foot + '</div></td></tr></tfoot><tbody><tr><td>' +
      '<div class="ttl"><h1>MANDAT DE GÉRANCE IMMOBILIÈRE</h1>' + (ref ? '<small>Réf. ' + esc(ref) + '</small>' : '') + '</div><div class="parties">' + parties(X) + '</div>' + arts + signatures(X) + '</td></tr></tbody></table><script>window.onload=function(){setTimeout(function(){window.print()},500)}<\/script></body></html>';
  }
  function build(oi, bienId, win) {
    const w = win || window.open('', '_blank'); if (!w) return toast('Pop-up bloquée : autorisez les pop-ups pour générer le mandat', 'err');
    w.document.write(html(oi, bienId)); w.document.close();
  }

  /* ── style du bouton d'action (ligne propriétaire) ── */
  if (!document.getElementById('gpMandatCss')) {
    const st = document.createElement('style'); st.id = 'gpMandatCss';
    st.textContent = '.prop-action-btn.mandat{color:#6b7280}.prop-action-btn.mandat:hover{background:#fffbeb;border-color:#fde68a;color:#a07d1c}';
    (document.head || document.documentElement).appendChild(st);
  }

  window.GPMandat = { open: dialog, build, words, html, lotsFor };
  window.generateMandatGerance = dialog;
})();
