/* Genius Property V15 — module Dashboard
   Objectif : isoler les indicateurs du tableau de bord hors du bundle legacy.
   Le module reste défensif : il lit DB si disponible, sinon localStorage via GP.
*/
(function(){
  'use strict';

  const db = () => (window.GPDB && window.GPDB.load ? window.GPDB.load() : (window.GP && window.GP.getDB ? window.GP.getDB() : (window.DB || {}))) || {};
  const list = (name) => Array.isArray(db()[name]) ? db()[name] : [];
  const num = (value) => window.GP && window.GP.num ? window.GP.num(value) : Number(value || 0) || 0;
  const money = (value) => window.GP && window.GP.money ? window.GP.money(value) : (Math.round(num(value)).toLocaleString('fr-FR') + ' FCFA');
  const norm = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const todayKey = () => window.GP && window.GP.todayKey ? window.GP.todayKey() : new Date().toISOString().slice(0, 10);

  function computeStats(){
    if (window.GP_Rapports && typeof window.GP_Rapports.summarize === 'function') {
      const report = window.GP_Rapports.summarize();
      return {
        biens: report.volumes.biens,
        locataires: report.volumes.locataires,
        locatives: report.volumes.locatives,
        contrats: report.volumes.contrats,
        contratsActifs: report.volumes.contratsActifs,
        paiements: report.volumes.paiements,
        depenses: report.volumes.depenses,
        tauxOccupation: report.volumes.tauxOccupation,
        totalAttendu: report.finances.totalAttendu,
        totalEncaisse: report.finances.totalEncaisse,
        totalDepenses: report.finances.totalDepenses,
        reste: report.finances.reste,
        solde: report.finances.solde,
        totalEncaisseFmt: report.finances.totalEncaisseFmt,
        totalDepensesFmt: report.finances.totalDepensesFmt,
        resteFmt: report.finances.resteFmt,
        soldeFmt: report.finances.soldeFmt
      };
    }

    const paiements = list('paiements');
    const depenses = list('depenses');
    const locatives = list('locatives');
    const contrats = list('contrats');
    const totalAttendu = paiements.reduce((s, p) => s + num(p.montant || p.total || p.loyer), 0);
    const totalEncaisse = paiements.reduce((s, p) => s + num(p.paye || p.encaisse || p.montantPaye || p.montant), 0);
    const totalDepenses = depenses.reduce((s, d) => s + num(d.montant || d.total), 0);
    const occupees = locatives.filter(l => ['occupe','occupee','loue','louee'].includes(norm(l.statut))).length;
    const actifs = contrats.filter(c => !c.statut || ['actif','en cours','valide'].includes(norm(c.statut))).length;

    return {
      biens: list('biens').length,
      locataires: list('locataires').length,
      locatives: locatives.length,
      contrats: contrats.length,
      contratsActifs: actifs,
      paiements: paiements.length,
      depenses: depenses.length,
      tauxOccupation: locatives.length ? Math.round((occupees / locatives.length) * 100) : 0,
      totalAttendu,
      totalEncaisse,
      totalDepenses,
      reste: Math.max(0, totalAttendu - totalEncaisse),
      solde: totalEncaisse - totalDepenses,
      totalEncaisseFmt: money(totalEncaisse),
      totalDepensesFmt: money(totalDepenses),
      resteFmt: money(Math.max(0, totalAttendu - totalEncaisse)),
      soldeFmt: money(totalEncaisse - totalDepenses)
    };
  }

  function setText(id, value){
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function renderIntoDOM(){
    const stats = computeStats();

    // Mise à jour défensive des IDs courants ou futurs du dashboard.
    const map = {
      'dash-biens': stats.biens,
      'dash-locataires': stats.locataires,
      'dash-locatives': stats.locatives,
      'dash-contrats': stats.contrats,
      'dash-contrats-actifs': stats.contratsActifs,
      'dash-paiements': stats.paiements,
      'dash-depenses': stats.depenses,
      'dash-occupation': stats.tauxOccupation + '%',
      'dash-total-encaisse': stats.totalEncaisseFmt,
      'dash-total-depenses': stats.totalDepensesFmt,
      'dash-reste': stats.resteFmt,
      'dash-solde': stats.soldeFmt,
      'dash-last-refresh': todayKey()
    };
    Object.keys(map).forEach(id => setText(id, map[id]));

    return stats;
  }

  function refresh(){
    const stats = renderIntoDOM();
    window.dispatchEvent(new CustomEvent('gp:dashboard:refreshed', { detail: stats }));
    return stats;
  }

  window.GP_Dashboard = { computeStats, renderIntoDOM, refresh };
  window.gpDashboardStats = computeStats;
  window.gpRefreshDashboard = refresh;

  document.addEventListener('DOMContentLoaded', function(){
    try { refresh(); } catch(e) { console.warn('[GP Dashboard] refresh failed', e); }
  });

  // [cleaned] debug console statement removed
})();
