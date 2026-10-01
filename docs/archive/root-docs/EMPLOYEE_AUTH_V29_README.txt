# Genius Property V29 — Employee Auth Fix

Important: V29 fixes the employee account path and supports both current Supabase
`SUPABASE_PUBLISHABLE_KEYS` / `SUPABASE_SECRET_KEYS` and legacy key variables.

1. Replace your local project with this version.
2. Deploy/update `supabase/functions/create-employee-account/index.ts` in Supabase.
3. Click **Deploy updates** in Supabase Edge Functions.
4. Hard refresh the browser (Ctrl+Shift+R).
5. Create a NEW employee with a unique email.
6. Check Supabase Authentication > Users. The employee must appear there.

Do not put a secret/service_role key in the frontend.

If the browser console still displays the old message:
"La création de comptes employés sera activée dans la V23..."
then the browser is NOT running this V29 folder. That message does not exist anywhere in this package.
