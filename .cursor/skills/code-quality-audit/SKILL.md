---
name: code-quality-audit
description: >-
  Runs Prompt Hub code-quality checks (knip, TypeScript, ESLint, Vitest)
  and reports findings with suggested PR slices. Use when the user asks for
  代码质量审计, 质量检查, knip + lint, dead code scan, or overall code health review.
disable-model-invocation: true
---

# 代码质量审计

对本仓库执行标准化质量门禁，输出可执行的发现项与 PR 切片建议。遵循 [.cursor/rules/code-quality.mdc](../../rules/code-quality.mdc)。

## 执行顺序

在项目根目录依次运行：

```bash
npm run knip
npm run lint
npm run test
```

可选（大文件盘点，PowerShell）：

```powershell
Get-ChildItem src -Recurse -Include *.ts,*.tsx |
  ForEach-Object { [PSCustomObject]@{ Lines = (Get-Content $_.FullName | Measure-Object -Line).Lines; Path = $_.FullName } } |
  Sort-Object Lines -Descending | Select-Object -First 15
```

已知超长文件对照（结构拆分候选，勿与 knip PR 混做）：

- `src/content/panel/events.ts`
- `src/background/index.ts`
- `src/options/PromptLibrary/index.tsx`
- `src/content/panel/styles.ts`
- `src/content/panel/templates.ts`
- `src/lib/configImport.ts`
- `src/options/DataPersistence.tsx`

## 输出模板

```markdown
## 代码质量审计

### 通过

- [ ] knip / lint / test（列出实际命令结果）

### 发现项

| 严重度 | 类别                                   | 位置 | 说明 |
| ------ | -------------------------------------- | ---- | ---- |
| …      | dead-code / types / eslint / structure | path | …    |

### 建议 PR 切片

1. …（单主题，可独立 review）

### 未做（scope 外）

- …
```

## 规则

- **不扩大 scope**：审计报告中的修复项需用户确认后再改；默认只报告。
- **单 PR 单主题**：knip 清理 ≠ background 拆分 ≠ content FSM。
- 结构改动后必须 `npm run build`；涉及 panel/background 时提示 smoke（提取、设置、提示词库）。
- 改动面大时提示使用全局 skill `split-to-prs` 拆 PR。
- 详细架构路线见 [docs/optimization-roadmap.md](../../../docs/optimization-roadmap.md)。
