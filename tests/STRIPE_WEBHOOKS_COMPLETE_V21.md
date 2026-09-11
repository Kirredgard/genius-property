# Stripe Webhooks Complete V21

## Ajouts

- gestion complète events Stripe principaux
- helper `stripe-events.js`
- statut `past_due`, `cancelled`, `active`
- mise à jour Firestore subscription
- bannière abonnement côté dashboard
- checklist tests Stripe CLI

## Events gérés

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Fichiers

- `api/billing/server.example.mjs`
- `api/billing/stripe-events.js`
- `api/billing/package.example.json`
- `js/v21/billing/subscription-banner.ts`
- `STRIPE_TESTING_CHECKLIST_V21.md`
