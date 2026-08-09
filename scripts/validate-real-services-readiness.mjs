import fs from 'node:fs';
import path from 'node:path';

const requiredFiles = [
  'firestore.rules.v21',
  'storage.rules.v21',
  'firebase.v21.json',
  '.env.real.example',
  'api/billing/server.example.mjs',
  'api/emails/server.example.mjs',
  'REAL_SERVICES_SETUP_V21.md',
  'REAL_FIREBASE_CHECKLIST_V21.md',
  'REAL_STRIPE_CHECKLIST_V21.md',
  'REAL_EMAIL_CHECKLIST_V21.md'
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));

const report = {
  checkedAt: new Date().toISOString(),
  missing,
  ok: missing.length === 0
};

fs.mkdirSync('audit/v21', { recursive: true });
fs.writeFileSync('audit/v21/real-services-readiness-latest.json', JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error('Real services readiness failed:');
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log('Real services readiness OK.');
