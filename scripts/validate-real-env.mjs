import fs from 'node:fs';

const requiredFrontend = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_BILLING_API_URL',
  'VITE_EMAIL_API_URL'
];

const requiredBackend = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_STARTER',
  'STRIPE_PRICE_PRO',
  'STRIPE_PRICE_BUSINESS',
  'STRIPE_PRICE_ENTERPRISE',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM'
];

function parseEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const env = {};
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    env[key] = rest.join('=').replace(/^"|"$/g, '');
  }
  return env;
}

const fileEnv = {
  ...parseEnvFile('.env.local'),
  ...parseEnvFile('.env.real')
};

const env = { ...fileEnv, ...process.env };

const missingFrontend = requiredFrontend.filter((key) => !env[key]);
const missingBackend = requiredBackend.filter((key) => !env[key]);

const report = {
  checkedAt: new Date().toISOString(),
  missingFrontend,
  missingBackend,
  frontendOk: missingFrontend.length === 0,
  backendOk: missingBackend.length === 0,
  ok: missingFrontend.length === 0 && missingBackend.length === 0
};

fs.mkdirSync('audit/v21', { recursive: true });
fs.writeFileSync('audit/v21/real-env-validation-latest.json', JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error('Real env validation failed:');
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log('Real env validation OK.');
