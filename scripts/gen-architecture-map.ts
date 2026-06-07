#!/usr/bin/env node
/**
 * 生成扩展核心 src/ 架构知识图谱：目录树 + 模块导出清单 + 目录级 mermaid 依赖图。
 * 输出 docs/architecture-map.generated.md（pre-commit 在 src 变更时自动调用）。
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcRoot = join(root, 'src');
const outFile = join(root, 'docs', 'architecture-map.generated.md');

const SKIP_PATH_PARTS = ['dev/preview'];

function shouldSkipFile(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, '/');
  if (/\.test\.(ts|tsx)$/.test(normalized)) return true;
  return SKIP_PATH_PARTS.some((part) => normalized.includes(part));
}

function shouldSkipDir(relDir: string): boolean {
  const normalized = relDir.replace(/\\/g, '/');
  if (SKIP_PATH_PARTS.some((part) => normalized.includes(part))) return true;
  return false;
}

function walkSrcFiles(dir: string, base = ''): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    const relPosix = rel.replace(/\\/g, '/');
    const st = statSync(abs);

    if (st.isDirectory()) {
      if (entry === 'dev' && base === '') continue;
      if (shouldSkipDir(relPosix)) continue;
      results.push(...walkSrcFiles(abs, relPosix));
      continue;
    }

    if (!/\.(ts|tsx)$/.test(entry)) continue;
    if (shouldSkipFile(relPosix)) continue;
    results.push(relPosix);
  }

  return results.sort();
}

function collectExports(sourceText: string, filePath: string): string[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const exports = new Set<string>();
  let hasDefaultExport = false;

  const addNamed = (name: string | undefined) => {
    if (name) exports.add(name);
  };

  for (const stmt of sourceFile.statements) {
    if (ts.isExportAssignment(stmt)) {
      hasDefaultExport = true;
      continue;
    }

    if (ts.isExportDeclaration(stmt)) {
      if (stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
        for (const el of stmt.exportClause.elements) {
          addNamed(el.name.text);
        }
      } else if (!stmt.exportClause && stmt.moduleSpecifier) {
        exports.add(`* from ${stmt.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '')}`);
      }
      continue;
    }

    const isExported =
      ts.canHaveModifiers(stmt) &&
      stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

    if (!isExported) continue;

    if (ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt)) {
      addNamed(stmt.name?.text);
      if (stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) {
        hasDefaultExport = true;
      }
    } else if (
      ts.isInterfaceDeclaration(stmt) ||
      ts.isTypeAliasDeclaration(stmt) ||
      ts.isEnumDeclaration(stmt)
    ) {
      addNamed(stmt.name.text);
    } else if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) addNamed(decl.name.text);
      }
      if (stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) {
        hasDefaultExport = true;
      }
    }
  }

  if (hasDefaultExport) exports.add('default');

  return [...exports].sort((a, b) => a.localeCompare(b));
}

function buildDirectoryTree(files: string[]): string {
  type TreeNode = { dirs: Map<string, TreeNode>; files: string[] };
  const rootNode: TreeNode = { dirs: new Map(), files: [] };

  for (const file of files) {
    const parts = file.split('/');
    let node = rootNode;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      if (i === parts.length - 1) {
        node.files.push(part);
      } else {
        if (!node.dirs.has(part)) node.dirs.set(part, { dirs: new Map(), files: [] });
        node = node.dirs.get(part)!;
      }
    }
  }

  const lines: string[] = ['src/'];

  function renderDir(node: TreeNode, prefix: string) {
    const dirNames = [...node.dirs.keys()].sort();
    const fileNames = [...node.files].sort();
    const entries = [
      ...dirNames.map((name) => ({ kind: 'dir' as const, name })),
      ...fileNames.map((name) => ({ kind: 'file' as const, name })),
    ];

    entries.forEach((entry, index) => {
      const isLast = index === entries.length - 1;
      const branch = isLast ? '└── ' : '├── ';
      const childPrefix = prefix + (isLast ? '    ' : '│   ');

      if (entry.kind === 'file') {
        lines.push(`${prefix}${branch}${entry.name}`);
      } else {
        lines.push(`${prefix}${branch}${entry.name}/`);
        renderDir(node.dirs.get(entry.name)!, childPrefix);
      }
    });
  }

  renderDir(rootNode, '');
  return lines.join('\n');
}

function buildModuleInventory(files: string[]): string {
  const byDir = new Map<string, Array<{ file: string; exports: string[] }>>();

  for (const rel of files) {
    const abs = join(srcRoot, rel);
    let sourceText: string;
    try {
      sourceText = readFileSync(abs, 'utf8');
    } catch {
      continue;
    }

    const relPath = `src/${rel}`;
    const exportNames = collectExports(sourceText, relPath);
    const dirKey = rel.includes('/') ? `src/${dirname(rel).replace(/\\/g, '/')}` : 'src';
    if (!byDir.has(dirKey)) byDir.set(dirKey, []);
    byDir.get(dirKey)!.push({ file: rel.split('/').pop()!, exports: exportNames });
  }

  const sections: string[] = [];
  for (const dir of [...byDir.keys()].sort()) {
    sections.push(`### \`${dir}/\`\n`);
    for (const { file, exports } of byDir.get(dir)!) {
      const exportList = exports.length > 0 ? exports.join(', ') : '_(无命名导出)_';
      sections.push(`- \`${file}\` — ${exportList}`);
    }
    sections.push('');
  }

  return sections.join('\n').trimEnd();
}

function generateMermaidDiagram(): string {
  const depcruiseMjs = join(
    root,
    'node_modules',
    'dependency-cruiser',
    'bin',
    'dependency-cruise.mjs',
  );

  if (!existsSync(depcruiseMjs)) {
    return '%% dependency-cruiser 未安装，请运行 npm install\nflowchart LR\n  missing[depcruise not found]';
  }

  const args = [
    depcruiseMjs,
    'src',
    '--config',
    '.dependency-cruiser.cjs',
    '--include-only',
    '^src',
    '--collapse',
    '^src/[^/]+/[^/]+',
    '--output-type',
    'mermaid',
  ];

  try {
    const output = execFileSync(process.execPath, args, {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return output.trim();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return `%% depcruise failed: ${message.replace(/\n/g, ' ')}\nflowchart LR\n  error[depcruise failed]`;
  }
}

function main() {
  const files = walkSrcFiles(srcRoot);
  const generatedAt = new Date().toISOString();
  const tree = buildDirectoryTree(files);
  const inventory = buildModuleInventory(files);
  const mermaid = generateMermaidDiagram();

  const markdown = `<!-- AUTO-GENERATED by npm run docs:map — 请勿手改 -->
# 架构知识图谱（自动生成）

> 生成时间：${generatedAt}  
> 范围：\`src/\`（排除 \`*.test.*\`、\`dev/preview\`）  
> 更新方式：\`npm run docs:map\`，或在提交含 \`src/\` 变更时由 pre-commit 自动刷新。

---

## 目录树

\`\`\`text
${tree}
\`\`\`

---

## 目录级依赖图

折叠粒度：\`src/<层>/<模块>\`（例如 \`src/lib/api\`、\`src/content/panel\`）。

\`\`\`mermaid
${mermaid}
\`\`\`

---

## 模块导出清单

${inventory}
`;

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, markdown, 'utf8');
  console.log(`Wrote ${relative(root, outFile).replace(/\\/g, '/')} (${files.length} files)`);
}

main();
