# V28 — vrais comptes de connexion employés

## Cause du bug
Dans V27, `createEmployeeAccount()` levait volontairement une erreur. L'interface enregistrait malgré cela l'employé dans GPDB, mais aucun utilisateur Supabase Auth n'était créé. Il était donc impossible de se connecter avec les identifiants de cet employé.

## Correction
V28 ajoute une Edge Function Supabase `create-employee-account`.

Le navigateur appelle la fonction avec la session de l'administrateur. La fonction vérifie que le demandeur a `role = admin` dans `gp_user_profiles`, puis utilise `auth.admin.createUser()` côté serveur et crée le profil `gp_user_profiles`.

La clé service_role n'est jamais envoyée au navigateur.

## Déploiement
Dans Supabase Dashboard, ouvre **Edge Functions** puis crée une fonction nommée `create-employee-account`. Copie le contenu de `supabase/functions/create-employee-account/index.ts`.

Les secrets Supabase nécessaires sont normalement disponibles côté Edge Function. Si ton projet utilise une configuration personnalisée, configure `SUPABASE_SERVICE_ROLE_KEY` dans les secrets de la fonction.

Ensuite déploie la fonction.

## Test
1. Connecte-toi comme administrateur.
2. Crée un nouvel employé avec email + mot de passe.
3. L'employé doit être créé dans Authentication > Users.
4. Une ligne correspondante doit exister dans `gp_user_profiles` avec `role = agent`, `comptable` ou `lecture`.
5. Déconnecte-toi de l'administrateur.
6. Connecte-toi avec l'email/mot de passe de l'employé.

## Important
Ne mets jamais la `service_role` / `sb_secret_...` key dans le navigateur.
