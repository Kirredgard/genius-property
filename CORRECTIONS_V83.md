# Corrections V83 (sur la base v82-mandat-gerance)

| Fichier | Correction |
|---|---|
| js/core/bien-detail-final.js | Bouton « Supprimer » de la fiche bien : appelait `deleteRow` (jamais défini). Remplacé par `gpDeleteBien`, qui refuse la suppression si le bien a un contrat actif ou une location rattachée. |
| js/core/v27-unified-actions.js | Ajout de `gpCloseActionsDrawer` (appelée par le fond, la croix et « Fermer » du tiroir d'actions, jamais définie). |
| js/core/runtime-final-v23.js | `contrats` → Locations, `droits` → Équipe, `fichiers` → Tableau de bord (plus de page blanche, y compris au démarrage via `gp_last_page`). Rétablit le contrôle des droits (`GPAuth.can`) que ce routeur contournait pour 17 pages. L'alias `locations` reste autorisé. |
| js/core/mandat-generateur.js | Le taux du mandat est synchronisé avec `commissionTaux` (celui lu par « Situation propriétaires ») et le préremplissage reprend le taux réellement appliqué. |
| js/core/current-finance-workflows.js | Une dépense enregistre maintenant `bienId` et `proprietaireId`. |
| js/core/situation-proprietaires.js | Les dépenses sont rattachées par ID d'abord, par nom ensuite (anciennes dépenses). |
| index.html | Paramètre `?v=v83-fix` sur les 6 scripts modifiés (cache). |

Non traité : `proprietaire-detail` (route sans accès), `dashboard-actions-fix.js` non chargé, identifiants admin/admin123 préremplis, clé Supabase vide, dette de versions (v27…v82) et dossier `js/v21/`.
