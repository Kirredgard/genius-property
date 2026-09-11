import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'index.html',
  'firebase.json',
  'vite.config.js',
  'ARCHITECTURE_DECISION_MAIN_APP.md',
  '_archive/v21-multipages-html/ARCHIVE_MANIFEST.json'
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
const rootV21Pages = fs.readdirSync(root).filter((name) => name.endsWith('.v21.html'));

const report = {
  checkedAt: new Date().toISOString(),
  architecture: 'main-index-app',
  missing,
  rootV21Pages,
  ok: missing.length === 0 && rootV21Pages.length === 0
};

fs.mkdirSync(path.join(root, 'audit', 'v21'), { recursive: true });
fs.writeFileSync(path.join(root, 'audit', 'v21', 'final-release-check-latest.json'), JSON.stringify(report, null, 2));

if (!report.ok) {
  console.error('Final release check failed');
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log('Final release check OK: main index architecture.');
