import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['node_modules', 'dist', '.git']);
const result = {
  scannedAt: new Date().toISOString(),
  totals: {
    jsFiles: 0,
    windowOccurrences: 0,
    filesWithWindow: 0,
    legacyFiles: 0,
    hotfixFiles: 0
  },
  topWindowFiles: []
};

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full);
      continue;
    }

    if (!entry.name.endsWith('.js')) continue;

    const rel = path.relative(root, full);
    const txt = fs.readFileSync(full, 'utf8');
    const windowCount = (txt.match(/\bwindow\./g) || []).length;

    result.totals.jsFiles += 1;
    result.totals.windowOccurrences += windowCount;

    if (windowCount > 0) {
      result.totals.filesWithWindow += 1;
      result.topWindowFiles.push({ file: rel, windowOccurrences: windowCount });
    }

    const low = rel.toLowerCase();
    if (low.includes('legacy') || low.includes('bundle')) result.totals.legacyFiles += 1;
    if (low.includes('hotfix') || low.includes('fix')) result.totals.hotfixFiles += 1;
  }
}

walk(root);

result.topWindowFiles.sort((a, b) => b.windowOccurrences - a.windowOccurrences);
result.topWindowFiles = result.topWindowFiles.slice(0, 25);

const outDir = path.join(root, 'audit', 'v21');
fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, 'legacy-audit-latest.json');
fs.writeFileSync(outFile, JSON.stringify(result, null, 2));

console.log(`Legacy audit written to ${path.relative(root, outFile)}`);
console.log(`window.* occurrences: ${result.totals.windowOccurrences}`);
