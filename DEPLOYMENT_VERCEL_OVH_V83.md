# Genius Property v83 — déploiement Vercel + Supabase + domaine OVH

## Architecture

- Hébergement frontend : Vercel
- Authentification et données : Supabase
- Domaine : OVH
- Firebase Hosting : non utilisé pour le déploiement

## 1. Variables Vercel

Le projet contient `public/env.js` pour la configuration publique Supabase.
La valeur à renseigner est :

- `supabaseUrl` : URL publique du projet Supabase
- `supabasePublishableKey` : clé **Publishable** Supabase uniquement

Ne jamais mettre une clé `service_role` dans le navigateur.

## 2. Déploiement Vercel

Depuis le dossier du projet :

```bash
npm install
npm run build
```

Puis importer le dépôt dans Vercel, avec :

- Framework : Vite
- Build command : `npm run build`
- Output directory : `dist`

## 3. Routage

Les routes publiques/principales prévues sont :

- `/` : présentation
- `/connexion` : connexion
- `/app` : application

`vercel.json` renvoie les routes applicatives vers `index.html` pour permettre le routage côté client.

## 4. Domaine OVH

Ne modifier les DNS qu'après validation de l'URL Vercel.

Dans Vercel : Project → Settings → Domains → ajouter le domaine.

Vercel affichera ensuite les enregistrements DNS à créer chez OVH. Utiliser exactement les valeurs affichées par Vercel.

## 5. Supabase Auth

Dans Supabase → Authentication → URL Configuration :

- ajouter le domaine de production comme Site URL
- ajouter les URLs de redirection nécessaires, notamment le domaine de production et `/connexion`

Faire les tests avant de basculer le domaine OVH.
