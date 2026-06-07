/**
 * 上线前占位域名检查。
 * 仓库内 `github.com/xiaotao-02/prompt-hub` 为临时占位；正式上架前须替换为已购真实域名。
 *
 * 用法：
 *   npx tsx scripts/checkLaunchDomain.ts
 *   npm run check:launch-domain
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LEGACY_DOMAIN_PLACEHOLDER } from '../src/lib/platform/productionDomain.js';

/** 历史占位域名（源码中不应再出现） */
export const DOMAIN_PLACEHOLDER = LEGACY_DOMAIN_PLACEHOLDER;

/** 发版 / 上线 smoke 前应确认无占位域名的关键路径（相对仓库根） */
export const LAUNCH_DOMAIN_CHECK_PATHS = [
  'src/lib/platform/config.ts',
  'services/api/src/env.ts',
  'website/lib/config.ts',
  'store-listing/privacy-policy-url.txt',
  'store-listing/misc-urls.txt',
] as const;

export type DomainPlaceholderHit = { path: string; count: number };

export function findDomainPlaceholderHits(root = process.cwd()): DomainPlaceholderHit[] {
  const hits: DomainPlaceholderHit[] = [];
  for (const rel of LAUNCH_DOMAIN_CHECK_PATHS) {
    const abs = join(root, rel);
    if (!existsSync(abs)) continue;
    const raw = readFileSync(abs, 'utf-8');
    const count = raw.split(DOMAIN_PLACEHOLDER).length - 1;
    if (count > 0) hits.push({ path: rel, count });
  }
  return hits;
}

export function formatLaunchDomainReminder(hits: DomainPlaceholderHit[]): string {
  const lines = [
    '',
    '══════════════════════════════════════════════════════════════',
    '  ⚠  上线提醒：仍检测到占位域名 github.com/xiaotao-02/prompt-hub',
    '══════════════════════════════════════════════════════════════',
    '',
    '正式上架 / 扩展↔官网登录联动前，必须替换为已购真实域名，例如：',
    '  aipromptstudio.com  →  https://aipromptstudio.com',
    '                      →  https://api.aipromptstudio.com',
    '',
    '建议步骤：',
    '  1) 全局搜索 github.com/xiaotao-02/prompt-hub 并替换（含 api. 子域、邮箱 noreply@）',
    '  2) 更新 Zeabur / VPS 的 SITE_URL、API_PUBLIC_URL、CORS_ORIGIN',
    '  3) 重新部署 website + services/api',
    '  4) npm run release:store 重新打商店包',
    '',
    '详细清单：store-listing/CHECKLIST.md §「0. 正式域名」',
    '',
    '仍含占位域名的文件：',
    ...hits.map((h) => `  - ${h.path}（${h.count} 处）`),
    '',
    '若仅为本地试打包、尚未购域名，可临时加 --allow-placeholder-domain 跳过阻断。',
    '══════════════════════════════════════════════════════════════',
    '',
  ];
  return lines.join('\n');
}

function main(): void {
  const hits = findDomainPlaceholderHits();
  if (hits.length === 0) {
    console.log('[check:launch-domain] ✓ 关键路径未发现占位域名');
    return;
  }
  console.error(formatLaunchDomainReminder(hits));
  process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
