import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceRoots = ['js/v21', 'tests/v21'].map((dir) => path.join(root, dir));
const problems = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full);
      continue;
    }

    if (!/\.(js|ts)$/.test(entry.name)) continue;

    const txt = fs.readFileSync(full, 'utf8');
    const rel = path.relative(root, full);
    const importMatches = txt.matchAll(/(?:import|export)\s+(?:[^'"]*?from\s+)?['"]([^'"]+)['"]/g);

    for (const match of importMatches) {
      const spec = match[1];

      if (!spec.startsWith('.')) continue;

      if (spec.endsWith('.ts')) {
        problems.push({
          file: rel,
          specifier: spec,
          reason: 'Use .js extension in source imports for TS/Vite compatibility.'
        });
      }

      const resolvedJs = path.resolve(path.dirname(full), spec);
      const candidates = [
        resolvedJs,
        resolvedJs.replace(/\.js$/, '.ts'),
        resolvedJs.replace(/\.js$/, '.js'),
        `${resolvedJs}.js`,
        `${resolvedJs}.ts`,
        path.join(resolvedJs, 'index.js'),
        path.join(resolvedJs, 'index.ts')
      ];

      if (!candidates.some((candidate) => fs.existsSync(candidate))) {
        problems.push({
          file: rel,
          specifier: spec,
          reason: 'Local import target not found.'
        });
      }
    }
  }
}

sourceRoots.forEach(walk);

const outDir = path.join(root, 'audit', 'v21');
fs.mkdirSync(outDir, { recursive: true });

const report = {
  scannedAt: new Date().toISOString(),
  problems
};

fs.writeFileSync(path.join(outDir, 'import-audit-latest.json'), JSON.stringify(report, null, 2));

if (problems.length > 0) {
  console.error(`Import audit failed: ${problems.length} problem(s).`);
  for (const problem of problems.slice(0, 20)) {
    console.error(`- ${problem.file}: ${problem.specifier} (${problem.reason})`);
  }
  process.exit(1);
}

console.log('Import audit passed.');
