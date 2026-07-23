import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(currentDir, '../dist');
const indexPath = path.join(distDir, 'index.html');
const fallbackPath = path.join(distDir, '404.html');

if (!existsSync(indexPath)) {
  console.error('[prepare-pages] Error: dist/index.html does not exist. Run vite build first.');
  process.exit(1);
}

copyFileSync(indexPath, fallbackPath);
console.log(
  '[prepare-pages] Successfully copied dist/index.html to dist/404.html for GitHub Pages SPA fallback.',
);
