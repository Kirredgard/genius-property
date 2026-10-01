# Test local Genius Property + Supabase

1. Installer les dépendances : `npm.cmd install` sous PowerShell si `npm` est bloqué.
2. Lancer : `npm.cmd run dev`.
3. Ouvrir `http://localhost:5173`.
4. Cliquer **Configurer Supabase** si la Publishable key n’est pas encore présente.
5. Utiliser uniquement la **Publishable key** Supabase (`sb_publishable_...`). Jamais `service_role`.
6. Dans Supabase Auth, vérifier que l’utilisateur existe et que son profil est présent dans `gp_user_profiles`.
7. Tester la connexion. Dans F12 > Console, `window.gpSupabaseDiagnostic()` doit retourner `configured: true` et, après connexion, un `user` et un `profile`.

Le site principal ne charge plus Firebase. Les anciens fichiers Firebase restent uniquement comme historique/compatibilité et ne sont pas référencés par `index.html`.
