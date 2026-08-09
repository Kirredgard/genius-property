# Genius Property V21.1

Genius Property is a SaaS platform for property management. This repository is the GitHub-ready V21.1 test build, including the security hardening pass.

## Quick local test

```bash
npm install
npm run build
npm run dev
```

Then open the Vite URL shown in the terminal.

## GitHub Pages

The repository is prepared for GitHub Pages through GitHub Actions. The workflow builds the Vite application and publishes `dist/`.

Expected project URL:

`https://YOUR-GITHUB-USERNAME.github.io/genius-property/`

If you choose a different repository name, update `VITE_BASE_PATH` in `.github/workflows/deploy.yml` to `/<repo-name>/`.

In GitHub, go to **Settings → Pages** and select **GitHub Actions** as the source.

## Firebase configuration

For a real Firebase test, create repository/environment **Variables** named:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)

These are browser configuration values, not server secrets. Do **not** put Admin SDK credentials, Stripe secret keys, email provider secrets, or internal backend secrets in `VITE_*` variables.

For backend features, deploy the hardened APIs separately (Firebase Functions, Cloud Run, Vercel, etc.) and set:

- `VITE_BILLING_API_URL`
- `VITE_EMAIL_API_URL`
- `VITE_INVITATION_API_URL`
- `VITE_OPS_API_URL`

## Important

GitHub Pages hosts the frontend only. Firebase/Auth/Firestore/Storage and the hardened backend APIs remain separate services.

This build is intended for testing. Do not use production customer data until Firebase Rules, backend authorization, Stripe test mode, email delivery, and multi-agency isolation have been verified end-to-end.

## Security

See `SECURITY_HARDENING_V21_1.md` for the V21.1 security changes.
