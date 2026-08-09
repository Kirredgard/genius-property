# Legacy Cleanup Phase 2 V21

## Ajouts

- `index.v21-production.html`
- `scripts/audit-legacy-strict.mjs`
- `npm run audit:legacy:strict`
- `npm run quality:prod-candidate`

## Objectif

Préparer une version V21 candidate production où :

- legacy désactivé
- hotfixes désactivés
- pages V21 utilisées comme source de vérité
- scripts legacy seulement audités, pas chargés

## Commandes

```bash
npm run quality:prod-candidate
npm run dev
```

Puis ouvrir :

```txt
http://localhost:5173/index.v21-production.html
```

## Checklist suppression legacy

1. Tester toutes les pages `.v21.html`
2. Vérifier Auth réel
3. Vérifier Firestore réel
4. Vérifier Storage réel
5. Lancer `npm run audit:legacy:strict`
6. Supprimer un fichier legacy à la fois
7. Relancer `npm run quality:prod-candidate`
8. Commit uniquement si build/test OK

## À ne pas faire

Ne pas supprimer brutalement `app.legacy.bundle.js` tant que l’ancien `index.html` est encore utilisé en production.
