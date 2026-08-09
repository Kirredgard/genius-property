# Real Services APIs V21

## Billing API

```bash
cd api/billing
cp package.example.json package.json
npm install
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
npm run dev
```

## Email API

```bash
cd api/emails
cp package.example.json package.json
npm install
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
npm run dev
```

## Ops API optionnelle

```bash
cd api/ops
cp package.example.json package.json
npm install
npm run dev
```
