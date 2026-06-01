#!/usr/bin/env node
/**
 * 将 docs/images/readme/*.png 同步到 website/public/images/readme/，并生成同名 WebP。
 * 前置：npm run docs:readme-images
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'docs', 'images', 'readme');
const destDir = join(root, 'website', 'public', 'images', 'readme');

async function main() {
  if (!existsSync(srcDir)) {
    console.error('[website:sync-images] 缺少源目录，请先执行: npm run docs:readme-images');
    process.exit(1);
  }

  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('[website:sync-images] 缺少 sharp，请执行: npm i');
    process.exit(1);
  }

  mkdirSync(destDir, { recursive: true });
  const pngs = readdirSync(srcDir).filter((name) => name.toLowerCase().endsWith('.png'));
  if (pngs.length === 0) {
    console.error('[website:sync-images] 源目录无 PNG');
    process.exit(1);
  }

  for (const name of pngs.sort()) {
    const src = join(srcDir, name);
    const destPng = join(destDir, name);
    copyFileSync(src, destPng);
    const destWebp = join(destDir, name.replace(/\.png$/i, '.webp'));
    await sharp(src).webp({ quality: 85 }).toFile(destWebp);
    console.log(`[website:sync-images] ✓ ${name}`);
  }

  console.log(`\n[website:sync-images] 完成 → ${destDir}`);
}

main().catch((e) => {
  console.error(`[website:sync-images] ✗ ${e.message}`);
  process.exit(1);
});
