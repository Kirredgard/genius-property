# V55 — Logique source de vérité des biens

- Le statut d’un bien est calculé depuis les contrats actifs.
- Le statut de chaque unité est calculé depuis son contrat actif rattaché à la location.
- Une location/contrat conserve `uniteId` lorsque l’unité peut être identifiée.
- Le détail Locataires n’affiche que les locations actuellement occupées du bien, avec déduplication par location/contrat.
- Les anciennes locations/contrats d’un autre bien ne remontent plus dans le détail.
- Test automatisé : RET (2 unités, 2 contrats) => 2 unités Loué, 2 locataires ; Keur 2 (1 unité, 1 contrat) => 1 unité Loué, 1 locataire.
