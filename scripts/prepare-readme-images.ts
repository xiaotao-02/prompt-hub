#!/usr/bin/env node
/**
 * 从商店 LibTV 素材与 logo 生成 README 用配图（docs/images/readme/）。
 * 不调用 LibTV；缺源图时提示先执行 npm run store:libtv。
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'docs', 'images', 'readme');
const storeAssets = join(root, 'store-assets');

const JOBS = [
  {
    out: 'logo-128.png',
    src: join(root, 'public', 'icons', 'icon-128.png'),
    width: null,
    hint: 'public/icons/icon-128.png',
  },
  {
    out: 'hero-marquee.png',
    src: join(storeAssets, 'promo', 'marquee-1400x560.png'),
    width: 1200,
    hint: 'npm run store:libtv（节点 promo-marquee）',
  },
  {
    out: 'workflow-three-step.png',
    src: join(storeAssets, 'screenshots', 'screenshot-1-hero.png'),
    width: 960,
    hint: 'npm run store:libtv（节点 shot-1-hero）',
  },
  {
    out: 'reference-panel.png',
    src: join(storeAssets, 'screenshots', 'screenshot-2-reference.png'),
    width: 960,
    hint: 'npm run store:libtv（节点 shot-2-reference）',
  },
  {
    out: 'popup-history.png',
    src: join(storeAssets, 'screenshots', 'screenshot-3-popup.png'),
    width: 960,
    hint: 'npm run store:libtv（节点 shot-3-popup）',
  },
  {
    out: 'settings-quickstart.png',
    src: join(storeAssets, 'screenshots', 'screenshot-4-settings.png'),
    width: 960,
    hint: 'npm run store:libtv（节点 shot-4-settings）',
  },
  {
    out: 'providers-grid.png',
    src: join(storeAssets, 'screenshots', 'screenshot-5-providers.png'),
    width: 960,
    hint: 'npm run store:libtv（节点 shot-5-providers）',
  },
  {
    out: 'context-menu.png',
    src: join(outDir, 'context-menu-libtv.png'),
    width: 960,
    hint: 'npm run store:libtv -- --only readme-context-menu',
    /** LibTV 默认写到 context-menu.png；先复制为 libtv 源再缩放 */
    libtvSource: join(outDir, 'context-menu.png'),
  },
  {
    out: 'prompt-library.png',
    src: join(outDir, 'prompt-library-libtv.png'),
    width: 960,
    hint: 'npm run store:libtv -- --only readme-prompt-library',
    libtvSource: join(outDir, 'prompt-library.png'),
  },
];

async function writeResized(sharp, srcPath, destPath, width) {
  const input = readFileSync(srcPath);
  const outMeta = await sharp(input)
    .resize(width, null, { withoutEnlargement: true, fit: 'inside' })
    .png({ compressionLevel: 9 })
    .toFile(destPath);
  return outMeta;
}

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('[docs:readme-images] 缺少 sharp，请执行: npm i');
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });

  const missing = [];
  for (const job of JOBS) {
    const dest = join(outDir, job.out);
    let src = job.src;
    if (job.libtvSource && existsSync(job.libtvSource)) {
      src = job.libtvSource;
    }

    if (!existsSync(src)) {
      missing.push({ out: job.out, hint: job.hint });
      continue;
    }

    if (job.width == null) {
      copyFileSync(src, dest);
      console.log(`[docs:readme-images] ✓ ${job.out} (copy)`);
      continue;
    }

    const meta = await writeResized(sharp, src, dest, job.width);
    console.log(`[docs:readme-images] ✓ ${job.out} → ${meta.width}×${meta.height}`);
  }

  if (missing.length > 0) {
    console.error('\n[docs:readme-images] 缺少源图：');
    for (const m of missing) {
      console.error(`  - ${m.out}: ${m.hint}`);
    }
    console.error('\n生成商店/README 配图后重试: libtv account info && npm run store:libtv');
    process.exit(1);
  }

  console.log(`\n[docs:readme-images] 完成 → ${outDir}`);
}

main().catch((e) => {
  console.error(`[docs:readme-images] ✗ ${e.message}`);
  process.exit(1);
});
