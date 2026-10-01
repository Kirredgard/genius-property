# Migration Payments V21

## Réalisé

- Création du domaine `app/js/v21/modules/payments/`.
- Extraction de la logique métier testable : validation, montant payé, reste, statut.
- Ajout des helpers de formatage/parsing FCFA.
- Ajout d'un adaptateur DOM transitoire pour ne pas casser les écrans existants.
- Ajout d'une façade globale contrôlée : `GPV21Payments`, `savePaiementV21`, `updatePayResteV21`.
- Intégration dans `js/v21/main.js`.
- Ajout des tests Vitest `tests/payments.service.test.js`.
- Ajout du CSS `styles/v21/payments.css`.

## À faire à l'étape suivante

1. Brancher les boutons existants vers `savePaiementV21` et `updatePayResteV21`.
2. Remplacer progressivement `js/pages/paiements.js` par le rendu V21.
3. Déplacer la partie dépenses dans `js/v21/modules/expenses/`.
4. Supprimer les fonctions paiement du legacy après validation manuelle.
5. Ajouter les tests Firestore sur la collection `paiements`.

## Pourquoi le legacy n'est pas supprimé ici

Le fichier legacy contient encore des comportements UI mélangés : paiements, dépenses, biens, pagination, drawer finance et compatibilité mobile. Le supprimer d'un coup risquerait de casser l'application. Cette étape isole le coeur métier paiements pour réduire le risque avant remplacement UI complet.
