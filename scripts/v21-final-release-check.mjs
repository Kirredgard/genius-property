import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredPages = [
  'login.v21.html',
  'dashboard.v21.html',
  'go-live.v21.html',
  'final-stabilization.v21.html',
  'support.v21.html',
  'status.v21.html',
  'health.v21.html'
];

const requiredDocs = [
  'FINAL_STABILIZATION_BUNDLE_V21.md',
  'GO_LIVE_FINAL_V21.md',
  'PRODUCTION_GUIDE_V21.md'
];

const missingPages = requiredPages.filter((file) => !fs.existsSync(path.join(root, file)));
const missingDocs = requiredDocs.filter((file) => !fs.existsSync(path.join(root, file)));

const report = {
  checkedAt: new Date().toISOString(),
  missingPages,
  missingDocs,
  ok: missingPages.length === 0 && missingDocs.length === 0
};

fs.mkdirSync(path.join(root, 'audit', 'v21'), { recursive: true });
fs.writeFileSync(path.join(root, 'audit', 'v21', 'final-release-check-latest.json'), JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error('Final release check failed');
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log('Final release check OK');
