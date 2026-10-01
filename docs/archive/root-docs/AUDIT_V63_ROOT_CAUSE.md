# V63 — Audit root-cause : images, modifications et propriétaires

## Causes identifiées

### 1. Photos des formulaires Bien / Propriétaire
Le formulaire GPV10 remplaçait le `<input type=file>` après la prévisualisation de l'image. Le nouveau input ne contenait plus le fichier sélectionné. Au moment du save, `getPhoto()` lisait donc un input vide et enregistrait `photo: ''`.

Correction : le preview est mis à jour sans remplacer l'input. Une couche `GPMedia` compresse les images avant persistance (JPEG, côté long 1600 px, qualité 0.80) afin d'éviter les échecs de localStorage liés aux gros Data URLs.

### 2. Messages de succès alors que la modification pouvait ne pas être persistée
Plusieurs wrappers ignoraient le retour `false` de `GPDB.save()`. Or `GPDB.save()` refuse explicitement une écriture obsolète (révision locale plus ancienne) ou peut échouer sur localStorage.

Correction : les chemins de modification utilisés par les pages modernes propagent maintenant `false`, n'affichent plus « Modification enregistrée » en cas d'échec, et rechargent le snapshot canonique après une écriture réussie.

### 3. Nombre de biens d'un propriétaire toujours à 0
`renderProprietairesModern()` appelait `window.getProprietaireBiens(p)`, mais aucune implémentation de cette fonction n'était fournie dans V62. Le fallback retournait donc 0.

Correction : `relations-v52.js` expose désormais `getProprietaireBiens()` basé d'abord sur `proprietaireId`, puis sur le nom historique uniquement en compatibilité. Le même service est utilisé dans le détail du propriétaire et dans le détail d'un bien.

## Tests de relation

- Propriétaire PR1 + Bien BI1 : `getProprietaireBiens(PR1) === 1`.
- RET + 2 unités + contrat actif sur Appartement 2 : Appartement 1 = Disponible, Appartement 2 = Loué, statut du bien = Partiellement loué.
- 3 unités avec un ancien ID dupliqué : les IDs sont réparés et seule l'unité liée au contrat devient Louée.

## Règle d'architecture

La source de vérité métier reste :

Propriétaire → Bien → Unité → Location → Contrat → Locataire

Les statuts/projections présents dans `bien.unites[]` sont recalculés depuis les contrats actifs et ne doivent pas être utilisés comme source indépendante.
