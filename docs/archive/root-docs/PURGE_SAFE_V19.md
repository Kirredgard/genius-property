# V19 — Purge sûre + préparation migration legacy

Base utilisée : `genius-v48-v18-refactor-clean.zip`

## Ce qui a été fait

- Suppression uniquement des fichiers clairement temporaires/legacy/debug/audit non référencés dans `index.html`.
- Inventaire des fichiers CSS/JS présents mais non chargés directement par `index.html`.
- Vérification finale des références cassées.
- Préparation de la liste des exports `window.*` présents dans `app.legacy.bundle.js`.

## Fichiers supprimés

- app_fixed/app/AUDIT_REFACTOR_V18.md

## Fichiers modifiés

- Aucun fichier source modifié

## Références manquantes

0

Aucune référence manquante détectée.

## CSS/JS non référencés directement par index.html

> Attention : certains peuvent être importés dynamiquement par JavaScript. Je ne les ai donc pas supprimés automatiquement.

Nombre : 0

Aucun.



## Exports détectés dans `app.legacy.bundle.js`

Nombre affiché : 95

- `window.Chart`
- `window.DB`
- `window.__gpSyncModalTimer`
- `window.__gpUnifiedSupaClient`
- `window._bienDetailIdx`
- `window._pendingSuperAdminCb`
- `window._setSyncStatus`
- `window._showApp`
- `window.clearAssignee`
- `window.closeBienDetail`
- `window.closeDepModal`
- `window.closeEventForm`
- `window.closeFullAgendaModal`
- `window.closeGlobalSearch`
- `window.closeTopbarSearch`
- `window.currentUser`
- `window.delRow`
- `window.deleteAgendaEvent`
- `window.deleteAgendaEventById`
- `window.deleteFromModal`
- `window.doLogout`
- `window.fillContratSelects`
- `window.fillLocativeSelects`
- `window.fillProprioBien`
- `window.genererPDFContrat`
- `window.genererPDFOfficiel`
- `window.genererRecuPaiementPDF`
- `window.gpAddBienDetailDocument`
- `window.gpAddBienDocFinal`
- `window.gpAmCalMove`
- `window.gpAmRender`
- `window.gpAmRenderFull`
- `window.gpAmSelectDay`
- `window.gpBackToBiens`
- `window.gpDeleteBienDoc`
- `window.gpDeleteBienDocFinal`
- `window.gpDownloadBienDoc`
- `window.gpDownloadBienDocFinal`
- `window.gpFillAllExistingSelects`
- `window.gpMoveDashMonth`
- `window.gpPreviewBienDoc`
- `window.gpPreviewBienDocFinal`
- `window.gpRenderEmployeePicker`
- `window.gpSelectEmployee`
- `window.gpShowBDTab`
- `window.gpSwitchBienDetailTabFinal`
- `window.gpSwitchMoneyTab`
- `window.gpUChartObj`
- `window.gpUpdateJournalView`
- `window.gpUserChart`
- `window.gpUserMoney`
- `window.gpUserMoveMonth`
- `window.gp_exportData`
- `window.initDashboardCalendar`
- `window.navigate`
- `window.onload`
- `window.openBienDetail`
- `window.openEmployeePicker`
- `window.openEventForm`
- `window.openFullAgendaModal`
- `window.openPayModal`
- `window.renderBiens`
- `window.renderBiensCards`
- `window.renderBiensFinal`
- `window.renderBiensFinal2`
- `window.renderDashboard`
- `window.renderEmployesModern`
- `window.renderLocativesModernV11`
- `window.renderPage`
- `window.runTopbarSearch`
- `window.saveAgendaEvent`
- `window.saveBien`
- `window.saveContrat`
- `window.saveDB`
- `window.saveDepense`
- `window.saveEmploye`
- `window.saveLocataire`
- `window.saveLocative`
- `window.savePaiement`
- `window.saveProfilUser`
- `window.saveProprietaire`
- `window.saveRow`
- `window.syncContratFromLocataire`
- `window.syncContratFromLocative`
- `window.syncLocativeFromBien`
- `window.syncLocativeFromLocataire`
- `window.syncPayModalFromBien`
- `window.syncPayModalFromLocataire`
- `window.syncPayModalFromLocative`
- `window.toast`
- `window.toggleAgendaDone`
- `window.toggleGlobalSearch`
- `window.toggleTopbarSearch`
- `window.uid`
- `window.updateGlobalBreadcrumb`



## Suite recommandée V20

Pour supprimer réellement `app.legacy.bundle.js`, il faut migrer les exports `window.*` encore utilisés vers des fichiers propres, page par page :

1. Dashboard
2. Locataires
3. Biens / Locatives
4. Paiements
5. Dépenses
6. Quittances / Contrats
7. Paramètres

Ensuite on retire la ligne `<script src="js/app.legacy.bundle.js">` de `index.html`.
