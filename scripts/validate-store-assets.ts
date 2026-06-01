#!/usr/bin/env node
/**
 * 验收 Chrome Web Store 素材 PNG 尺寸。
 * 读取 store-assets/libtv/prompts.json 中每条 task 的 out/width/height。
 *
 * 用法：tsx scripts/validate-store-assets.ts [--only node1,node2]
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTaskOutAbs } from './_store-task-paths.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const promptsPath = join(root, 'store-assets', 'libtv', 'prompts.json');

function parseOnlyArg() {
  const idx = process.argv.indexOf('--only');
  if (idx === -1) return null;
  return (
    process.argv[idx + 1]
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? null
  );
}

export async function validateStoreAssets({ onlyNodes = null, rootDir = root } = {}) {
  if (!existsSync(promptsPath)) {
    throw new Error(`缺少配置: ${promptsPath}`);
  }
  const cfg = JSON.parse(readFileSync(promptsPath, 'utf-8'));
  let tasks = (cfg.tasks ?? []).filter((t) => t.storeAsset !== false);
  if (onlyNodes?.length) {
    const set = new Set(onlyNodes);
    tasks = tasks.filter((t) => set.has(t.node));
    if (tasks.length === 0) {
      throw new Error(`--only 未匹配任何节点: ${onlyNodes.join(', ')}`);
    }
  }

  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    throw new Error('缺少 sharp，请执行: npm i -D sharp');
  }

  const results = [];
  let allOk = true;
  for (const task of tasks) {
    const abs = resolveTaskOutAbs(task, rootDir);
    const rel = relative(rootDir, abs);
    if (!existsSync(abs)) {
      allOk = false;
      results.push({ node: task.node, path: rel, ok: false, error: '文件不存在' });
      continue;
    }
    const meta = await sharp(abs).metadata();
    const ok = meta.width === task.width && meta.height === task.height;
    if (!ok) allOk = false;
    results.push({
      node: task.node,
      path: rel,
      ok,
      actual: `${meta.width}×${meta.height}`,
      expect: `${task.width}×${task.height}`,
    });
  }
  return { allOk, results, total: tasks.length };
}

async function main() {
  const onlyNodes = parseOnlyArg();
  const { allOk, results, total } = await validateStoreAssets({ onlyNodes });
  for (const r of results) {
    const tag = r.ok ? 'OK' : 'FAIL';
    const detail = r.ok ? `${r.actual}` : (r.error ?? `${r.actual} (expect ${r.expect})`);
    console.log(`[validate] ${tag} ${r.node} → ${r.path} (${detail})`);
  }
  console.log(`[validate] ${results.filter((r) => r.ok).length}/${total} 通过`);
  if (!allOk) process.exit(1);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  main().catch((e) => {
    console.error(`[validate] ✗ ${e.message}`);
    process.exit(1);
  });
}
