# 官网与运营后台 UI 组件系统

面向 `website/` 的统一设计规范与组件分层说明。Chrome 扩展 UI 不在本系统范围内。

## 视觉原则

- **暗色克制**：近黑底 + 细白边框，品牌紫（`--color-brand`）仅用于焦点、链接与关键状态。
- **官网营销页**：强层级、短文案、少卡片；Hero 以品牌与承诺为主，不做 dashboard 式卡片墙。
- **运营后台**：操作效率优先；筛选、表格、状态、详情抽屉可扫描；文案用 utility copy，不用营销腔。
- **参考**：shadcn/ui（源码归项目）、Tailwind Catalyst（应用布局组合）、Linear / Stripe / Vercel（高密度产品 UI）。

## 设计 Token

权威来源：[website/app/globals.css](../website/app/globals.css)

| 类别        | 变量                                                       | 用途                      |
| ----------- | ---------------------------------------------------------- | ------------------------- |
| 背景        | `--color-bg`, `--color-elevated`, `--color-elevated-2`     | 页面底、卡片、侧栏 active |
| 边框        | `--color-border`, `--color-border-strong`                  | 默认边框、强调边框        |
| 文字        | `--color-text`, `--color-text-muted`, `--color-text-faint` | 正文、次要、占位          |
| 品牌        | `--color-brand`, `--color-brand-glow`                      | 主色、高亮文字            |
| shadcn 语义 | `--primary`, `--card`, `--muted`, `--ring` 等              | 与 `components/ui` 对齐   |

**约定**：新组件优先使用 `var(--color-*)` 或 Tailwind 映射的语义色，避免硬编码 `zinc-*` 与 token 混用。

## 组件分层

```
DesignTokens (globals.css)
    ↓
UIPrimitives (website/components/ui/)
    ↓
AppPatterns (website/components/layout/, website/components/admin/Admin*.tsx 模式件)
    ↓
DomainComponents (AdminUsers, AdminUpstreams, marketing blocks…)
    ↓
Pages (app/)
```

### UIPrimitives（`components/ui/`）

无业务语义，可跨官网与后台复用：

- 已有：`button`, `card`, `dialog`, `input`, `field`, `badge`, `stat`, `pagination`, `toast`, `command`, `skeleton`
- 新增：`select`, `sheet`, `dropdown-menu`, `tabs`, `table`, `description-list`, `empty-state`, `error-banner`
- 统一导出：[website/components/ui/index.ts](../website/components/ui/index.ts)

### AppPatterns

| 组件                      | 路径                                    | 用途                                        |
| ------------------------- | --------------------------------------- | ------------------------------------------- |
| `SidebarLayout`           | `components/layout/SidebarLayout.tsx`   | 240px 侧栏 + 主内容网格                     |
| `SideNav` / `SideNavLink` | `components/layout/SideNav.tsx`         | 侧栏导航样式与链接                          |
| `AdminFilterBar`          | `components/admin/AdminFilterBar.tsx`   | 列表筛选行（搜索/日期/提交/重置/导出 slot） |
| `AdminDrawer`             | `components/admin/AdminDrawer.tsx`      | 右侧详情抽屉                                |
| `AdminDetailRow`          | `components/admin/AdminDetailRow.tsx`   | 详情 dl 行                                  |
| `AdminStatusBadge`        | `components/admin/AdminStatusBadge.tsx` | 订单/退款/日志/熔断等状态色                 |
| `AdminDataTable`          | `components/admin/AdminDataTable.tsx`   | 服务端排序 + 分页列表                       |
| `AdminSimpleTable`        | `components/admin/AdminSimpleTable.tsx` | 只读/simple 表格                            |

## 状态色映射

`AdminStatusBadge` 统一后台枚举展示，业务页禁止手写 `Badge variant={...}` 判断订单/日志状态。

## 迁移规则

1. **小步替换**：每次只迁移一个模式（如先 `AdminDrawer`，再三个详情抽屉）。
2. **不混 PR 主题**：组件系统 PR 不顺手改无关业务逻辑。
3. **保留 hooks**：`useAdminFilterForm` / `useAdminList` 不变，只换 UI 壳。
4. **plugin-showcase**：`marketing/plugin-showcase/shared.css` 保留 mock 专用样式，但颜色引用 `--color-*` token。

## 使用示例

### 筛选栏

```tsx
<AdminFilterBar onSubmit={filter.handleSubmit} onReset={filter.handleReset} trailing={<AdminExportButton ... />}>
  <Input ... className={adminFilterInputClass} />
  <AdminDateRange ... />
</AdminFilterBar>
```

### 详情抽屉

```tsx
<AdminDrawer open={!!order} onClose={() => setOrder(null)} title="充值订单">
  <dl className="grid gap-2">
    <AdminDetailRow label="状态">
      <AdminStatusBadge kind="order" status={order.status} />
    </AdminDetailRow>
  </dl>
</AdminDrawer>
```

### 侧栏布局

```tsx
<SidebarLayout
  maxWidth="7xl"
  sidebarLabel="管理后台"
  sidebar={<SideNav label="管理后台">{/* SideNavItem / SideNavLink */}</SideNav>}
  mobileNav={/* pill nav */}
>
  {children}
</SidebarLayout>
```

## 后台手测清单

改造后需在 `/admin` 验证：

- [ ] 用户 / 订单 / 退款 / 日志 / 审计：筛选、重置、分页、导出
- [ ] 订单 / 日志 / 审计：详情抽屉打开、关闭、Esc、遮罩点击
- [ ] 上游：卡片操作菜单、详情 Dialog Tab 切换
- [ ] 账户 `/account`、文档 `/docs`：侧栏 active 与移动端 pill 导航

## 现状盘点（2026-06）

| 区域     | 已有                            | 缺口（已补或进行中）                                   |
| -------- | ------------------------------- | ------------------------------------------------------ |
| Token    | `globals.css` @theme            | 统一 `--color-elevated`（曾误用 `--color-elevated-1`） |
| ui/      | 16 个 primitive                 | Select, Sheet, Dropdown, Tabs, Table, Empty, Error     |
| 后台列表 | AdminDataTable + hooks          | FilterBar, StatusBadge, Drawer 抽象                    |
| 壳层     | Admin/Account/Docs 三套重复 nav | SidebarLayout + SideNav                                |
