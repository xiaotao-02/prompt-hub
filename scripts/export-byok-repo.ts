#!/usr/bin/env tsx
/**
 * （内部参考）从私有 monorepo 导出 BYOK 扩展树。
 * 当前仓库已全闭源，本脚本**不是**日常发布路径；未来新建插件开源仓时可复用裁剪思路。
 *
 * 手动运行：
 *   npx tsx scripts/export-byok-repo.ts --out ../plugin-open --verify
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyAllByokPatches } from './byok/applyPatches.js';
import { copyRepoTree } from './byok/copyTree.js';
import { writeOpenRepoDocs } from './byok/generateDocs.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const overlayRoot = join(here, 'byok/overlays');

function parseArgs(): { out: string; verify: boolean } {
  const args = process.argv.slice(2);
  let out = '';
  let verify = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) {
      out = resolve(args[++i]);
    } else if (args[i] === '--verify') {
      verify = true;
    }
  }
  if (!out) {
    console.error('用法: npx tsx scripts/export-byok-repo.ts --out <目标目录> [--verify]');
    process.exit(1);
  }
  return { out, verify };
}

function isInsideRepo(absPath: string): boolean {
  const resolved = resolve(absPath);
  return (
    resolved === repoRoot ||
    resolved.startsWith(`${repoRoot}\\`) ||
    resolved.startsWith(`${repoRoot}/`)
  );
}

function main(): void {
  const { out, verify } = parseArgs();
  console.log(`[export:byok] 源: ${repoRoot}`);
  console.log(`[export:byok] 目标: ${out}`);
  if (isInsideRepo(out) && out !== repoRoot) {
    console.log(
      '[export:byok] 提示: 目标在仓库内，已 gitignore；清理时保留 node_modules/.git 以加速重跑',
    );
  }

  mkdirSync(out, { recursive: true });
  console.log('[export:byok] 复制源树…');
  copyRepoTree(repoRoot, out);
  console.log('[export:byok] 应用 BYOK 补丁…');
  applyAllByokPatches(out, overlayRoot, repoRoot);
  console.log('[export:byok] 生成公开版文档…');
  writeOpenRepoDocs(out, repoRoot);

  console.log('[export:byok] 补丁与文档已写入');

  if (verify) {
    console.log(
      '[export:byok] 验证: npm install --no-audit --no-fund && npm run lint && npm run test && npm run build',
    );
    execSync('npm install --no-audit --no-fund', { cwd: out, stdio: 'inherit' });
    execSync('npm run lint', { cwd: out, stdio: 'inherit' });
    execSync('npm run test', { cwd: out, stdio: 'inherit' });
    execSync('npm run build', { cwd: out, stdio: 'inherit' });
    console.log('[export:byok] 验证通过');
  } else {
    console.log('[export:byok] 跳过验证（加 --verify 可在目标目录跑 lint/test/build）');
  }
}

main();
