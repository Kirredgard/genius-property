# Multi-agences — mise en service

1. Supabase > SQL Editor : exécuter `supabase/migrations/003_multi_agences.sql`
   (remplacer TON-EMAIL@EXEMPLE.COM à l'étape 9 pour devenir super_admin).
2. Redéployer la fonction : `supabase functions deploy create-employee-account`
3. Redéployer l'application (js/core/agencies.js + supabase-auth.js + app.html).
4. Se reconnecter : le badge de l'agence apparaît en haut, et le menu « Agences »
   (super_admin uniquement) permet de créer / entrer / suspendre une agence.

Chaque agence a ses propres données et ses propres utilisateurs. Un employé créé
rejoint toujours l'agence de l'admin qui le crée.
