import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

const files = walk(dist).map((file) => ({
  file: path.relative(root, file).replaceAll('\\', '/'),
  sizeBytes: fs.statSync(file).size
})).sort((a, b) => b.sizeBytes - a.sizeBytes);

const report = {
  generatedAt: new Date().toISOString(),
  totalBytes: files.reduce((sum, item) => sum + item.sizeBytes, 0),
  files
};

fs.mkdirSync(path.join(root, 'audit', 'v21'), { recursive: true });
fs.writeFileSync(path.join(root, 'audit', 'v21', 'bundle-analysis-latest.json'), JSON.stringify(report, null, 2));

console.log(`Bundle files: ${files.length}`);
console.log(`Total size: ${report.totalBytes} bytes`);
files.slice(0, 10).forEach((item) => console.log(`- ${item.file}: ${item.sizeBytes} bytes`));
