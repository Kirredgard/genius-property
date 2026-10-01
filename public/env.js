// Genius Property — configuration Supabase (chargée automatiquement par /connexion et /app).
// Il n'y a RIEN d'autre à configurer dans l'interface.
// 1) Colle ta clé PUBLIQUE (Publishable / anon) dans supabasePublishableKey ci-dessous.
//    Supabase > Project Settings > API Keys > "Publishable key" (sb_publishable_...)
// 2) Ne mets JAMAIS ici une clé secret / service_role.
// (Sur Vercel, tu peux aussi définir VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY :
//  le build génère alors ce fichier tout seul.)
window.GPV22_ENV = {
  supabaseUrl: "https://tpomnpzurgpvjkosvwpk.supabase.co",
  supabasePublishableKey: ""
};
