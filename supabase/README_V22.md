# Supabase V22

Exécuter `V22_INSTALL.sql` dans Supabase SQL Editor.

Le projet V22 utilise actuellement une seule ligne `gp_app_data` (`id = 'main'`) pour stocker le JSON de l'application. C'est volontaire : la priorité est de valider Auth + RLS + synchronisation avant de normaliser les collections métier en tables.

L'utilisateur doit exister dans Supabase Auth et avoir un profil actif dans `gp_user_profiles`.
