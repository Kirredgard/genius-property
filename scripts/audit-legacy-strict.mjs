import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const legacyPatterns = [
  /app\.legacy\.bundle\.js$/i,
  /consolidated-hotfixes\.js$/i,
  /inline-script/i,
  /legacy-bridge/i
];

const allowedLegacyPaths = [
  'js/v21/legacy/legacy-loader.js',
  'js/v21/legacy/hotfix-loader.js',
  'js/v21/legacy/legacy-registry.js',
  'js/v21/legacy/legacy-domain-status.js'
];

const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }

    const rel = path.relative(root, full).replaceAll('\\', '/');
    if (allowedLegacyPaths.includes(rel)) continue;

    if (legacyPatterns.some((pattern) => pattern.test(rel))) {
      findings.push({
        file: rel,
        sizeBytes: fs.statSync(full).size,
        reason: 'legacy candidate'
      });
    }
  }
}

walk(root);

const outDir = path.join(root, 'audit', 'v21');
fs.mkdirSync(outDir, { recursive: true });

const report = {
  scannedAt: new Date().toISOString(),
  findings,
  count: findings.length
};

fs.writeFileSync(path.join(outDir, 'legacy-strict-latest.json'), JSON.stringify(report, null, 2));

console.log(`Strict legacy findings: ${findings.length}`);
findings.slice(0, 20).forEach((item) => {
  console.log(`- ${item.file} (${item.sizeBytes} bytes): ${item.reason}`);
});
