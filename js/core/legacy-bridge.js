/* Genius Property V19 — Legacy bridge
   Objectif: isoler app.legacy.bundle.js et mesurer ce qui dépend encore de lui.
   Ce fichier ne remplace pas le bundle legacy; il signale les fonctions encore attendues par l'interface. */
(function(){
  'use strict';

  const REQUIRED_LEGACY_APIS = [
    'navigate','toast','renderTable','updateSidebarBadges','auditLog','resetAfterSave',
    'renderPaiements','renderLocatairesModern','renderBiensCards','renderProprietairesCards',
    'renderDepenses','renderContrats','renderRapports','renderAvenir','renderEmpActivities',
    'renderEmployeeAgenda','gpAmRender','renderMessages','renderConvList','updateMsgBadge',
    'openImportModal','closeImportModal','previewPhoto','getPhotoData','toggleExportMenu',
    'exportListePDF','exportExcel','searchTbl','fillProprioBien','findUnitByFullName',
    'syncLocataireBienFromLocations','syncBienStatusFromUnits','parseGPDate','addOneMonthGP','formatGPDate'
  ];

  function report(){
    const missing = REQUIRED_LEGACY_APIS.filter(name => typeof window[name] !== 'function');
    const present = REQUIRED_LEGACY_APIS.filter(name => typeof window[name] === 'function');
    const modules = Object.keys(window.GPModules || {});
    const state = {
      legacyLoaded: typeof window.navigate === 'function' || typeof window.renderTable === 'function',
      extractedModules: modules,
      presentLegacyApis: present,
      missingLegacyApis: missing,
      dbHealth: window.GPDB && typeof window.GPDB.health === 'function' ? window.GPDB.health() : null
    };
    window.GPLegacyReport = state;
    if (missing.length) console.warn('[GP V19] APIs legacy manquantes:', missing);
    else console.info('[GP V19] Bridge legacy OK. Modules extraits:', modules.join(', '));
    return state;
  }

  window.GPLegacyBridge = { REQUIRED_LEGACY_APIS, report };
  window.addEventListener('DOMContentLoaded', () => setTimeout(report, 0));
})();
