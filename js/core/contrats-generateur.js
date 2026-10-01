/* Genius Property — Générateur de contrats de bail
 * Modèles : « Bail à usage d'habitation » (type Habitation) et « Bail à usage professionnel » (types Commercial / Bureau).
 * Sources : locataire, propriétaire (via le bien), bien/unité, contrat, + Paramètres (logo, agence, adresse, tél., e-mail, RCCM, NINEA).
 * Les champs absents de l'app (CNI, activité, TOM…) sont demandés dans une fenêtre et mémorisés dans contrats[].extra.
 * Remplace window.generateContratPDF / genererPDFContrat (index du tableau d.contrats).
 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const num = v => { const n = Number(String(v ?? '').replace(/\s/g, '').replace(',', '.').replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
  const db = () => (window.GPDB && GPDB.load ? GPDB.load() : (window.DB || {}));
  const save = async d => { if (window.GPDB && GPDB.save) return GPDB.save(d); window.DB = d; return typeof window.saveDB === 'function' ? window.saveDB() : true; };
  const toast = (m, t) => (typeof window.toast === 'function' ? window.toast(m, t) : alert(m));
  const LS = k => { try { return localStorage.getItem(k) || ''; } catch (_) { return ''; } };
  const fname = o => [o && o.prenom, o && o.nom].filter(Boolean).join(' ').trim() || (o && (o.nom || o.name)) || '';

  /* ── nombres en lettres (FCFA) ── */
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
  const money = n => words(n) + ' (' + nf(n) + ') FRANCS CFA';

  /* ── dates ── */
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function pd(v) { if (!v) return null; const s = String(v); let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return new Date(+m[1], +m[2] - 1, +m[3]); m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; }
  const dlong = v => { const d = pd(v); return d ? (d.getDate() === 1 ? '1er' : d.getDate()) + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear() : '…………………'; };
  const dshort = v => { const d = pd(v); return d ? String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear() : ''; };
  function duree(a, b) {
    const x = pd(a), y = pd(b); if (!x || !y) return '……………';
    const m = Math.round((y - x) / 2629800000); // ≈ mois
    if (m >= 12 && m % 12 === 0) { const n = m / 12; return (n === 1 ? 'un (01) an' : words(n).toLowerCase() + ' (' + String(n).padStart(2, '0') + ') ans'); }
    return m + ' mois';
  }
  function ratio(part, loyer) { if (!loyer || !part) return ''; const r = part / loyer; return Math.abs(r - Math.round(r)) < 0.001 && r >= 1 ? ', correspondant à ' + (Math.round(r) === 1 ? 'un (01) mois' : words(Math.round(r)).toLowerCase() + ' (' + String(Math.round(r)).padStart(2, '0') + ') mois') + ' de loyer' : ''; }

  /* ── collecte des données ── */
  function agency() {
    return { nom: LS('geniusproperty_agence') || 'Agence', email: LS('geniusproperty_email'), tel: LS('geniusproperty_tel'), adresse: LS('geniusproperty_adresse') || 'Dakar, Sénégal', rccm: LS('geniusproperty_rccm'), ninea: LS('geniusproperty_ninea'), logo: LS('geniusproperty_logo') };
  }
  function context(d, c) {
    try { window.GPRelationsV52 && GPRelationsV52.ensure(d); } catch (_) {}
    const t = (d.locataires || []).find(x => String(x.id) === String(c.locataireId || c.tenantId)) || (d.locataires || []).find(x => norm(fname(x)) === norm(c.locataire)) || {};
    const b = (d.biens || []).find(x => String(x.id) === String(c.bienId || c.propertyId)) || (d.biens || []).find(x => norm(x.nom) === norm(c.bien)) || {};
    const o = (d.proprietaires || []).find(x => String(x.id) === String(b.proprietaireId || b.proprioId || c.proprietaireId)) || (d.proprietaires || []).find(x => norm(fname(x)) === norm(b.proprio || b.proprietaire)) || {};
    const loc = (d.locatives || []).find(x => String(x.id) === String(c.locationId || c.locativeId)) || {};
    const pro = norm(c.type) !== 'habitation' && c.type;
    const ex = c.extra || {};
    const loyer = num(c.loyer) || num(loc.loyer);
    const desig = ex.desig || [c.uniteNom && b.nom && norm(c.uniteNom) !== norm(b.nom) ? c.uniteNom : '', b.nom ? 'situé' + (b.adresse ? ' à ' + b.adresse : '') : ''].filter(Boolean).join(', ') || b.adresse || c.bien || '';
    return {
      pro: !!pro, ag: agency(), t, b, o, c, loyer, charges: num(c.charges), caution: num(c.caution), honor: num(c.honor),
      v: Object.assign({
        civB: o.civilite || '', bailleur: fname(o) || '', repNom: LS('geniusproperty_representant'), repFonction: LS('geniusproperty_fonction') || 'Administrateur',
        civL: t.civilite || '', cni: t.cni || t.numpiece || '', cniDate: t.cniDate || t.deldeb || '', cniLieu: t.cniLieu || t.lieu || '',
        desig: desig || (b.nom ? b.nom + (b.adresse ? ', ' + b.adresse : '') : ''), lieu: 'Dakar', sign: c.sign || c.debut || '', exemplaires: pro ? '4' : '2',
        reconduction: '3', conge: '6', societe: t.entreprise || t.societe || '', ninea: t.ninea || '', qualite: 'Gérant(e)', activite: '', tom: '0', jourLimite: '5'
      }, ex)
    };
  }

  /* ── fenêtre de complément ── */
  function dialog(idx) {
    const d = db(), c = (d.contrats || [])[idx]; if (!c) return toast('Contrat introuvable', 'err');
    const X = context(d, c), v = X.v, pro = X.pro;
    const f = (id, label, val, type, ph) => '<div class="gpc-f"><label>' + label + '</label><input id="gpc-' + id + '" type="' + (type || 'text') + '" value="' + esc(val) + '" placeholder="' + esc(ph || '') + '"></div>';
    const sel = (id, label, val, opts) => '<div class="gpc-f"><label>' + label + '</label><select id="gpc-' + id + '">' + opts.map(o => '<option ' + (o === val ? 'selected' : '') + '>' + o + '</option>').join('') + '</select></div>';
    $('gpcOv') && $('gpcOv').remove();
    document.body.insertAdjacentHTML('beforeend', '<div id="gpcOv"><style>#gpcOv{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:14px}#gpcOv .m{background:#fff;border-radius:14px;max-width:640px;width:100%;max-height:92vh;display:flex;flex-direction:column;font-family:inherit}#gpcOv .h{padding:16px 20px;border-bottom:1px solid #e5e7eb}#gpcOv .h b{font-size:15px}#gpcOv .h small{display:block;color:#6b7280;margin-top:2px}#gpcOv .b{padding:14px 20px;overflow:auto;display:grid;grid-template-columns:1fr 1fr;gap:10px 12px}#gpcOv h4{grid-column:1/-1;margin:8px 0 0;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#a07d1c}.gpc-f label{display:block;font-size:11px;font-weight:700;margin-bottom:4px;color:#374151}.gpc-f input,.gpc-f select{width:100%;box-sizing:border-box;height:36px;border:1px solid #e5e7eb;border-radius:8px;padding:0 9px;font-size:12px}#gpcOv .f{padding:12px 20px;border-top:1px solid #e5e7eb;display:flex;justify-content:flex-end;gap:8px}#gpcOv button{border:1px solid #e5e7eb;background:#fff;border-radius:9px;padding:9px 14px;font-weight:700;font-size:12px;cursor:pointer}#gpcOv button.p{background:#111827;color:#fff;border-color:#111827}@media(max-width:560px){#gpcOv .b{grid-template-columns:1fr}}</style><div class="m"><div class="h"><b>Contrat de bail — ' + (pro ? 'usage professionnel' : 'usage d’habitation') + '</b><small>Vérifiez les informations. Ce qui manque restera en pointillés à compléter à la main.</small></div><div class="b">' +
      '<h4>Bailleur &amp; agence</h4>' + sel('civB', 'Civilité du bailleur', v.civB, ['', 'Monsieur', 'Madame']) + f('bailleur', 'Bailleur (propriétaire)', v.bailleur) + f('repNom', 'Représenté par (agence)', v.repNom, 'text', 'Ex : Babacar Sadikh FALL') + f('repFonction', 'Fonction', v.repFonction) +
      '<h4>' + (pro ? 'Preneur' : 'Locataire') + '</h4>' + sel('civL', 'Civilité', v.civL, ['', 'Monsieur', 'Madame', 'Mademoiselle']) + f('cni', 'CNI / Passeport n°', v.cni) + f('cniDate', 'Délivré(e) le', v.cniDate, 'date') + f('cniLieu', 'Délivré(e) à', v.cniLieu) +
      (pro ? f('societe', 'Société / Institut', v.societe) + f('ninea', 'NINEA du preneur', v.ninea) + f('qualite', 'Agissant en qualité de', v.qualite) + f('activite', 'Activité / enseigne', v.activite, 'text', 'Ex : salon de coiffure sous l’enseigne « … »') + f('tom', 'dont TOM (FCFA, 0 = non applicable)', v.tom, 'number') + f('jourLimite', 'Loyer payable au plus tard le (jour)', v.jourLimite, 'number') : '') +
      '<h4>Bail</h4>' + f('desig', 'Désignation des locaux', v.desig) + f('lieu', 'Fait à', v.lieu) + f('sign', 'Date de signature', v.sign, 'date') + f('exemplaires', 'Nombre d’exemplaires', v.exemplaires, 'number') +
      (pro ? '' : f('reconduction', 'Reconduction tacite (années)', v.reconduction, 'number') + f('conge', 'Préavis de congé (mois)', v.conge, 'number')) +
      '</div><div class="f"><button data-x>Annuler</button><button class="p" data-go>Générer le contrat</button></div></div></div>');
    $('gpcOv').onclick = async e => {
      if (e.target === $('gpcOv') || e.target.closest('[data-x]')) return $('gpcOv').remove();
      if (!e.target.closest('[data-go]')) return;
      const keys = ['civB', 'bailleur', 'repNom', 'repFonction', 'civL', 'cni', 'cniDate', 'cniLieu', 'desig', 'lieu', 'sign', 'exemplaires'].concat(pro ? ['societe', 'ninea', 'qualite', 'activite', 'tom', 'jourLimite'] : ['reconduction', 'conge']);
      const ex = {}; keys.forEach(k => { const el = $('gpc-' + k); if (el) ex[k] = el.value.trim(); });
      try { localStorage.setItem('geniusproperty_representant', ex.repNom || ''); localStorage.setItem('geniusproperty_fonction', ex.repFonction || ''); } catch (_) {}
      const d2 = db(); const c2 = (d2.contrats || [])[idx]; if (c2) { c2.extra = Object.assign({}, c2.extra, ex); await save(d2); }
      $('gpcOv').remove(); build(idx);
    };
  }

  /* ── clauses ── */
  const P = t => '<p>' + t + '</p>';
  function articlesHab(X) {
    const v = X.v, ag = X.ag, loy = X.loyer;
    const depot = X.caution ? 'Le Locataire verse à titre de dépôt de garantie la somme de <b>' + money(X.caution) + '</b>' + ratio(X.caution, loy).replace(', correspondant à', ', soit l’équivalent de').replace('de loyer', 'de loyer') + '.' : 'Le Locataire verse à titre de dépôt de garantie la somme de ……………… FRANCS CFA.';
    return [
      ['OBJET DU CONTRAT', P('Le Bailleur donne en location au Locataire, qui accepte, le logement décrit ci-dessous, exclusivement à usage d’habitation personnelle. Toute activité commerciale, professionnelle ou toute sous-location ou cession du bail est soumise aux conditions prévues par la législation applicable.')],
      ['DÉSIGNATION DES LOCAUX', P(esc(v.desig) || '………………………………………………')],
      ['DURÉE DU BAIL', P('Le présent bail est conclu pour une durée de ' + duree(X.c.debut, X.c.fin) + '. Il prend effet le <b>' + dlong(X.c.debut) + '</b> et arrive à échéance le <b>' + dlong(X.c.fin) + '</b>. Il est renouvelable par tacite reconduction pour des périodes de ' + words(num(v.reconduction) || 3).toLowerCase() + ' (' + String(num(v.reconduction) || 3).padStart(2, '0') + ') ans, sauf congé régulièrement donné dans les conditions légales.')],
      ['LOYER ET MODALITÉS DE PAIEMENT', P('Le montant du loyer mensuel est fixé à <b>' + money(loy) + '</b>' + (X.charges ? ', auquel s’ajoutent des charges mensuelles de <b>' + money(X.charges) + '</b>' : '') + '. <b>Le loyer est payable d’avance</b>. Il est exigible <b>au début de chaque mois de jouissance</b>.') + P('Tout paiement effectué par le locataire donne lieu à la délivrance d’une quittance par le bailleur.')],
      ['RÉVISION DU LOYER', P('Le présent bail étant conclu pour une durée déterminée, le loyer convenu ne peut être modifié pendant la durée du bail, sauf disposition légale impérative contraire. Toute modification applicable au renouvellement devra respecter la réglementation en vigueur.')],
      ['DÉPÔT DE GARANTIE', P(depot) + P('Cette somme ne constitue pas un loyer et ne peut pas être imputée sur le dernier mois de location.') + P('Après la restitution des clés et vérification de l’état des lieux, le dépôt est restitué au Locataire, déduction faite, le cas échéant, des sommes légalement dues ou des réparations imputables au Locataire et dûment justifiées.')],
      ['CHARGES ET CONSOMMATIONS', P('Sont à la charge du Locataire les consommations d’eau et d’électricité, les taxes ou redevances relatives à l’enlèvement des ordures ménagères lorsqu’elles lui incombent, ainsi que l’entretien courant du logement.')],
      ['ÉTAT DES LIEUX', P('Un état des lieux contradictoire est établi à l’entrée et à la sortie. Le Locataire restitue les lieux dans l’état où il les a reçus, sous réserve de l’usure normale résultant d’un usage conforme.')],
      ['ENTRETIEN ET RÉPARATIONS', P('Le Locataire assure l’entretien courant du logement et répond des dégradations qui lui sont imputables, ainsi que de celles causées par les personnes dont il répond.') + P('Les réparations autres que celles d’entretien, notamment celles résultant de la vétusté, d’un vice ou d’un défaut de la chose louée, restent à la charge du Bailleur lorsqu’elles lui incombent légalement.') + P('Le Locataire ne pourra, pendant toute la durée de la jouissance des locaux, effectuer aucun aménagement, modification ou installation susceptible d’affecter la structure, la solidité, les équipements ou l’intégrité du bâtiment, sans en avoir préalablement informé ' + esc(ag.nom) + ' et obtenu son accord écrit lorsque celui-ci est requis.')],
      ['OBLIGATIONS DU LOCATAIRE', '<ul><li>Payer le loyer et les charges aux échéances convenues.</li><li>User paisiblement des lieux et conformément à leur destination d’habitation.</li><li>Respecter le voisinage, les règles de sécurité et, le cas échéant, le règlement de copropriété.</li><li>Ne réaliser aucune transformation importante des lieux sans l’accord écrit du Bailleur lorsqu’il est requis.</li><li>Signaler sans délai toute dégradation ou réparation urgente.</li><li>Permettre l’accès aux lieux pour les réparations nécessaires et, en fin de bail, pour les visites convenues.</li></ul>'],
      ['RÉSILIATION ET CONGÉ', P('Le bail à durée déterminée prend fin à l’expiration du terme convenu, sous réserve des règles légales applicables.') + P('Pour mettre fin au bail à l’expiration d’une période, le congé doit être donné au plus tard ' + words(num(v.conge) || 6).toLowerCase() + ' (' + String(num(v.conge) || 6).padStart(2, '0') + ') mois avant cette échéance, dans les formes prévues par la loi.') + P('En cas de manquement d’une partie à ses obligations, l’autre partie peut demander la résiliation du bail dans les conditions et selon la procédure prévues par la loi. La résiliation ne résulte pas d’une simple constatation unilatérale lorsque la procédure légale impose une mise en demeure ou l’intervention du juge.')],
      ['CESSION ET SOUS-LOCATION', P('Toute cession ou sous-location est soumise aux règles impératives applicables aux baux à usage d’habitation. Le Locataire doit respecter les obligations de notification ou d’autorisation prévues par la loi.')],
      ['VISITE DES LOCAUX', P('Lorsque le bail arrive à son terme ou lorsqu’un congé a été régulièrement donné, les visites destinées à permettre la relocation du logement sont organisées à des horaires raisonnables et après entente préalable avec le Locataire, sauf urgence.')],
      ['RETARD DE PAIEMENT', P('En cas de retard de paiement, le Bailleur peut adresser au Locataire une mise en demeure de payer les sommes dues et, en cas de persistance du manquement, engager les procédures prévues par la législation en vigueur. Aucune pénalité ou frais supplémentaire ne sera exigé en dehors de ce qui est légalement permis.')],
      ['ÉLECTION DE DOMICILE', P('Pour l’exécution du présent contrat, les parties élisent domicile à leurs adresses indiquées dans le présent acte. Toute modification d’adresse doit être notifiée à l’autre partie.')],
      ['LITIGES', P('Tout différend relatif à la validité, à l’interprétation, à l’exécution ou à la résiliation du présent bail sera réglé conformément à la législation sénégalaise. À défaut d’accord amiable, la partie la plus diligente pourra saisir la juridiction sénégalaise compétente.')],
      ['DISPOSITIONS FINALES', P('Les dispositions légales d’ordre public applicables au bail prévalent sur toute clause contraire du présent contrat. Toute modification du présent bail doit être constatée par écrit et respecter la législation en vigueur.')]
    ];
  }
  function articlesPro(X) {
    const v = X.v, tom = num(v.tom), total = X.loyer, ht = total - tom;
    const loyerTxt = tom > 0 ? '<ul class="plain"><li>Loyer HT : <b>' + nf(ht) + ' FCFA</b></li><li>TOM : <b>' + nf(tom) + ' FCFA</b></li><li>Total mensuel : <b>' + nf(total) + ' FCFA</b> (' + words(total).toLowerCase() + ' francs CFA)</li></ul>' : P('Le loyer mensuel est fixé à <b>' + money(total) + '</b>.');
    return [
      ['OBJET ET DÉSIGNATION DES LOCAUX', P('Le Bailleur donne à bail au Preneur, qui accepte, <b>' + (esc(v.desig) || '………………………………') + '</b>, destiné à l’exercice d’une activité professionnelle.') + P('Le Preneur déclare avoir visité les lieux, en connaître l’état et les accepter sous réserve de l’état des lieux contradictoire qui sera établi lors de la remise des clés.') + P('Le présent bail est soumis aux dispositions applicables au <b>bail à usage professionnel de l’Acte uniforme OHADA portant droit commercial général</b>.')],
      ['DESTINATION', P('Les locaux sont exclusivement destinés à l’exploitation d’' + (v.activite ? 'une activité de <b>' + esc(v.activite) + '</b>' : 'une activité <b>……………………………</b>') + '.') + P('Le Preneur s’engage à respecter les lois, règlements, règles sanitaires et de sécurité applicables à son activité ainsi que la tranquillité du voisinage.') + P('Toute modification de l’activité ou de la destination des locaux devra respecter les dispositions légales applicables et, lorsque cela est requis, faire l’objet de l’accord préalable et écrit du Bailleur.')],
      ['DURÉE', P('Le présent bail est conclu pour une durée de <b>' + duree(X.c.debut, X.c.fin) + '</b>, prenant effet le <b>' + dlong(X.c.debut) + '</b> et prenant fin le <b>' + dlong(X.c.fin) + '</b>, sous réserve des dispositions légales relatives au renouvellement et à la résiliation du bail.')],
      ['LOYER ET MODALITÉS DE PAIEMENT', P('Le loyer mensuel est fixé comme suit :') + loyerTxt + P('Le loyer est payable <b>mensuellement et d’avance, au plus tard le ' + (num(v.jourLimite) || 5) + ' de chaque mois</b>.') + (X.charges ? P('Des charges mensuelles de <b>' + nf(X.charges) + ' FCFA</b> s’ajoutent au loyer.') : '') + P('Les consommations d’eau et d’électricité sont à la charge du Preneur et seront calculées au moyen des compteurs divisionnaires installés à cet effet.') + P('<b>La TVA, si elle est légalement applicable au présent bail, sera facturée conformément à la réglementation fiscale en vigueur.</b>')],
      ['DÉPÔT DE GARANTIE ET COMMISSION D’AGENCE', P('À la signature du présent bail, le Preneur verse :') + '<ul><li><b>Dépôt de garantie : ' + (X.caution ? nf(X.caution) : '………………') + ' FCFA</b>' + ratio(X.caution, total) + ' ;</li><li><b>Commission d’agence : ' + (X.honor ? nf(X.honor) : '………………') + ' FCFA</b>' + ratio(X.honor, total) + '.</li></ul>' + P('Le dépôt de garantie garantit l’exécution des obligations du Preneur. Il pourra être utilisé, à la fin du bail, pour couvrir les loyers, charges, consommations ou réparations restant éventuellement dus.') + P('Le solde éventuel du dépôt de garantie sera restitué au Preneur après la libération des lieux et l’établissement de l’état des lieux de sortie.')],
      ['ENTRETIEN ET TRAVAUX', P('Le Preneur assure l’entretien courant des locaux et les réparations locatives résultant de son occupation.') + P('Il devra maintenir les lieux en bon état et les restituer dans un état conforme à celui constaté lors de l’entrée, compte tenu de l’usure normale.') + P('Les grosses réparations relevant légalement du Bailleur restent à la charge de celui-ci.') + P('Aucun travail modifiant la structure, la configuration ou les installations importantes des locaux ne pourra être réalisé sans l’autorisation préalable et écrite du Bailleur, lorsque celle-ci est requise.')],
      ['ASSURANCE ET RESPONSABILITÉ', P('Le Preneur s’engage à souscrire une assurance couvrant les risques liés à son activité et à l’occupation des locaux et à la maintenir pendant toute la durée du bail.') + P('Le Preneur est responsable de ses biens, équipements, marchandises et objets de valeur ainsi que des dommages causés par son activité, ses employés, clients ou prestataires, dans les limites prévues par la loi.')],
      ['CESSION, SOUS-LOCATION ET JOUISSANCE DES LOCAUX', P('Le Preneur ne pourra céder le bail ou sous-louer tout ou partie des locaux que dans le respect des dispositions légales applicables et, lorsque l’autorisation du Bailleur est requise, avec l’accord préalable et écrit de celui-ci.') + P('Le Preneur s’engage à jouir paisiblement des locaux et à ne causer aucun trouble anormal au voisinage.')],
      ['RÉSILIATION ET RESTITUTION DES LOCAUX', P('En cas de manquement du Preneur à ses obligations, notamment en cas de défaut de paiement du loyer, le Bailleur pourra le mettre en demeure de régulariser sa situation dans les conditions et délais prévus par les dispositions impératives de l’Acte uniforme OHADA.') + P('À défaut de régularisation dans le délai légal, le Bailleur pourra saisir la juridiction compétente afin de solliciter la résiliation du bail et, le cas échéant, l’expulsion du Preneur.') + P('Le Preneur pourra mettre fin au bail dans les conditions et formes prévues par la législation applicable.') + P('À l’expiration ou à la résiliation du bail, le Preneur devra libérer les locaux, régler les sommes dues, remettre les clés et participer à l’état des lieux de sortie.')],
      ['DROIT APPLICABLE ET RÈGLEMENT DES LITIGES', P('Le présent bail est soumis au <b>droit sénégalais et aux dispositions de l’Acte uniforme OHADA portant organisation du droit commercial général relatives au bail à usage professionnel</b>.') + P('Les Parties s’efforceront de régler à l’amiable tout différend relatif au présent contrat.') + P('À défaut d’accord amiable, le litige sera soumis à la <b>juridiction sénégalaise compétente</b>, conformément aux règles de compétence en vigueur.') + P('Les droits d’enregistrement et autres frais légalement mis à la charge du Preneur seront supportés par celui-ci.')]
    ];
  }

  /* ── document ── */
  const dots = (s, n) => s ? esc(s) : '.'.repeat(n || 22);
  function parties(X) {
    const v = X.v, ag = X.ag, tel = ag.tel ? ' Tél. : ' + esc(ag.tel) + '.' : '';
    const rep = v.repNom ? ', représenté par <b>' + esc((v.repNom)) + '</b>, ' + esc(v.repFonction || '') + ' de <b>' + esc(ag.nom) + '</b>, sis ' + esc(ag.adresse) : ', <b>' + esc(ag.nom) + '</b>, sis ' + esc(ag.adresse);
    const bail = '<p><b>' + (X.pro ? 'LE BAILLEUR' : 'Le Bailleur') + '</b>, ' + (v.bailleur ? esc((v.civB ? v.civB + ' ' : '') + v.bailleur) : '<b>' + esc(ag.nom) + '</b>') + (v.bailleur ? rep : '') + '.' + tel + '<br>Ci-après dénommé <b>« le Bailleur »</b>, d’une part ;</p>';
    const cni = 'CNI ou Passeport n° : ' + dots(v.cni, 18) + (v.cniDate || v.cniLieu ? ', délivré le ' + dots(dshort(v.cniDate), 10) + ' à ' + dots(v.cniLieu, 12) : '');
    const t = X.t, ttel = t.tel || t.telephone || '';
    const loc = X.pro
      ? '<p><b>LE PRENEUR</b><br>L’entreprise <b>' + dots(v.societe, 24) + '</b>, NINEA : ' + dots(v.ninea, 16) + ', représentée par <b>' + esc((v.civL ? v.civL + ' ' : '') + fname(t)) + '</b>, ' + cni + ', agissant en qualité de <b>' + esc(v.qualite || 'Gérant(e)') + '</b>.' + (ttel ? ' Tél. : ' + esc(ttel) + '.' : '') + '<br>Ci-après dénommé <b>« le Preneur »</b>, d’autre part.</p>'
      : '<p><b>' + esc((v.civL ? v.civL + ' ' : '') + fname(t)) + '</b><br>' + cni + (ttel ? '<br>Tél. : ' + esc(ttel) : '') + (t.adresse ? '<br>Demeurant : ' + esc(t.adresse) : '') + '<br>Ci-après dénommé <b>« le Locataire »</b>, d’autre part.</p>';
    return '<div class="parties"><h5>Entre les soussignés</h5>' + bail + '<div class="et">Et</div>' + loc + '<div class="conv">Il a été convenu et arrêté ce qui suit :</div></div>';
  }
  function signatures(X) {
    const v = X.v, ag = X.ag;
    const nbx = num(v.exemplaires) || (X.pro ? 4 : 2);
    const b = '<div class="sig"><h6>' + (X.pro ? 'LE BAILLEUR' : 'POUR LE BAILLEUR') + '</h6><p><b>' + esc(v.bailleur ? (v.civB ? v.civB + ' ' : '') + v.bailleur : ag.nom) + '</b>' + (v.repNom ? '<br>Représenté par <b>' + esc(v.repNom) + '</b><br>' + esc(v.repFonction || '') + ', ' + esc(ag.nom) : '') + '</p><div class="lu">Mention manuscrite : « Lu et approuvé »</div><div class="line"></div></div>';
    const l = '<div class="sig"><h6>' + (X.pro ? 'LE PRENEUR' : 'LE LOCATAIRE') + '</h6><p><b>' + esc(X.pro ? (v.societe || '') : (v.civL ? v.civL + ' ' : '') + fname(X.t)) + '</b>' + (X.pro ? '<br>Représenté par <b>' + esc((v.civL ? v.civL + ' ' : '') + fname(X.t)) + '</b><br>' + esc(v.qualite || '') : '') + '</p><div class="lu">Mention manuscrite : « Lu et approuvé »</div><div class="line"></div></div>';
    return '<div class="fait"><b>Fait à ' + esc(v.lieu || 'Dakar') + ', le ' + dlong(v.sign) + '.</b><br><span>En ' + words(nbx).toLowerCase() + ' (' + String(nbx).padStart(2, '0') + ') exemplaires originaux, un pour chacune des parties.</span></div><div class="sigs">' + (X.pro ? b + l : l + b) + '</div>';
  }
  function html(idx) {
    const d = db(), c = (d.contrats || [])[idx], X = context(d, c), ag = X.ag;
    const arts = (X.pro ? articlesPro(X) : articlesHab(X)).map((a, i) => '<section class="art"><h3><i>' + String(i + 1).padStart(2, '0') + '</i>ARTICLE ' + (i + 1) + ' — ' + a[0] + '</h3>' + a[1] + '</section>').join('');
    const title = X.pro ? 'BAIL À USAGE PROFESSIONNEL' : 'CONTRAT DE BAIL À USAGE D’HABITATION';
    const ref = c.num || c.numero || '';
    const foot = [ag.nom, ag.adresse, ag.tel && 'Tél. ' + ag.tel, ag.email, ag.rccm && 'RCCM ' + ag.rccm, ag.ninea && 'NINEA ' + ag.ninea].filter(Boolean).map(esc).join(' · ');
    const head = '<div class="hd">' + (ag.logo ? '<img src="' + esc(ag.logo) + '" alt="">' : '') + '<div class="hn"><b>' + esc(ag.nom) + '</b><span>' + esc(ag.adresse) + (ag.tel ? ' · ' + esc(ag.tel) : '') + '</span></div></div>';
    return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>' + esc(title + ' — ' + fname(X.t)) + '</title><style>' +
      '@page{size:A4;margin:14mm 16mm 16mm;@bottom-center{content:"Page " counter(page) " / " counter(pages);font:8pt Arial;color:#9ca3af}}*{box-sizing:border-box}body{margin:0;font:10.5pt/1.5 "Segoe UI",Arial,sans-serif;color:#1f2937}table.pg{width:100%;border-collapse:collapse}table.pg td{padding:0}' +
      '.hd{display:flex;align-items:center;gap:14px;border-bottom:2px solid #b8962e;padding-bottom:8px;margin-bottom:10px}.hd img{height:54px;max-width:130px;object-fit:contain}.hn b{display:block;font-size:12.5pt;letter-spacing:.3px;color:#111827}.hn span{font-size:8.5pt;color:#6b7280}' +
      '.ft{border-top:1px solid #e5e7eb;margin-top:8px;padding-top:5px;text-align:center;font-size:7.5pt;color:#6b7280}' +
      '.ttl{background:#111827;color:#fff;border-radius:6px;padding:14px 18px;margin:6px 0 14px;border-left:6px solid #b8962e}.ttl h1{margin:0;font-size:16pt;letter-spacing:.8px}.ttl small{display:block;margin-top:3px;color:#d6c27a;font-size:8.5pt}' +
      '.parties{background:#faf8f1;border:1px solid #eee3bd;border-radius:6px;padding:10px 16px;margin-bottom:12px}.parties h5{margin:0 0 6px;font-size:9pt;letter-spacing:1.2px;text-transform:uppercase;color:#a07d1c}.parties p{margin:5px 0}.et{text-align:center;font-weight:700;margin:4px 0}.conv{text-align:center;font-weight:700;margin-top:8px}' +
      '.art{margin:0 0 9px;break-inside:avoid}.art h3{margin:0 0 3px;font-size:10.5pt;color:#111827;display:flex;align-items:center;gap:8px}.art h3 i{font-style:normal;background:#b8962e;color:#fff;border-radius:4px;padding:1px 6px;font-size:8.5pt}.art p{margin:0 0 4px;text-align:justify}.art ul{margin:2px 0 4px 18px;padding:0}.art ul.plain{list-style:none;margin-left:6px}' +
      '.fait{text-align:center;margin:16px 0 10px;break-inside:avoid}.fait span{font-size:9.5pt;color:#4b5563}.sigs{display:flex;gap:18px;break-inside:avoid}.sig{flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;min-height:130px}.sig h6{margin:0 0 6px;font-size:9.5pt;letter-spacing:.8px;color:#a07d1c}.sig p{margin:0 0 8px;font-size:10pt}.lu{font-size:8.5pt;color:#6b7280}.line{border-bottom:1px dashed #9ca3af;margin-top:34px}' +
      '</style></head><body><table class="pg"><thead><tr><td>' + head + '</td></tr></thead><tfoot><tr><td><div class="ft">' + foot + '</div></td></tr></tfoot><tbody><tr><td>' +
      '<div class="ttl"><h1>' + title + '</h1>' + (ref ? '<small>Réf. ' + esc(ref) + '</small>' : '') + '</div>' + parties(X) + arts + signatures(X) + '</td></tr></tbody></table><script>window.onload=function(){setTimeout(function(){window.print()},500)}<\/script></body></html>';
  }
  function build(idx) {
    const w = window.open('', '_blank'); if (!w) return toast('Pop-up bloquée : autorisez les pop-ups pour générer le contrat', 'err');
    w.document.write(html(idx)); w.document.close();
  }

  window.GPContrat = { open: dialog, build, words, html };
  window.generateContratPDF = dialog;
  window.genererPDFContrat = dialog;
})();
