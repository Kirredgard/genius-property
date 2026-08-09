# GitHub Pages test checklist

1. Create a GitHub repository named `genius-property`.
2. Push this directory to the `main` branch.
3. Open **Settings → Pages**.
4. Set **Source** to **GitHub Actions**.
5. Open **Actions** and wait for **Deploy Genius Property to GitHub Pages**.
6. Open the generated Pages URL.
7. For Firebase, add the `VITE_FIREBASE_*` repository variables under **Settings → Secrets and variables → Actions → Variables**.
8. Add the GitHub Pages domain to Firebase Authentication → Authorized domains.
9. Test login, agency isolation, Storage, invitations and billing against a dedicated Firebase/Stripe test environment.
