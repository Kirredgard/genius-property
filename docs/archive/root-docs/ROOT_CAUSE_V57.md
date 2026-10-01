# V57 — Biens / détail : source unique de vérité

## Règle métier
Le détail d'un bien doit afficher uniquement les occupants actuels de ses unités :

**Bien → Unité → Location → Contrat actif → Locataire**

Une location d'un autre bien ne doit jamais remonter dans le détail.

## Correction
- Le renderer final du détail construit les locataires uniquement à partir des unités occupées du `propertySnapshot()` canonique.
- Le KPI `Locations` compte les unités actuellement occupées, pas les lignes trouvées dans `locatives`.
- La résolution d'un contrat pour une unité passe d'abord par sa `Location` et son `uniteId`.
- Un `bienId` ancien/incohérent ne suffit plus à rattacher un contrat à une autre unité.
- `relations-v52.js` est chargé avant `bien-detail-final.js`; le renderer canonique est donc chargé après la couche de relations.
- Les anciennes fonctions du fichier `missing-actions.js` restent uniquement pour les actions historiques (PDF/documents/etc.) et ne sont pas utilisées comme renderer du détail.

## Vérification
Le test `scripts/test-biens-relations-v56.mjs` passe toujours :
- RET : 2 unités / 2 occupants
- Keur 2 : 1 unité / 1 occupant
- relation volontairement corrompue : réparation correcte
- RET partiellement occupé : 1 unité libre

Le JavaScript des deux fichiers modifiés passe `node --check`.
