# Stripe Email Notifications V21

## Ajouts

- helper `api/billing/email-notifications.js`
- notification email depuis webhook Stripe
- support `EMAIL_API_URL`
- emails paiement confirmé / échoué / annulé

## Variable backend billing

```bash
EMAIL_API_URL=http://localhost:8788/api/emails
```

## Flux

Stripe webhook
→ Billing API
→ Email API
→ SMTP provider

## Événements concernés

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.deleted`

## Remarque

Le destinataire est résolu depuis le document subscription :

- `billingEmail`
- `email`
- `ownerEmail`
- fallback Stripe customer email
