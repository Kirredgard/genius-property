import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'index.html',
  'env.js',
  'firebase.json',
  'firestore.rules',
  'js/firebase.js',
  'js/safe-bootstrap.js',
  'js/core/navigation.js',
  'js/pages/biens.js',
  'js/pages/paiements.js',
  'js/v21/ui/ui-stability.service.js',
  'styles/theme.css',
  'styles/dashboard.css',
  'styles/app-shell.css'
];

const forbiddenRootV21Pages = fs.readdirSync(root).filter((name) => name.endsWith('.v21.html'));
const missing = required.filter((item) => !fs.existsSync(path.join(root, item)));

const report = {
  checkedAt: new Date().toISOString(),
  architecture: 'main-index-app',
  missing,
  forbiddenRootV21Pages,
  ok: missing.length === 0 && forbiddenRootV21Pages.length === 0
};

fs.mkdirSync(path.join(root, 'audit', 'v21'), { recursive: true });
fs.writeFileSync(path.join(root, 'audit', 'v21', 'healthcheck-latest.json'), JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error('Architecture healthcheck failed.');
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log('Architecture healthcheck passed: main index app only.');
