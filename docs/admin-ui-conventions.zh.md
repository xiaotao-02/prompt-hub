# 官网运营后台 UI 约定

面向 `/admin` 与 `website/components/admin/` 的视觉与交互规范。目标：**Lago 式业务清晰度**（计费/配置后台的信息分层）+ **Notion 式低噪声密度**（少按钮、属性块、操作收进菜单）。

上游模块已按此规范落地，可作为其他 Tab（用户、订单、支付等）迁移的参考实现。

## 外部参考（按需查阅）

| 参考                                                                          | 用途                                               |
| ----------------------------------------------------------------------------- | -------------------------------------------------- |
| [getlago/lago](https://github.com/getlago/lago)                               | 计量/订阅/计费后台：对象详情、用量表、配置表单布局 |
| [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/base/data-table) | Toolbar、行内 `DropdownMenu` 操作、排序/分页模式   |
| [tablecn](https://github.com/sadmann7/tablecn)                                | 服务端分页、批量操作栏、高密度表格（未来扩展）     |

## 设计原则

1. **按钮层级要少**：主操作（`primary` + `sm`）→ 次操作（`ghost` + `sm`）→ 危险（`danger` + `sm`）→ 行内仅图标或 `...` 菜单。
2. **同一容器一种默认尺寸**：页面/弹窗工具栏统一 `size="sm"`；不要在同一行混用 `sm` 与 `xs`，也不要手写 `h-7 px-2` 覆盖 `Button`。
3. **行级操作进菜单**：表格/列表默认用 [`AdminActionMenu`](../website/components/admin/AdminActionMenu.tsx)，避免一行多个文字按钮。
4. **表格用于扫描**：排序、筛选、数字对比；复杂编辑用弹窗/抽屉或行内紧凑字段 + 显式保存。
5. **卡片只放摘要**：详情、调试、批量配置放 Tab 或折叠区；危险操作单独区块 + `variant="danger"`。
6. **表单 = 字段组 + 说明 + 底栏操作**：用 `AdminSectionCard` + `AdminFormActions`，不要孤立输入框堆在中间。

## Button（`website/components/ui/button.tsx`）

`variant` **只**管颜色/边框；`size` **只**管高度与内边距。

| size      | 高度 | 典型场景                                         |
| --------- | ---- | ------------------------------------------------ |
| `default` | h-10 | 营销页、账户页主 CTA                             |
| `sm`      | h-8  | **后台默认**：工具栏、弹窗底栏、表单提交         |
| `xs`      | h-7  | 仅在极紧凑区域且整区统一时使用（优先仍用 `sm`）  |
| `icon`    | 8×8  | 较少使用                                         |
| `iconSm`  | 7×7  | 表格/列表行内「更多」触发器（`AdminActionMenu`） |

| variant   | 用途                                       |
| --------- | ------------------------------------------ |
| `primary` | 区块内唯一主操作（如「添加上游」「保存」） |
| `ghost`   | 刷新、测试、取消、批量次要操作             |
| `danger`  | 删除等不可逆操作（勿用红色 `ghost` 冒充）  |
| `link`    | 纯文字链，不参与后台工具栏                 |

**禁止**：在 `Button` 上叠加 `className="h-7 px-2"` 等尺寸类；需要紧凑时用 `size` 或 `AdminInlineInput`。

## 后台布局组件

| 组件                                      | 路径                                                                                   | 职责                                                                                                                                                                                                                          |
| ----------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AdminToolbar`                            | [`AdminToolbar.tsx`](../website/components/admin/AdminToolbar.tsx)                     | 横向工具条容器                                                                                                                                                                                                                |
| `AdminActionGroup`                        | 同上                                                                                   | 按钮组；`alignEnd` 推到右侧                                                                                                                                                                                                   |
| `AdminSectionCard`                        | [`AdminSectionCard.tsx`](../website/components/admin/AdminSectionCard.tsx)             | 低对比边框区块 + 可选标题/描述；`actions` 插槽放标题行右侧（保存、未保存 Badge 等）                                                                                                                                           |
| `AdminPropertyGrid` / `AdminPropertyItem` | 同上                                                                                   | Notion 式 `dl` 属性行（标签 10px / 值 sm）                                                                                                                                                                                    |
| `AdminTableToolbar`                       | [`AdminTableToolbar.tsx`](../website/components/admin/AdminTableToolbar.tsx)           | 表头：左筛选/统计，右 `actions` 插槽                                                                                                                                                                                          |
| `AdminFormActions`                        | 同上                                                                                   | 表单底部分隔线 + 保存/取消                                                                                                                                                                                                    |
| `AdminInlineInput`                        | [`AdminInlineInput.tsx`](../website/components/admin/AdminInlineInput.tsx)             | 表格行内 h-7 数字输入                                                                                                                                                                                                         |
| `AdminActionMenu`                         | [`AdminActionMenu.tsx`](../website/components/admin/AdminActionMenu.tsx)               | 行内 `...`；`destructive` 项进菜单                                                                                                                                                                                            |
| `AdminSimpleTable`                        | [`AdminSimpleTable.tsx`](../website/components/admin/AdminSimpleTable.tsx)             | 配置型小表（`compact` 行高）                                                                                                                                                                                                  |
| `AdminDataTable`                          | [`AdminDataTable.tsx`](../website/components/admin/AdminDataTable.tsx)                 | 可排序/分页/行点击的数据表                                                                                                                                                                                                    |
| `AdminPillToggle`                         | [`AdminPillToggle.tsx`](../website/components/admin/AdminPillToggle.tsx)               | 周期 / 自动刷新等 pill 切换（替代手写圆角按钮组）                                                                                                                                                                             |
| `AdminSortableHeader`                     | [`AdminSortableHeader.tsx`](../website/components/admin/AdminSortableHeader.tsx)       | 表头排序按钮（与 `AdminDataTable`、聚合模型表共用）                                                                                                                                                                           |
| `AdminAnimatedTabPanels`                  | [`AdminAnimatedTabPanels.tsx`](../website/components/admin/AdminAnimatedTabPanels.tsx) | 多 Tab 详情内容区高度过渡：仅测量激活 `tabpanel`（含 margin + 像素缓冲），`ResizeObserver` 跟踪内容变化；**勿长期** `overflow-hidden`（仅 height 过渡期间裁切），以免可滚动弹窗底部被截断；全屏 flex 场景传 `animate={false}` |

筛选样式 token 统一位于 [`website/lib/styles/filter.ts`](../website/lib/styles/filter.ts)（`ui/select` 的 `filter` 变体从此导入，勿从 `admin/` 反向依赖）。

## 数据表格约定

- **Toolbar**：筛选 `Input` 用 `h-8`；批量操作放 `AdminTableToolbar` 的 `actions`（右对齐）。
- **表头**：`text-xs text-zinc-500`；可排序列用按钮 + 箭头图标；长表可加 `sticky top-0` + `bg-[var(--color-elevated)]`。
- **单元格**：数字列 `tabular-nums`；金额/倍率列可 `text-right`；模型 ID 用 `font-mono` + `truncate` + `title`。
- **操作列**：固定窄宽（如 `w-12`），仅 `AdminActionMenu`；探活/编辑/删除勿并排文字按钮。
- **行内编辑**：`AdminInlineInput` + 脏数据时 `size="xs" variant="ghost"` 的「存」；Enter 提交。

## 详情弹窗

- **容器**：统一 [`AdminDetailDialog`](../website/components/admin/AdminDetailDialog.tsx)（居中 Dialog），不用 `ui/sheet` 抽屉原语。
- **尺寸**：简单详情用 `md` / `lg`；多 Tab、宽表格（上游、用户等）默认 `fluid`（`max-w-[min(96vw,1200px)]`）。
- **全屏**：宽表格场景可设 `fullscreenable`，右上角切换占满视口（保留 0.5rem 边距），关闭弹窗时自动退出全屏。
- **顶栏**：标题 + 状态 Badge；高频操作放 `headerToolbar`。宽弹窗可用 `headerLayout="split"` 将标题/meta 与 `headerToolbar` 合并为同一 header 行（参考 `UpstreamDetailDrawer`）；默认 `stacked` 仍为标题行 + 独立 toolbar 行。Tab 旁 **最多 1 个主按钮** + 开关 + `AdminActionMenu`（测试/同步/编辑/删除等低频进菜单）。
- **Tab 切换**：各 Tab 内容高度差大时，用 `AdminAnimatedTabPanels` 包裹全部 `TabsContent`，避免弹窗高度瞬间跳变；全屏撑满布局时关闭动画（`animate={false}`）。`TabsContent` 在动画场景下设 `mt-0`，顶距由 `TabsList` 的 `mb-*` 承担。
- **概览 Tab**：`AdminSectionCard` + `AdminPropertyGrid`，勿堆一排平级按钮。
- **危险区**：独立 `AdminSectionCard` + 文案说明 + `variant="danger"` 单按钮。

## 参考实现（用户调账）

| 场景                                          | 文件                                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------------- |
| 共享调账表单（增减/设为、快捷金额、原因下拉） | [`AdminBalanceAdjustForm.tsx`](../website/components/admin/AdminBalanceAdjustForm.tsx) |
| 详情抽屉内调账                                | [`AdminUserDetailDrawer.tsx`](../website/components/admin/AdminUserDetailDrawer.tsx)   |
| 列表行内快速改点                              | [`AdminUsers.tsx`](../website/components/admin/AdminUsers.tsx)                         |
| 调账 API 封装与确认文案                       | [`adminBalanceAdjust.ts`](../website/components/admin/adminBalanceAdjust.ts)           |

## 参考实现（上游）

| 场景                         | 文件                                                                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 概览指标 + 统一 sm 工具栏    | [`UpstreamOverviewBar.tsx`](../website/components/admin/adminUpstreams/UpstreamOverviewBar.tsx)                                                                                                                                                        |
| 列表卡片（两行 + 序号重排）  | [`UpstreamCard.tsx`](../website/components/admin/adminUpstreams/UpstreamCard.tsx)（第一行：序号/上下移 + 展示名/Badge + Switch/菜单；第二行：厂商 ID、协议、Key/模型、同步、连通、成功率、耗时、余额、倍率、host；`stopPropagation` 避免重排触发详情） |
| 详情弹窗分层（fluid + 全屏） | [`UpstreamDetailDrawer.tsx`](../website/components/admin/adminUpstreams/UpstreamDetailDrawer.tsx)                                                                                                                                                      |
| 高密度模型表                 | [`AggregatedModelTable.tsx`](../website/components/admin/adminUpstreams/AggregatedModelTable.tsx)                                                                                                                                                      |
| 高级配置表单 + 路由表        | [`ManualModelRoutes.tsx`](../website/components/admin/adminUpstreams/ManualModelRoutes.tsx)                                                                                                                                                            |
| API Key 列表（顺序 + 菜单）  | [`UpstreamKeyList.tsx`](../website/components/admin/adminUpstreams/UpstreamKeyList.tsx)（7 列 Grid：备注为唯一 `1fr` 弹性列，Key 列固定宽；复杂编辑用全宽子行；`sortOrder` 上移/下移；行内 Switch；其余进 `AdminActionMenu`）                          |

## 参考实现（支付 API 管理）

| 场景                       | 文件                                                                                                                                                                                                                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 页面骨架 + 工具栏刷新      | [`PaymentPageSkeleton.tsx`](../website/components/admin/adminPayments/PaymentPageSkeleton.tsx)、[`AdminPayments.tsx`](../website/components/admin/AdminPayments.tsx)（三列 `grid-cols-3` + 底部统计）                                                                                                          |
| 前端展示 / 路由 / 平台三列 | [`PaymentDisplaySection.tsx`](../website/components/admin/adminPayments/PaymentDisplaySection.tsx)、[`PaymentRoutingSection.tsx`](../website/components/admin/adminPayments/PaymentRoutingSection.tsx)、[`PaymentPlatformsSection.tsx`](../website/components/admin/adminPayments/PaymentPlatformsSection.tsx) |
| 前端展示开关 Card 行       | [`PaymentDisplayMethodRow.tsx`](../website/components/admin/adminPayments/PaymentDisplayMethodRow.tsx)（状态点 + Badge + Switch；mock 开启 amber ring）                                                                                                                                                        |
| 支付平台 stacked 行        | [`PaymentPlatformRow.tsx`](../website/components/admin/adminPayments/PaymentPlatformRow.tsx)（`layout="stacked"`：多行详情 + 路由序号；`inline` 保留全宽单行）                                                                                                                                                 |
| 平台详情 / 编辑弹窗        | [`PaymentPlatformDetailDialog.tsx`](../website/components/admin/adminPayments/PaymentPlatformDetailDialog.tsx)、[`PaymentPlatformEditDialog.tsx`](../website/components/admin/adminPayments/PaymentPlatformEditDialog.tsx)                                                                                     |
| 底部全宽通道统计表         | [`PaymentChannelStatsSection.tsx`](../website/components/admin/adminPayments/PaymentChannelStatsSection.tsx)、[`PaymentChannelStatsTable.tsx`](../website/components/admin/adminPayments/PaymentChannelStatsTable.tsx)（`AdminSimpleTable` compact，7 列）                                                     |

## 新页面 / 改页面检查清单

- [ ] 工具栏按钮是否全部为 `sm`（主 `primary`，其余 `ghost`）？
- [ ] 是否去掉 `h-*` / `px-*` 等对 `Button` 的尺寸覆盖？
- [ ] 表格操作列是否只有 `AdminActionMenu`？
- [ ] 数字是否 `tabular-nums`？长文本是否截断 + tooltip？
- [ ] 删除等危险操作是否在菜单或独立危险区块，且用 `variant="danger"`？
- [ ] 表单是否有 `AdminFormActions` 底栏？
- [ ] 改完后在 `website/` 跑 `npm run lint` 与 `npm run build`

## 与其它文档的关系

- 后台功能与 API：[`admin-dashboard.zh.md`](admin-dashboard.zh.md)
- 上游聚合业务：[`upstream-model-aggregation.zh.md`](upstream-model-aggregation.zh.md)
- Agent 导航：[`AGENTS.md`](../AGENTS.md)「官网运营后台」行
- 全仓 UI 分层：[`ui-component-system.zh.md`](ui-component-system.zh.md)
