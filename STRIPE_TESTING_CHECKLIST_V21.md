# Stripe Testing Checklist V21

## Pré-requis

- créer produits Stripe : starter, pro, business, enterprise
- créer prices récurrents
- renseigner variables backend
- configurer webhook local ou staging

## Variables backend

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_PRO=
STRIPE_PRICE_BUSINESS=
STRIPE_PRICE_ENTERPRISE=
```

## Test local webhook

Avec Stripe CLI :

```bash
stripe listen --forward-to localhost:8787/api/billing/stripe-webhook
```

## Events à tester

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Validation Firestore

Après checkout, vérifier :

```txt
agencies/{agencyId}/settings/subscription
```

Champs attendus :

- plan
- status
- provider
- customerId
- subscriptionId
- currentPeriodEnd
- updatedAt

## Pages frontend

- `upgrade.v21.html`
- `billing-success.v21.html`
- `billing-cancel.v21.html`
- `billing.v21.html`
