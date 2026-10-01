# Quarantaine Hotfixes V21

    ## Objectif

    Sortir les hotfixes du chargement automatique pour stabiliser la V21.

    ## Fichiers ajoutés

    - `js/v21/legacy/hotfix-loader.js`
    - `audit/v21/hotfix-quarantine-manifest.json`
    - `tests/v21/legacy/hotfix-loader.test.js`

    ## Activation

    Par défaut : désactivé.

    Activation temporaire :

    - `index.v21-clean.html?hotfix=1`
    - ou `window.GPV21_ENABLE_HOTFIXES = true`

    ## Hotfixes détectés

    | Fichier | Taille octets | Lignes | window.* |
    |---|---:|---:|---:|
    | `js/core/consolidated-hotfixes.js` | 122399 | 1055 | 267 |
| `js/core/avenir-kpi-fix.js` | 10869 | 320 | 34 |
| `js/core/paiements-avenir-button-final-fix.js` | 5775 | 134 | 16 |
| `js/core/dashboard-actions-fix.js` | 4884 | 101 | 10 |
| `js/core/flicker-fix.js` | 1556 | 43 | 2 |

    ## Prochaine étape

    Remplacer les hotfixes par des correctifs dans les modules V21, puis supprimer les fichiers hotfix obsolètes.
