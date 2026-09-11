# Rollback Plan V21

## Objectif

Pouvoir revenir rapidement à la version précédente si la V21 production pose problème.

## Avant déploiement

- [ ] sauvegarder le build précédent
- [ ] sauvegarder les anciennes règles Firestore
- [ ] sauvegarder les anciennes règles Storage
- [ ] noter l’ID de release hosting précédente
- [ ] vérifier backup Firestore
- [ ] vérifier accès admin Firebase

## Déclencheurs rollback

Rollback si :

- login impossible
- Firestore inaccessible
- Storage inaccessible
- erreur console bloquante globale
- perte d’accès multi-agence
- données critiques non visibles
- hausse brutale erreurs runtime

## Procédure rollback

1. Désactiver le déploiement en cours si possible.
2. Restaurer l’ancienne release hosting.
3. Restaurer les anciennes règles Firebase si les nouvelles bloquent l’accès.
4. Vérifier login.
5. Vérifier dashboard.
6. Vérifier Firestore/Storage.
7. Documenter l’incident dans `POST_DEPLOY_REPORT_V21.md`.

## Commandes indicatives

Selon ton hébergeur :

```bash
npm run build:production
```

Pour Firebase Hosting, utiliser la console Firebase ou la commande de rollback disponible dans ton workflow.

## Après rollback

- [ ] identifier cause exacte
- [ ] corriger en staging
- [ ] relancer `npm run production:ready`
- [ ] refaire déploiement seulement après validation
