# V61 — source canonique Bien / Unité / Contrat

## Cause confirmée
La page Locations et la page Biens n utilisaient pas la meme representation pour l occupation d une unite. Locations pouvait montrer une location active alors que `biens[].unites[].statut` restait ancien (`Disponible`). Le renderer Biens avait encore un chemin de secours qui lisait ce champ denormalise.

## Regle metier
Pour une unite, l occupation actuelle est determinee par un **contrat actif** rattache a sa Location et a cette unite. `unites[].statut` est seulement une projection synchronisee pour compatibilite/affichage legacy.

## V61
- resolution robuste Bien/Unite a partir de tous les champs historiques (IDs + libelles composites) ;
- rattachement Contract -> Location -> Unite avant de lire le statut ;
- synchronisation de `unites[].statut`, `locataireId`, `locataire`, `loyer` depuis le contrat actif ;
- bien multi-unites = Disponible / Loue / Partiellement loue selon les unites ;
- une location/contrat d une autre unite ne peut plus contaminer une unite voisine ;
- si le contrat est termine/resilie, l unite redevient disponible meme si une ancienne location porte encore `statut: Loue` ;
- carte et detail consomment le meme snapshot canonique.

## Tests
- `node scripts/test-biens-relations-v56.mjs` : OK
- `node scripts/test-biens-relations-v61.mjs` : OK
- `node --check js/core/relations-v52.js` : OK
- `node --check js/pages/biens.js` : OK
- `node --check js/core/current-workflows.js` : OK
- `node --check js/core/bien-detail-final.js` : OK
