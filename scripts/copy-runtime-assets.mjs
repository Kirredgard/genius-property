import { cp, mkdir, copyFile, access } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function copyDir(name) {
  const src = path.join(root, name);
  const dest = path.join(dist, name);
  if (await exists(src)) {
    await mkdir(path.dirname(dest), { recursive: true });
    await cp(src, dest, { recursive: true, force: true });
    console.log(`copied ${name}/ -> dist/${name}/`);
  }
}

async function copyFileIfExists(name) {
  const src = path.join(root, name);
  const dest = path.join(dist, name);
  if (await exists(src)) {
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(src, dest);
    console.log(`copied ${name} -> dist/${name}`);
  }
}

await mkdir(dist, { recursive: true });

// Legacy/global scripts are referenced directly by index.html at runtime.
// Vite does not automatically preserve these folders with their original paths.
await copyDir('js');
await copyDir('assets');
await copyDir('styles');

await copyFileIfExists('env.js');
await copyFileIfExists('firebase.json');

console.log('Runtime assets copied for Firebase Hosting.');
