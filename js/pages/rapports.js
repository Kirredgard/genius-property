/* Genius Property V14 — module Rapports
   Objectif : isoler les calculs de synthèse et les exports simples hors du bundle legacy.
   Le module expose window.GP_Rapports et des alias compatibles pour l'interface existante.
*/
(function(){
  'use strict';

  const db = () => (window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.DB || {}));
  const save = () => (window.GPDB && window.GPDB.save ? window.GPDB.save(db()) : (typeof window.saveDB === 'function' ? window.saveDB() : undefined));
  const list = (name) => Array.isArray(db()[name]) ? db()[name] : [];
  const parseAmount = (value) => {
    if (window.GP && typeof window.GP.num === 'function') return window.GP.num(value);
    if (typeof window.num === 'function') return window.num(value);
    const cleaned = String(value ?? '').replace(/[^0-9,.-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
  const money = (value) => {
    if (window.GP && typeof window.GP.money === 'function') return window.GP.money(value);
    const n = Math.round(Number(value) || 0);
    return n.toLocaleString('fr-FR') + ' FCFA';
  };
  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  const notify = (message, type) => {
    if (typeof window.toast === 'function') return window.toast(message, type);
    console[type === 'err' ? 'error' : 'log'](message);
  };
  const dateKey = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  };
  const inRange = (value, start, end) => {
    const key = dateKey(value);
    if (!key) return false;
    if (start && key < start) return false;
    if (end && key > end) return false;
    return true;
  };

  function summarize(options = {}) {
    const start = options.start || options.from || '';
    const end = options.end || options.to || '';
    const paiements = list('paiements').filter(p => !start && !end ? true : inRange(p.date || p.createdAt || p.echeance, start, end));
    const depenses = list('depenses').filter(d => !start && !end ? true : inRange(d.date || d.createdAt, start, end));
    const biens = list('biens');
    const locataires = list('locataires');
    const locatives = list('locatives');
    const contrats = list('contrats');

    const totalAttendu = paiements.reduce((sum, p) => sum + parseAmount(p.montant || p.total || p.loyer), 0);
    const totalEncaisse = paiements.reduce((sum, p) => sum + parseAmount(p.paye || p.encaisse || p.montantPaye || p.montant), 0);
    const totalDepenses = depenses.reduce((sum, d) => sum + parseAmount(d.montant || d.total), 0);
    const reste = Math.max(0, totalAttendu - totalEncaisse);
    const solde = totalEncaisse - totalDepenses;

    const contratsActifs = contrats.filter(c => !c.statut || ['actif', 'en cours', 'valide'].includes(normalize(c.statut))).length;
    const locativesOccupees = locatives.filter(l => ['occupe', 'occupé', 'loué', 'loue'].includes(normalize(l.statut))).length;
    const tauxOccupation = locatives.length ? Math.round((locativesOccupees / locatives.length) * 100) : 0;

    return {
      periode: { debut: start || null, fin: end || null },
      volumes: {
        biens: biens.length,
        locataires: locataires.length,
        locatives: locatives.length,
        contrats: contrats.length,
        contratsActifs,
        paiements: paiements.length,
        depenses: depenses.length,
        tauxOccupation
      },
      finances: {
        totalAttendu,
        totalEncaisse,
        totalDepenses,
        reste,
        solde,
        totalAttenduFmt: money(totalAttendu),
        totalEncaisseFmt: money(totalEncaisse),
        totalDepensesFmt: money(totalDepenses),
        resteFmt: money(reste),
        soldeFmt: money(solde)
      }
    };
  }

  function exportJSON(options = {}) {
    const report = summarize(options);
    const payload = JSON.stringify(report, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    a.href = URL.createObjectURL(blob);
    a.download = `genius-property-rapport-${today}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    notify('Rapport exporté', 'ok');
    return report;
  }

  function exportCSV(options = {}) {
    const report = summarize(options);
    const rows = [
      ['Indicateur', 'Valeur'],
      ['Biens', report.volumes.biens],
      ['Locataires', report.volumes.locataires],
      ['Locatives', report.volumes.locatives],
      ['Contrats actifs', report.volumes.contratsActifs],
      ['Paiements', report.volumes.paiements],
      ['Dépenses', report.volumes.depenses],
      ['Taux occupation', report.volumes.tauxOccupation + '%'],
      ['Total attendu', report.finances.totalAttendu],
      ['Total encaissé', report.finances.totalEncaisse],
      ['Total dépenses', report.finances.totalDepenses],
      ['Reste à payer', report.finances.reste],
      ['Solde', report.finances.solde]
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    a.href = URL.createObjectURL(blob);
    a.download = `genius-property-rapport-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    notify('Rapport CSV exporté', 'ok');
    return report;
  }

  function printSummary(options = {}) {
    const report = summarize(options);
    console.table({
      'Total attendu': report.finances.totalAttenduFmt,
      'Total encaissé': report.finances.totalEncaisseFmt,
      'Total dépenses': report.finances.totalDepensesFmt,
      'Reste à payer': report.finances.resteFmt,
      'Solde': report.finances.soldeFmt,
      'Taux occupation': report.volumes.tauxOccupation + '%'
    });
    return report;
  }

  window.GP_Rapports = { summarize, exportJSON, exportCSV, printSummary };
  window.gpRapportSynthese = summarize;
  window.gpExportRapportJSON = exportJSON;
  window.gpExportRapportCSV = exportCSV;
  // [cleaned] debug console statement removed

  // Enregistrement auprès du routeur moderne pour la page 'rapports'
  document.addEventListener('DOMContentLoaded', function() {
    if (window.GPNavigation && typeof window.GPNavigation.registerRenderer === 'function') {
      window.GPNavigation.registerRenderer('rapports', function() {
        if (typeof window.renderRapports === 'function') window.renderRapports();
      });
    }
  });
})();
