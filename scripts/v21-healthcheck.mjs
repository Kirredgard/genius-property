import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'index.v21-clean.html',
      'index.v21-production.html',
      'login.v21.html',
      'storage-test.v21.html',
      'dashboard.v21.html',
      'documents.v21.html',
      'contracts.v21.html',
      'owners.v21.html',
      'tenants.v21.html',
      'properties.v21.html',
  'js/v21/bootstrap.js',
      'js/v21/pages/dashboard.page.ts',
      'js/v21/pages/documents.page.ts',
      'js/v21/pages/contracts.page.ts',
      'js/v21/pages/owners.page.ts',
      'js/v21/pages/tenants.page.ts',
      'js/v21/pages/properties.page.ts',
  'js/v21/main.js',
      'js/v21/pages/login.page.ts',
      'js/v21/pages/storage-test.page.ts',
  'js/v21/modules/tenants/tenants.module.ts',
  'js/v21/modules/properties/properties.module.ts',
  'js/v21/modules/contracts/contracts.module.ts',
  'js/v21/modules/notifications/notifications.module.ts',
      'js/v21/modules/owners/owners.module.ts',
  'js/v21/legacy/legacy-loader.js',
  'js/v21/legacy/hotfix-loader.js',
  'js/v21/patches/index.js',
      'js/v21/data/firestore.repository.ts',
      'js/v21/auth/auth.service.ts',
      'js/v21/storage/storage.service.ts',
      'js/v21/modules/documents/services/document-storage.service.ts'
];

const missing = required.filter((item) => !fs.existsSync(path.join(root, item)));

const report = {
  checkedAt: new Date().toISOString(),
  missing,
  ok: missing.length === 0
};

fs.mkdirSync(path.join(root, 'audit', 'v21'), { recursive: true });
fs.writeFileSync(path.join(root, 'audit', 'v21', 'healthcheck-latest.json'), JSON.stringify(report, null, 2));

if (missing.length) {
  console.error('V21 healthcheck failed. Missing files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log('V21 healthcheck passed.');
