# Real Stripe Checklist V21

## Configuration Stripe

- [ ] créer produits starter/pro/business/enterprise
- [ ] créer prices récurrents
- [ ] renseigner `STRIPE_PRICE_*`
- [ ] renseigner `STRIPE_SECRET_KEY`
- [ ] configurer webhook
- [ ] renseigner `STRIPE_WEBHOOK_SECRET`

## API

- [ ] lancer `api/billing/server.example.mjs`
- [ ] tester `POST /create-checkout-session`
- [ ] tester `POST /create-portal-session`
- [ ] tester webhook avec Stripe CLI

## Frontend

- [ ] ouvrir `upgrade.v21.html`
- [ ] lancer checkout test
- [ ] retour `billing-success.v21.html`
- [ ] vérifier Firestore subscription
- [ ] tester `invoice.payment_failed`
- [ ] tester `customer.subscription.deleted`
