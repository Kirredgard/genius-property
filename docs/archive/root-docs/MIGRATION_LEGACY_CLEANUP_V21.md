# Nettoyage Legacy V21 — Cartographie et registre

    ## Objectif

    Préparer la réduction réelle du legacy sans casser l’application.

    ## Audit généré

    Fichier créé :

    - `audit/v21/legacy-map.json`

    ## Totaux observés

    - fichiers JS analysés : 120
    - fichiers index analysés : 2
    - occurrences `window.*` : 2869
    - fichiers contenant `window.*` : 78
    - candidats legacy : 3
    - fichiers hotfix/fix : 5

    ## Plus gros candidats legacy

    | Fichier | Taille octets | Lignes |
    |---|---:|---:|
    | `js/app.legacy.bundle.js` | 596316 | 9364 |
| `js/core/legacy-bridge.js` | 1926 | 37 |
| `js/v21/core/legacy-quarantine.js` | 431 | 13 |

    ## Hotfixes détectés

    | Fichier | Taille octets | Lignes |
    |---|---:|---:|
    | `js/core/consolidated-hotfixes.js` | 122399 | 1055 |
| `js/core/avenir-kpi-fix.js` | 10869 | 320 |
| `js/core/paiements-avenir-button-final-fix.js` | 5775 | 134 |
| `js/core/dashboard-actions-fix.js` | 4884 | 101 |
| `js/core/flicker-fix.js` | 1556 | 43 |

    ## Fichiers avec le plus de `window.*`

    | Fichier | Occurrences |
    |---|---:|
    | `js/app.legacy.bundle.js` | 458 |
| `js/core/consolidated-hotfixes.js` | 267 |
| `js/core/runtime.js` | 220 |
| `js/pages/biens.js` | 193 |
| `js/pages/locataires.js` | 115 |
| `js/pages/paiements.js` | 110 |
| `js/core/firebase-auth.js` | 87 |
| `js/pages/contrats.js` | 71 |
| `js/pages/dashboard-desktop.js` | 70 |
| `js/pages/depenses.js` | 66 |
| `js/firebase.js` | 62 |
| `js/pages/proprietaires.js` | 61 |
| `js/core/firebase-adapter.js` | 60 |
| `js/pages/locatives.js` | 58 |
| `js/core/ui-functions.js` | 54 |

    ## Ajout technique

    Nouveau registre :

    - `js/v21/legacy/legacy-registry.js`
    - `js/v21/legacy/legacy-domain-status.js`

    Ce registre permet de centraliser les anciens globals au lieu d’en créer partout.

    ## Prochaine étape recommandée

    1. remplacer les façades `window.GPV21*` par `registerLegacyGlobal`
    2. créer un `index.v21-clean.html` qui charge uniquement les modules V21
    3. déplacer le chargement legacy dans `legacy-loader.js`
    4. désactiver domaine par domaine les scripts remplacés
    5. mesurer la réduction du bundle legacy
