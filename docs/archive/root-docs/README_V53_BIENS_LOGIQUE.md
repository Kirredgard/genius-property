# V53 — Logique Biens / Détail du bien

## Règles métier
- Un bien ayant un contrat actif n’est jamais disponible.
- Le statut affiché sur la page Biens est calculé à partir du contrat actif, pas uniquement de `bien.statut`.
- Une location déjà couverte par un contrat actif n’est plus proposée pour un nouveau contrat.
- En modification, le bien/la location déjà lié reste sélectionnable.
- Le détail d’un bien affiche uniquement les locataires rattachés à ce bien via une location/contrat actif.
- Les anciens locataires et anciens contrats ne sont pas affichés comme locataire actuel.
- Les relations ID (`bienId`, `locationId`, `locataireId`, `contratId`) sont prioritaires, avec fallback legacy par nom.

## Corrections
- Correction du badge de la carte Bien : utilise le statut calculé.
- Correction de la détection d’un contrat actif via `contrat -> location -> bien`.
- Correction de la liste des biens proposés dans une nouvelle location.
- Correction de la liste des locations proposées pour un nouveau contrat.
- Correction du détail Bien : locataire actuel uniquement.
