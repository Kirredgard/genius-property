# Nettoyage V50

{
  "version": "V50",
  "base": "genius-property-v49-encaissements-v2.zip",
  "removed": [
    "js/core/export-import-actions.js",
    "js/core/finance-list-v23.js",
    "js/core/finance-sidecards-restore.js",
    "js/core/v34-bien-detail-expense-indicators.js.bak"
  ],
  "reason": "Suppression des anciens systèmes runtime non chargés ou remplacés par des systèmes actifs.",
  "kept_dependencies": [
    "js/core/encaissements-v2.js — nouveau moteur d’échéancier",
    "js/core/current-finance-workflows.js — formulaire finance encore utilisé pour Dépenses",
    "js/core/finance-close-fix-v17.js — fermeture du drawer finance encore utilisé",
    "js/core/export-import-final-v46.js — système Export/Import actif",
    "js/core/v27-unified-actions.js — actions globales encore utilisées par plusieurs pages",
    "js/core/v37-clean-bien-click-expense-bar.js — clic Bien + indicateur Dépenses actif",
    "js/core/v39-compact-final.js — styles compacts actifs"
  ]
}