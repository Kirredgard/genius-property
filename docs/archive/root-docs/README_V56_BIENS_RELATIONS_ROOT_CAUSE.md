# V56 — Biens / Locations / Contrats : correction de fond

## Source de vérité
`Bien -> Unité -> Location -> Contrat actif -> Locataire`

## Corrections
- Les IDs stables sont utilisés pour les relations métier.
- Les anciens champs texte restent uniquement pour affichage/compatibilité.
- Une relation incohérente est réparée depuis les données legacy cohérentes au lieu d'être reconduite.
- Pour un immeuble, la disponibilité est calculée **par unité**.
- Une unité déjà couverte par un contrat actif n'est plus proposée dans le formulaire Location.
- Une autre unité libre du même immeuble reste disponible.
- Le détail d'un bien ne lit plus une liste globale de locations par nom : il lit le snapshot canonique du bien.
- Un bien simple avec contrat actif est Loué ; un immeuble partiellement occupé est Partiellement loué ; toutes les unités occupées = Loué.
- Le formulaire Location actif stocke directement `bienId`, `uniteId`, `locataireId`, `locationId` et les mêmes relations dans le contrat.
- Le renderer legacy du détail n'écrase plus le renderer final.

## Tests effectués
- JavaScript syntax check sur les fichiers modifiés.
- Cas RET : 2 unités + 2 contrats actifs -> 2 unités Loué + 2 locataires.
- Cas Keur 2 : 1 unité + 1 contrat actif -> 1 locataire uniquement.
- Cas de relation contractuelle volontairement corrompue -> réparation vers la location cohérente par texte/locataire.
- Cas RET partiellement occupé -> Partiellement loué + unité libre restante.
