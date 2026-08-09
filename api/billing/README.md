# Billing API Stripe V21

Endpoints attendus :

- `POST /api/billing/create-checkout-session`
- `POST /api/billing/create-portal-session`
- `POST /api/billing/stripe-webhook`

Variables :

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_PRO=
STRIPE_PRICE_BUSINESS=
STRIPE_PRICE_ENTERPRISE=
FRONTEND_URL=
```

Cette API doit tourner côté serveur, jamais dans le frontend.


## Notifications email billing

Optionnel :

```bash
EMAIL_API_URL=http://localhost:8788/api/emails
EMAIL_API_INTERNAL_SECRET=replace-with-a-long-random-secret
```

Quand renseigné, le webhook Stripe peut envoyer des emails pour :

- paiement confirmé
- paiement échoué
- abonnement annulé
