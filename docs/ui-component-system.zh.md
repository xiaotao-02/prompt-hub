# UI 组件系统分层约定

面向 Prompt Hub monorepo 的**组件放置、复用边界与命名**规范。插件（`src/`）与官网（`website/`）是两套独立工程，**不跨工程合并组件**；共用同一套「L1 → L2 → L3」心智模型。

---

## 三层模型

| 层               | 插件                                                                                | 官网 + 后台                                           | 职责                               |
| ---------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------- |
| **L1 Tokens**    | `src/styles/globals.css` `@theme` + [`src/lib/uiTokens.ts`](../src/lib/uiTokens.ts) | `website/app/globals.css` `@theme`                    | 颜色/间距/圆角/阴影/字体，唯一来源 |
| **L2 原语**      | [`src/components/ui/`](../src/components/ui/)                                       | [`website/components/ui/`](../website/components/ui/) | 无业务语义的基础控件               |
| **L3 业务/复合** | `src/options/`、`src/popup/`、`src/components/*`                                    | `website/components/admin/`、`account/`、`marketing/` | 组合原语承载业务                   |

**依赖规则**：L2 不得反向依赖 L3（例如 `ui/select` 不得 import `admin/*`）。业务页优先用 L2，避免原生 `<button>`、`.btn-*` 工具类、`border-white/*` 硬编码。

---

## 插件表面（`src/`）

### Popup / Options（Tailwind 页面）

- 入口均 `import '@/styles/globals.css'`。
- 按钮、表单、分段切换等用 `@/components/ui/*`（`Button`、`Field`、`SegmentedControl`、`AnchoredMenu` 等）。
- **禁止**在 options/popup 新增 `.btn-primary` / `.btn-ghost` 用法；遗留类已迁移到 `Button` variant。

### Content 面板（Shadow DOM 例外层）

- 样式：`src/content/panel/styleSections/*.ts` 拼成字符串 CSS，经 `styles.ts` 注入 Shadow Root。
- **不能**直接套用 Tailwind 组件；色值通过 `uiTokens` → `buildPanelThemeCss()` 与 L1 对齐。
- 语义 class（`.btn`、`.strategy-dropdown`）与扩展页 `Button` **不是同一实现**，属有意双轨。

### 共享目录

| 路径                                                                | 内容                                                                                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [`src/components/ui/`](../src/components/ui/)                       | 原语：Button、Field、IconButton、SegmentedControl、AnchoredMenu、…                                                                          |
| [`src/components/`](../src/components/)                             | 跨表面领域组件：SourceTag、PlatformLoginForm、ProviderQuotaBadge                                                                            |
| [`src/hooks/`](../src/hooks/)                                       | 跨表面 hooks：useAnchoredDropdown、useCopyFeedback、…                                                                                       |
| [`src/content/panel/components/`](../src/content/panel/components/) | 面板专用 React（零引用 `@/components/ui`）；下拉外壳见 [`PanelSelectDropdown.tsx`](../src/content/panel/components/PanelSelectDropdown.tsx) |

### 有意双实现（不强合并 UI）

| 场景             | 说明                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 一键洗稿强度下拉 | 面板 Shadow 版 + 提示词库 Tailwind 版；共享 [`src/lib/oneClickRefineRandomness.ts`](../src/lib/oneClickRefineRandomness.ts) 选项与状态 |
| 版本列表         | Popup `PopupVersionsInline` vs 面板 `VersionList`；共享 `lib/versionPreview`、`hooks/useVersionsListDensity`                           |

### 何时新建原语 vs 复用

- **新建 L2**：同一交互模式在 ≥2 处出现（锚定下拉、字段壳、图标按钮）。
- **留在 L3**：仅单 Tab/单面板使用、强业务文案或 API 形状绑定。
- **面板内基座**：Shadow 内 `.sd-*` 下拉用 `PanelSelectDropdown`（策略/输出风格/模型/洗稿强度），不进入 `@/components/ui`。

---

## 官网表面（`website/`）

### 营销 / 账户 / 文档

- 原语：`website/components/ui/*`（shadcn 风格）。
- 营销区块：`website/components/marketing/`；账户：`website/components/account/`。
- 使用 `var(--color-*)` / `Card`，避免 `border-white/[0.06]` 等硬编码。

### 运营后台（`/admin`）

- L3 工作台层：`website/components/admin/`（`AdminDataTable`、`AdminFilterBar`、`AdminSectionCard`、`AdminPillToggle` 等）。
- 详情：**统一** [`AdminDetailDialog`](../website/components/admin/AdminDetailDialog.tsx)（Dialog），不用闲置的 `ui/sheet`。
- 表格：数据表用 `AdminDataTable` / `AdminSimpleTable`；勿在业务里写原生 `<table>`。
- 筛选样式：[`website/lib/styles/filter.ts`](../website/lib/styles/filter.ts)（自 admin 层下沉，供 `ui/select` variant 使用）。

详见 [`docs/admin-ui-conventions.zh.md`](admin-ui-conventions.zh.md)。

### `/admin` 布局

- [`website/app/admin/layout.tsx`](../website/app/admin/layout.tsx) 隐藏全站 `SiteHeader`/`SiteFooter`，避免营销壳与 `AdminShell` 双层。

---

## PR 与验证

- **单 PR 单主题**：插件收敛与官网收敛分开。
- 插件：`npm run lint && npm run test && npm run build`；改 popup/options/面板后 smoke 右键提取、历史、设置、提示词库。
- 官网：`npm run dev:previews` 目测 `/admin`、`/account`、营销页。

---

## 延伸阅读

- [`docs/plugin-pages-overview.zh.md`](plugin-pages-overview.zh.md) — 扩展页面口径
- [`docs/admin-ui-conventions.zh.md`](admin-ui-conventions.zh.md) — 后台 UI 约定
- [`docs/naming-glossary.zh.md`](naming-glossary.zh.md) — 面板领域术语
- [`AGENTS.md`](../AGENTS.md) — Agent 代码导航
