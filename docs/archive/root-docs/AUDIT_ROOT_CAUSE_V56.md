# Audit de fond — Biens / Détail / Locations

## Conclusion
Le problème n'était pas un simple calcul de statut. V55 mélangeait plusieurs modèles actifs :

1. `js/pages/biens.js` rendait les cartes.
2. `js/core/current-workflows.js` gérait le vrai formulaire Location utilisé par la navigation.
3. `js/pages/biens.js` contenait encore un second drawer Location/Contrat.
4. `js/core/missing-actions.js` contenait encore un renderer de détail Bien historique.
5. `js/core/bien-detail-final.js` redéfinissait ensuite le détail.
6. `js/core/relations-v52.js` migrait les relations avec des heuristiques texte et faisait confiance à des IDs déjà présents, même lorsqu'ils étaient incohérents.

Cela permettait à deux écrans de répondre différemment à la même question métier.

## Défaut de données principal
Le formulaire Location historique enregistrait un immeuble avec une valeur texte composite comme `RET - Appartement 1` dans `loc.bien`, mais sans `bienId`/`uniteId` stables. Le contrat faisait ensuite la même chose côté texte.

La migration pouvait alors inférer certaines relations, mais elle ne réparait pas systématiquement un ID déjà présent et incorrect.

## Défaut du détail
Le renderer historique `_bd_locativesForBien()` pouvait retrouver des locations par similarité de texte et ne filtrait pas la relation via le contrat actif. C'est incompatible avec la règle métier : le détail d'un bien doit afficher uniquement ses occupants actuels.

## Défaut de disponibilité
La sélection Location traitait parfois tout un immeuble comme occupé dès qu'un contrat actif existait, alors que RET possède plusieurs unités. La disponibilité doit être calculée au niveau de l'unité.

## V56
La source de vérité est maintenant :

`Bien -> Unité -> Location -> Contrat actif -> Locataire`

Les relations métier sont stockées par IDs :

- `bienId`
- `uniteId`
- `locationId`
- `contratId`
- `locataireId`
- `proprietaireId`

Les champs texte restent pour affichage et compatibilité.

Le détail et la carte utilisent le même `propertySnapshot()`.

Le renderer historique du détail n'écrase plus le renderer final.

## Tests
`node scripts/test-biens-relations-v56.mjs`

Cas testés :
- RET : 2 unités / 2 contrats actifs -> 2 unités louées / 2 locataires.
- Keur 2 : 1 unité / 1 contrat actif -> 1 seul locataire.
- Relation volontairement corrompue -> réparation vers la location correcte.
- RET partiellement occupé -> `Partiellement loué` + unité disponible.
