#!/usr/bin/env node
/**
 * 从 store-assets/libtv/raw/<node>/ 手动原图裁剪导出到商店素材路径，
 * 并将 icon-gen 原图复制为 public/icons-src/source.png。
 *
 * 用法：npm run store:libtv:export-raw
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveTaskOutAbs } from './_store-task-paths.ts';
import { validateStoreAssets } from './validate-store-assets.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const rawDir = join(root, 'store-assets', 'libtv', 'raw');
const promptsPath = join(root, 'store-assets', 'libtv', 'prompts.json');

const EXPORT_NODES = [
  'promo-small',
  'promo-marquee',
  'shot-1-hero',
  'shot-2-reference',
  'shot-3-popup',
  'shot-4-settings',
  'shot-5-providers',
  'icon-gen',
] as const;

function findLatestImage(dir: string): string {
  const exts = new Set(['.png', '.jpg', '.jpeg', '.webp']);
  let best: string | null = null;
  let bestMtime = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (!st.isFile()) continue;
    const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
    if (!exts.has(ext)) continue;
    if (st.mtimeMs > bestMtime) {
      bestMtime = st.mtimeMs;
      best = p;
    }
  }
  if (!best) throw new Error(`下载目录无图片: ${dir}`);
  return best;
}

async function cropToSize(inputPath: string, outPath: string, width: number, height: number) {
  const sharp = (await import('sharp')).default;
  mkdirSync(dirname(outPath), { recursive: true });
  await sharp(inputPath)
    .resize(width, height, {
      fit: 'contain',
      position: 'centre',
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toFile(outPath);
}

async function main(): Promise<void> {
  if (!existsSync(promptsPath)) throw new Error(`缺少配置: ${promptsPath}`);
  const cfg = JSON.parse(readFileSync(promptsPath, 'utf-8'));
  const tasks = (cfg.tasks ?? []).filter((t: { node: string }) =>
    (EXPORT_NODES as readonly string[]).includes(t.node),
  );
  if (tasks.length === 0) throw new Error('prompts.json 中无匹配导出节点');

  for (const task of tasks) {
    const raw = findLatestImage(join(rawDir, task.node));
    const out = resolveTaskOutAbs(task, root);
    await cropToSize(raw, out, task.width, task.height);
    console.log(
      `[export-raw] OK ${task.node} → ${relative(root, out)} (${task.width}×${task.height})`,
    );
  }

  const iconRaw = findLatestImage(join(rawDir, 'icon-gen'));
  const sourcePath = join(root, 'public', 'icons-src', 'source.png');
  mkdirSync(dirname(sourcePath), { recursive: true });
  copyFileSync(iconRaw, sourcePath);
  console.log(`[export-raw] OK icon → public/icons-src/source.png ← ${relative(root, iconRaw)}`);

  const storeNodes = EXPORT_NODES.filter((n) => n !== 'icon-gen');
  const validated = await validateStoreAssets({ onlyNodes: [...storeNodes], rootDir: root });
  for (const r of validated.results) {
    const tag = r.ok ? 'OK' : 'FAIL';
    const detail = r.ok ? r.actual : (r.error ?? `${r.actual} (expect ${r.expect})`);
    console.log(`[export-raw] 验收 ${tag} ${r.node} → ${r.path} (${detail})`);
  }
  if (!validated.allOk) process.exit(1);
}

main().catch((e) => {
  console.error(`[export-raw] ✗ ${e?.stack || e}`);
  process.exit(1);
});
