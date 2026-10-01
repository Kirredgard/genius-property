# Plan de nettoyage Legacy V21

## Domaines déjà préparés en V21

- dashboard
- auth/firebase
- payments
- tenants
- properties
- contracts
- expenses
- documents
- reporting
- notifications

## Prochaine opération technique

Créer une cartographie du legacy :

- fonctions globales `window.*`
- scripts chargés par `index.html`
- hotfixes encore utilisés
- fonctions remplacées par V21
- fonctions à supprimer
- fonctions à garder temporairement en bridge

## Règle de migration

Ne jamais supprimer brutalement un global legacy sans :
1. équivalent V21 testé
2. façade de compatibilité si nécessaire
3. test Vitest minimal
4. entrée dans le changelog
