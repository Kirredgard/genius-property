# Genius Property — Nettoyage mode agence locale

## Correctifs
- Suppression du double formulaire statique « Nouvel employé » qui créait des IDs HTML en double et pouvait ouvrir/remplir le mauvais formulaire.
- Conservation d'un seul formulaire employé : le drawer local.
- Remplacement de l'ancien garde de connexion Firebase par un petit pont de connexion compatible avec le mode local.
- Nettoyage des overlays orphelins après navigation et fermeture avec Échap.
- Suppression des modules/pages commerciaux inutiles en mode agence unique : abonnement, SaaS, activation/licence.
- Suppression des archives inutiles du paquet livré.

## Test local
Identifiant : `admin`
Mot de passe : `admin123`

Les données restent locales au navigateur tant que le mode local est activé.
