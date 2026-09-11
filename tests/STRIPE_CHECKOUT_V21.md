# Stripe Checkout V21

## Ajouts frontend

- `upgrade.v21.html`
- `billing-success.v21.html`
- `billing-cancel.v21.html`
- `js/v21/billing/billing-api.client.ts`
- `js/v21/pages/upgrade.page.ts`
- `js/v21/pages/billing-result.page.ts`

## Ajouts backend exemple

- `api/billing/server.example.mjs`
- `api/billing/README.md`

## Endpoints

- `POST /api/billing/create-checkout-session`
- `POST /api/billing/create-portal-session`
- `POST /api/billing/stripe-webhook`

## Variables frontend

```bash
VITE_BILLING_API_URL=/api/billing
```

## Variables backend

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_PRO=
STRIPE_PRICE_BUSINESS=
STRIPE_PRICE_ENTERPRISE=
FRONTEND_URL=
```

## Prochaine étape

Déployer l’API billing côté serveur, configurer les produits/prix Stripe, puis tester checkout en mode test.
