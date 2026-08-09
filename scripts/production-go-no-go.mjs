import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const required = [
  'index.v21-production.html',
  'firestore.rules.v21',
  'storage.rules.v21',
  'firebase.v21.json',
  '.env.production.example',
  'DEPLOYMENT_CHECKLIST_V21.md',
  'PRODUCTION_GUIDE_V21.md'
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));

const report = {
  checkedAt: new Date().toISOString(),
  required,
  missing,
  ok: missing.length === 0
};

fs.mkdirSync(path.join(root, 'audit', 'v21'), { recursive: true });
fs.writeFileSync(path.join(root, 'audit', 'v21', 'production-go-no-go-latest.json'), JSON.stringify(report, null, 2));

if (missing.length) {
  console.error('Production Go/No-Go failed. Missing:');
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

console.log('Production Go/No-Go structure passed.');
console.log('Manual checks still required: Firebase rules deploy, Auth, Firestore, Storage, monitoring.');
