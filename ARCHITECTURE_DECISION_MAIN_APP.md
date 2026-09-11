# Décision architecture frontend

Décision retenue : **l’architecture principale actuelle est conservée**.

- Entrée publique unique : `index.html`
- Architecture active : `js/core/`, `js/pages/`, scripts runtime référencés par `index.html`
- Services V21 conservés uniquement quand ils sont utilisés par l’app principale, par exemple `js/v21/ui/ui-stability.service.js`
- Anciennes pages multi-pages `.v21.html` retirées du build public et archivées dans `_archive/v21-multipages-html/`

Objectif : éviter deux architectures concurrentes en production tout en gardant une sauvegarde des écrans V21 pour migration future.

Pour restaurer une page V21 plus tard :
1. récupérer son fichier depuis `_archive/v21-multipages-html/`,
2. migrer sa logique utile dans l’app principale,
3. éviter de la remettre directement dans `vite.config.js` sans décision explicite.

## Nettoyage appliqué

- Les fichiers racine `*.v21.html` ont été archivés dans `_archive/v21-multipages-html/`.
- Le code V21 multi-pages non chargé par `index.html` a été archivé dans `_archive/v21-services-code/`.
- `vite.config.js` construit uniquement `index.html`.
- `firebase.json` continue de déployer `dist/`.
- `js/v21/ui/ui-stability.service.js` reste actif car il est référencé directement par `index.html`.
