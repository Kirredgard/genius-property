# Patch index.html — Restauration Paramètres + Badge Abonnement
# À appliquer dans : index.html (V21)
# Date : 2026-05-26

## Ligne à modifier (environ ligne 2724)

### Remplacer :
```
<!-- désactivé nettoyage final: <script src="js/core/consolidated-hotfixes.js?v=20260523-consolidated" defer></script> -->
```

### Par :
```
<!-- désactivé nettoyage final: <script src="js/core/consolidated-hotfixes.js?v=20260523-consolidated" defer></script> -->
<script src="js/core/parametres-restore.js" defer></script>
<script src="js/core/sidebar-badge-restore.js" defer></script>
```

## Fichiers à copier dans js/core/
- parametres-restore.js    → js/core/parametres-restore.js
- sidebar-badge-restore.js → js/core/sidebar-badge-restore.js

## Ce que ça restaure
1. Page Paramètres : renderParametres() complet avec logo, agence, email, tél, adresse, RCCM, NINEA, thème
   (remplace le fallback générique de fallback-renderers.js)
2. Badge abonnement sidebar : badge doré avec plan, statut (Active/Expiré), date d'expiration
   (réactivé depuis consolidated-hotfixes.js qui était commenté)
3. Admin Central : déjà fonctionnel — admin-saas.js chargé, page HTML présente, rien à changer

## Rien à toucher
- page-parametres dans index.html  → identique à l'ancienne version ✓
- page-admin-saas dans index.html  → identique à l'ancienne version ✓
- admin-saas.js                    → identique à l'ancienne version ✓
- CSS badge (app-shell.css)        → déjà présent dans V21 ✓
