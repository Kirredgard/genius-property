# Transactional Emails V21

## Ajouts

- client frontend Email API
- envoi email invitation depuis `team.v21.html`
- exemple backend Node/Express/Nodemailer
- templates invitation/bienvenue/billing
- tests client email

## Endpoints

- `POST /api/emails/send-invite`
- `POST /api/emails/send-welcome`
- `POST /api/emails/send-billing-status`

## Variables frontend

```bash
VITE_EMAIL_API_URL=/api/emails
```

## Variables backend

```bash
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

## Prochaine étape

Brancher l’Email API sur le webhook Stripe pour envoyer les notifications d’abonnement.
