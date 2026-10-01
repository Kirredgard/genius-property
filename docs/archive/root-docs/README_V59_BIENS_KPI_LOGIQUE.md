# V59 — KPI Biens au niveau des unités

## Cause
Les cartes Biens mélangeaient deux niveaux métier : le statut d'une carte est calculé au niveau du bien, mais les disponibilités affichées dans les cartes sont au niveau des appartements.

Ainsi un bien partiellement loué était compté comme « Occupé » et non comme disponible, même s'il restait des appartements libres.

## Nouvelle règle
- Biens = nombre de biens enregistrés.
- Unités disponibles = nombre d'appartements/unités sans contrat actif.
- Unités occupées = nombre d'appartements/unités avec contrat actif.
- Le statut de la carte reste : Disponible / Partiellement loué / Loué.
- Le filtre inclut désormais « Partiellement loué ».

Exemple des données de test :
- RET : 1 occupée, 1 disponible
- Keur 2 : 1 occupée, 0 disponible
- Maison : 1 occupée, 2 disponibles
- Total : 3 biens, 3 unités occupées, 3 unités disponibles, 6 unités.
