---
name: 修复 export-byok 卡住
overview: 将 export:byok 的整树递归复制改为基于 git ls-files 的白名单复制，并把「全量 rmSync 目标目录」改为保留 node_modules/.git 的安全清理，消除 Windows 上的卡顿；同步更新 plan.md。
todos:
  - id: copytree
    content: 重写 scripts/byok/copyTree.ts 的 copyRepoTree：改用 git ls-files -z 白名单复制，新增 cleanDest 保留 node_modules/.git，删除 copyDir/isUnderDestRoot
    status: completed
  - id: export-verify
    content: 调整 scripts/export-byok-repo.ts：--verify 用 npm install --no-audit --no-fund 代替 npm ci；仓库内输出目录加提示
    status: completed
  - id: plan-doc
    content: 更新 plan.md：说明 git ls-files 复制机制、保留 node_modules 清理、补充卡顿风险条
    status: completed
  - id: verify
    content: 跑 npm run lint 与 npm run export:byok -- --out .export-byok-test 验证不再卡，重跑确认 node_modules 被保留
    status: completed
isProject: false
---

## 背景：卡住根因

[scripts/byok/copyTree.ts](scripts/byok/copyTree.ts) 的手写整树递归复制在 Windows 上有三处卡点：

- **主因**：`copyRepoTree` 开头 `rmSync(destRoot, { recursive: true, force: true })`。一旦目标目录（如 `.export-byok-test/`）残留 `--verify` 装出来的 `node_modules`，Windows 递归删上万小文件极慢，表现为卡死。
- **排除失效**：`EXPORT_EXCLUDE_DIRS` 里 `store-assets/libtv/raw` 用正斜杠，而 Windows `relative()` 返回反斜杠 `rel`，`has(rel)` 永不命中，嵌套大目录会被全量复制。
- **慢且脆**：逐文件 `statSync`/`cpSync`、依赖手维护排除清单。

仓库仅 603 个 tracked 文件，改用 `git ls-files` 白名单复制可从根上绕开 `node_modules`/`dist`/`.export-byok-test` 等未跟踪目录。

## 修改 1：[scripts/byok/copyTree.ts](scripts/byok/copyTree.ts) `copyRepoTree`

用 git 跟踪文件清单替换手写递归：

```ts
import { execFileSync } from 'node:child_process';

const PRESERVE_ON_CLEAN = new Set(['node_modules', '.git']);

export function copyRepoTree(srcRoot: string, destRoot: string): void {
  cleanDest(destRoot); // 不再 rmSync 整个目录

  const out = execFileSync('git', ['ls-files', '-z'], {
    cwd: srcRoot,
    maxBuffer: 64 * 1024 * 1024,
  }).toString('utf8');
  const files = out.split('\0').filter(Boolean); // git 返回正斜杠路径

  for (const rel of files) {
    const top = rel.split('/')[0];
    if (EXPORT_EXCLUDE_DIRS.has(top) || EXPORT_EXCLUDE_DIRS.has(rel)) continue;
    if (rel.startsWith('services/') || rel.startsWith('website/')) continue;
    const srcPath = join(srcRoot, rel);
    const destPath = join(destRoot, rel);
    mkdirSync(dirname(destPath), { recursive: true });
    cpSync(srcPath, destPath);
  }

  for (const rel of BYOK_DELETE_PATHS) {
    const abs = join(destRoot, rel);
    if (existsSync(abs)) rmSync(abs, { recursive: true, force: true });
  }
}

function cleanDest(destRoot: string): void {
  if (!existsSync(destRoot)) {
    mkdirSync(destRoot, { recursive: true });
    return;
  }
  for (const name of readdirSync(destRoot)) {
    if (PRESERVE_ON_CLEAN.has(name)) continue; // 保留 node_modules/.git，重跑/verify 不再卡
    rmSync(join(destRoot, name), { recursive: true, force: true });
  }
}
```

- 删除旧的 `copyDir` / `isUnderDestRoot`（git ls-files 不会列出 dest 内未跟踪文件，递归自指风险消失）。
- 因 `git ls-files` 不列 gitignore 目录，`EXPORT_EXCLUDE_DIRS` 的跨平台斜杠 bug 不再影响结果（保留该 Set 仅作二次保险，按正斜杠匹配）。
- 保留 `applyOverlayFiles` / `patchFile` / `walkFiles` / `readDest` / `writeDest` 不变。

## 修改 2：[scripts/export-byok-repo.ts](scripts/export-byok-repo.ts)

- `--verify` 阶段把 `npm ci`（会先删 node_modules 再联网全量装，慢且易卡）改为 `npm install --no-audit --no-fund`，配合保留的 `node_modules` 走缓存增量安装。
- `npm run test` 已是 `vitest run`（非 watch），保持不变。
- 目标目录在仓库内时打印一行提示（允许但提醒 gitignore），不强制拦截。

## 修改 3：[.cursor/plans/插件开源仓库拆分_6828c6c6.plan.md](.cursor/plans/插件开源仓库拆分_6828c6c6.plan.md)

在「推荐实现：私有仓内 export-byok 脚本」一节补充：

- 复制机制说明改为「基于 `git ls-files` 的 tracked 白名单复制」（替代手写整树递归）。
- 目标目录清理「保留 `node_modules`/`.git`」以加速重跑与 `--verify`。
- 在「风险与注意」补一条：Windows 下勿对含 `node_modules` 的输出目录做整目录 `rmSync`。

## 验证

```bash
npm run lint
npm run export:byok -- --out .export-byok-test
```

确认无卡顿、`.export-byok-test/` 内 platform 文件已剔除、文档已生成；重复跑一次确认 `node_modules` 被保留且秒级清理。