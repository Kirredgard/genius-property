# Genius Property V83 — Vercel + Supabase + OVH

## Vercel Environment Variables

In Vercel: Project Settings → Environment Variables, add these for **Production** (and Preview if you want preview deployments to work):

- `VITE_SUPABASE_URL` = `https://tpomnpzurgpvjkosvwpk.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = your Supabase **Publishable key** (`sb_publishable_...`)

Do not add or expose a Supabase `service_role` / secret key.

The application now prefers these Vite variables at build time and falls back to `public/env.js` for local development.

## Deploy

After committing/pushing this version to GitHub, redeploy the Vercel project.

## Domain OVH

Do not change OVH DNS until the `*.vercel.app` deployment has been tested. Then add the custom domain in Vercel and use the DNS records Vercel displays.


## Important Vercel runtime fix

The production build generates `dist/env.js` from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. This is required because the legacy runtime reads `window.GPV22_ENV` from a classic script before the app scripts execute.
