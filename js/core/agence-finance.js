/* Genius Property — Source unique des finances de l'agence.
 * Une seule définition de « dépense agence » et un seul calcul du revenu net agence,
 * utilisés par Situation, Activités et la barre de dépenses.
 *
 * Règle (identique à resolveDepenseType de la saisie des dépenses) :
 *   type 'bien'                          → dépense de bien (jamais agence)
 *   type 'agence' / 'Dépense agence'     → dépense agence
 *   type absent (anciennes données)      → agence, sauf catégories Entretien / Réparation / Travaux
 * NB : « facturable = non » n'est PAS un critère agence (il sert seulement à ne pas
 *      déduire une dépense du propriétaire dans « À reverser »).
 *
 * Revenu net agence = commissions + revenus d'activités (nets de leurs frais) − dépenses agence.
 */
(function () {
  'use strict';
  if (window.GPAgence) return;
  const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
  const num = v => { const n = Number(String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.').replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
  const db = () => (window.GPDB && GPDB.load ? GPDB.load() : (window.DB || {}));
  const pad = n => String(n).padStart(2, '0');
  const monthKey = v => {
    if (!v) return '';
    const s = String(v).trim(); let m = s.match(/^(\d{4})-(\d{2})/); if (m) return m[1] + '-' + m[2];
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/); return m ? m[3] + '-' + pad(m[2]) : '';
  };
  const TRAVAUX = ['entretien', 'reparation', 'travaux'];

  function isAgencyExpense(x) {
    if (!x) return false;
    const type = norm(x.type || x.typeDepense || x.type_depense);
    if (type === 'bien') return false;
    if (type === 'agence' || type === 'depense agence') return true;
    return TRAVAUX.indexOf(norm(x.cat || x.categorie || x.category)) < 0;
  }

  /** Total des dépenses agence dont la date tombe entre from et to (YYYY-MM inclus). */
  function expenses(from, to, data) {
    to = to || from;
    return (((data || db()).depenses) || []).reduce((s, x) => {
      const k = monthKey(x.date || x.dateDepense || x.createdAt);
      return k && k >= from && k <= to && isAgencyExpense(x) ? s + num(x.montant || x.amount) : s;
    }, 0);
  }

  /** { commission, activites, depenses, net } pour la période. commission peut être fournie (déjà calculée par l'écran). */
  function net(from, to, commission) {
    to = to || from;
    let act = 0;
    try { act = window.GPActivites ? GPActivites.revenue(from, to).total : 0; } catch (_) {}
    if (commission == null) {
      try { commission = window.GPSituation ? GPSituation.compute(db(), from, to, false).reduce((s, o) => s + (o.commission || 0), 0) : 0; } catch (_) { commission = 0; }
    }
    const dep = expenses(from, to);
    return { commission, activites: act, depenses: dep, net: commission + act - dep };
  }

  window.GPAgence = { isAgencyExpense, expenses, net, monthKey };
})();
