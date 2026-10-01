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

// Generate the runtime Supabase config from Vercel/build environment variables.
// This file is intentionally static because the legacy app reads window.GPV22_ENV
// before its classic scripts execute. Never expose server/service-role secrets here.
const runtimeEnv = `// Generated at build time. Do not commit production values.\nwindow.GPV22_ENV = {\n  supabaseUrl: ${JSON.stringify(process.env.VITE_SUPABASE_URL || '')},\n  supabasePublishableKey: ${JSON.stringify(process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '')}\n};\n`;
await copyFileIfExists('env.js');
if (process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  await mkdir(dist, { recursive: true });
  await (await import('node:fs/promises')).writeFile(path.join(dist, 'env.js'), runtimeEnv, 'utf8');
  console.log('Generated dist/env.js from VITE_SUPABASE_* environment variables.');
}
console.log('Runtime assets copied for Vercel/static hosting.');
