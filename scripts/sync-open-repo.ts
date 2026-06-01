#!/usr/bin/env tsx
/**
 * （内部参考）导出 BYOK 扩展树并在目标目录给出 git 提示。
 * 当前仓库已全闭源，**不是**日常发布路径。
 *
 * 用法：
 *   npx tsx scripts/sync-open-repo.ts --out ../plugin-open
 *   npx tsx scripts/sync-open-repo.ts --out ../plugin-open --verify
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OPEN_REPO_HOMEPAGE } from './byok/config.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

function parseArgs(): { out: string; verify: boolean } {
  const args = process.argv.slice(2);
  let out = resolve(repoRoot, '../plugin-open');
  let verify = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) {
      out = resolve(args[++i]);
    } else if (args[i] === '--verify') {
      verify = true;
    }
  }
  return { out, verify };
}

function main(): void {
  const { out, verify } = parseArgs();
  const exportScript = join(here, 'export-byok-repo.ts');
  const verifyFlag = verify ? ' --verify' : '';
  execSync(`npx tsx "${exportScript}" --out "${out}"${verifyFlag}`, {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  const pkgPath = join(out, 'package.json');
  const version = existsSync(pkgPath)
    ? ((JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string }).version ?? '?')
    : '?';

  console.log('');
  console.log('[sync:open-repo] 导出完成。若需推送到新的插件开源仓：');
  console.log(`  cd "${out}"`);
  console.log('  git init');
  console.log('  git add .');
  console.log(`  git commit -m "chore: plugin export v${version}"`);
  console.log('  git branch -M main');
  console.log('  git remote add origin <你的新开源仓库 URL>');
  console.log('  git push -u origin main');
  console.log('');
  console.log(`（历史参考 homepage：${OPEN_REPO_HOMEPAGE}，请在新仓重新定义）`);
}

main();
