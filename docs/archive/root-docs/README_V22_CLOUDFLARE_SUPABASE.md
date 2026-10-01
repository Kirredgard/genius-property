# Genius Property V22 — Cloudflare + Supabase Beta

## Objectif
Cette version part de `genius-property-v21-hotfix-employes-form-access(1).zip` et remplace le backend principal Firebase par Supabase, sans réécrire les pages métier.

### Architecture V22
- Frontend: Vite
- Hébergement cible: Cloudflare Pages
- Auth: Supabase Auth
- Données: Supabase PostgreSQL, table `gp_app_data`, payload JSONB en phase beta
- Stockage local: localStorage, conservé comme cache/offline
- Firebase: retiré du chemin d'exécution principal et archivé sous `_archive/firebase-v21/`

## Configuration
1. Dans Supabase, récupérer:
   - Project URL: `https://....supabase.co`
   - Publishable key: `sb_publishable_...`
2. Ouvrir Genius Property → Administration → Stockage.
3. Saisir l'URL et la Publishable key.
4. Cliquer `Enregistrer`.
5. Cliquer `Tester`.
6. Une fois le test OK, cliquer `Activer Supabase`.
7. Pour un premier transfert, faire un snapshot puis `Envoyer vers Supabase`.

La Publishable key est prévue pour être utilisée côté navigateur. Ne jamais mettre une clé `secret` ou `service_role` dans ce projet.

## SQL
Le fichier `supabase/V22_INSTALL.sql` contient le schéma minimal V22:
- `gp_user_profiles`
- `gp_app_data`
- RLS
- fonction de lecture du rôle courant

Le projet Supabase utilisé pour les tests doit avoir un profil dans `gp_user_profiles` pour chaque utilisateur.

## Cloudflare Pages
- Build command: `npm run build`
- Output directory: `dist`
- Framework: Vite

## Limites V22 beta
Les modules de licences SaaS commerciaux sont volontairement désactivés pendant la migration:
- `admin-saas`
- `license-activation`
- `abonnement`

Ils seront réintroduits en V23 avec des tables Supabase dédiées et, si nécessaire, une Edge Function pour les opérations privilégiées.

Les fichiers métier restent en JSONB pour réduire le risque de régression. La normalisation en tables PostgreSQL sera traitée après validation de V22.

## Retour à V21
La V21 originale n'est pas modifiée par cette migration. Les éléments Firebase retirés de l'exécution sont archivés dans `_archive/firebase-v21/`.


## V22.1
La configuration Supabase est désormais accessible directement depuis l'écran de connexion via « Configurer Supabase », avant le premier login.


## V22.2
Correction du rôle administrateur : le rôle explicite du profil Supabase est désormais prioritaire dans GPAuth/runtime, et le badge de rôle est rafraîchi depuis currentUser.


## V22.3
Correctif auth/rôle : suppression du pull Supabase avant authentification, persistance du rôle Supabase dans la session legacy, rafraîchissement des permissions après login, cache-busting des scripts et diagnostic `gpSupabaseDiagnostic()`.


## V22.4
Correctif critique de persistance : les refreshs de token ne déclenchent plus de pull destructif et un payload Supabase vide ne remplace jamais une base locale non vide.


## V22.5
Correction critique de persistance : un pull Supabase vide ne peut plus écraser localStorage. Le bridge Firebase legacy ne déclenche plus de second pull concurrent. Le local-first est conservé tant que le cloud ne contient pas de données.


## V22.6
Ajout d'un accès visible « Stockage & synchronisation » dans la barre latérale et d'un bouton direct depuis Admin Central vers `admin-stockage`.


## V22.7
Correction CRUD : édition scoped au drawer actif pour éviter les champs legacy cachés, et bridge final `delRow` chargé en dernier pour garantir suppression + persistance + rafraîchissement.


## V22.8 — CRUD + cloud
- Les modifications/suppressions passent par `GPDB` et sont automatiquement poussées vers Supabase lorsque la session est connectée.
- Pushs Supabase sérialisés pour éviter qu'une ancienne écriture n'écrase une plus récente.
- Le formulaire d'édition n'écrase plus une propriété si le champ actif n'a pas été trouvé.
- Suppression par ID lorsque disponible.


## V25.0 — correction globale CRUD
Ajout d'une révision optimiste centrale (`meta.localRevision`) et d'un garde Supabase contre les snapshots obsolètes. Le mécanisme s'applique à toutes les collections métier et empêche les callbacks asynchrones tardifs de ressusciter des données anciennes après modification/suppression.
