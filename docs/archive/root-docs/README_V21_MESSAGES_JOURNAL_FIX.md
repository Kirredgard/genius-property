# V21 — Messages compacts + Journal réparé

- Suppression du renderer Journal concurrent dans `js/pages/compact-layout.js`.
- Le Journal est désormais rendu uniquement par `js/core/activity-pages-v20.js`.
- Si `gp_auditlog` est vide, la page affiche explicitement « Aucune activité » au lieu d’une page vide.
- Boutons Messages et formulaire d’écriture rendus plus compacts.
- Champs du drawer de nouveau message légèrement réduits.

Test : `npm install` puis `npm run dev`, et ouvrir le port indiqué par Vite.
