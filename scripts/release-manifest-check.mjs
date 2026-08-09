import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'RELEASE_MANIFEST_V21.json');

if (!fs.existsSync(manifestPath)) {
  console.error('Missing RELEASE_MANIFEST_V21.json');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const missing = [];

for (const entry of manifest.entrypoints || []) {
  if (!fs.existsSync(path.join(root, entry))) missing.push(entry);
}

const report = {
  checkedAt: new Date().toISOString(),
  version: manifest.version,
  missing,
  ok: missing.length === 0
};

fs.mkdirSync(path.join(root, 'audit', 'v21'), { recursive: true });
fs.writeFileSync(path.join(root, 'audit', 'v21', 'release-manifest-check-latest.json'), JSON.stringify(report, null, 2));

if (missing.length) {
  console.error('Release manifest check failed:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Release manifest OK: ${manifest.version}`);
