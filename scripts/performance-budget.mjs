import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reportPath = path.join(root, 'audit', 'v21', 'bundle-analysis-latest.json');

const budget = {
  totalBytes: 900 * 1024,
  singleFileBytes: 350 * 1024,
  maxJsFiles: 40
};

if (!fs.existsSync(reportPath)) {
  console.error('Missing bundle analysis. Run npm run analyze:bundle first.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const jsFiles = report.files.filter((item) => item.file.endsWith('.js'));
const failures = [];

if (report.totalBytes > budget.totalBytes) {
  failures.push(`Total bundle too large: ${report.totalBytes} > ${budget.totalBytes}`);
}

for (const file of report.files) {
  if (file.sizeBytes > budget.singleFileBytes) {
    failures.push(`File too large: ${file.file} ${file.sizeBytes} > ${budget.singleFileBytes}`);
  }
}

if (jsFiles.length > budget.maxJsFiles) {
  failures.push(`Too many JS files: ${jsFiles.length} > ${budget.maxJsFiles}`);
}

const result = {
  checkedAt: new Date().toISOString(),
  budget,
  totalBytes: report.totalBytes,
  jsFiles: jsFiles.length,
  failures,
  ok: failures.length === 0
};

fs.writeFileSync(path.join(root, 'audit', 'v21', 'performance-budget-latest.json'), JSON.stringify(result, null, 2));

if (failures.length) {
  console.error('Performance budget failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Performance budget passed.');
