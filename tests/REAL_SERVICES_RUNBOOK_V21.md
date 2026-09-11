# Real Services Runbook V21

## 1. Firebase réel

```bash
firebase deploy --config firebase.v21.json --only firestore:rules,firestore:indexes,storage
```

## 2. Billing API

```bash
cd api/billing
cp package.example.json package.json
npm install
npm run dev
```

## 3. Stripe webhook local

```bash
bash scripts/stripe/listen-webhook.sh
```

## 4. Email API

```bash
cd api/emails
cp package.example.json package.json
npm install
npm run dev
```

## 5. Frontend

```bash
npm run dev
```

## 6. Tests

- `real-services.v21.html`
- `login.v21.html`
- `firestore-test.v21.html`
- `storage-test.v21.html`
- `upgrade.v21.html`
- `team.v21.html`

## 7. Go/No-Go

GO si :
- Auth OK
- Firestore OK
- Storage OK
- Stripe Checkout OK
- Webhook écrit dans Firestore
- Invitation email reçue
