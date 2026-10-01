# V58 — correction racine Biens / Unités / Locations

## Cause racine
`genId()` utilisait une numérotation basée sur la longueur des tableaux uniquement pour quelques préfixes (`EP`, `PR`, `LC`, `BI`). Pour `UNT`, `LOC` et `CT`, il retombait sur le même compteur `1` et produisait donc des IDs identiques.

Conséquence : plusieurs appartements pouvaient partager le même `uniteId`, plusieurs locations le même `locationId`, et plusieurs contrats le même `contractId`. Le détail d'un bien pouvait alors rattacher un seul contrat à plusieurs unités.

## Correction
- génération d'IDs réellement uniques pour toutes les entités ;
- migration automatique des anciens IDs dupliqués ;
- résolution des anciennes relations par bien + unité + locataire avant réparation des IDs ;
- snapshot canonique : `Bien -> Unité -> Location -> Contrat actif -> Locataire` ;
- occupation calculée au niveau de l'unité, jamais au niveau du bien pour un immeuble multi-appartements ;
- contrôle de disponibilité d'une nouvelle location au niveau de l'unité ;
- suppression du renderer V57 parallèle devenu inutile ;
- un seul renderer final du détail Bien est chargé.
