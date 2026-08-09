# Real Services Setup V21

Ce pack couvre en une fois :

1. Firebase réel
2. Stripe réel
3. Email réel

## Étapes rapides

```bash
cp .env.real.example .env.local
npm install
npm run real:services:check
npm run real:env:check
npm run dev
```

Puis ouvrir :

```txt
real-services.v21.html
firestore-test.v21.html
storage-test.v21.html
upgrade.v21.html
team.v21.html
```

## Ordre de validation

1. Firebase Auth
2. Firestore Rules
3. Storage Rules
4. Stripe Checkout test
5. Stripe Webhooks
6. Email invitation
7. Email billing

## Important

Les clés Stripe et SMTP ne doivent jamais être exposées dans le frontend.
Elles doivent rester côté API backend.
