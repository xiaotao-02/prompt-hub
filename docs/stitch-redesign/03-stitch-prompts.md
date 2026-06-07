# Stitch 分批 Prompt 脚本

> 粘贴前已在 Stitch 项目导入对应 **DESIGN.md**（Extension → 根目录；Website+Admin → `website/DESIGN.md`）。  
> 每批 **2–4 屏**；生成后用「状态补充」与「多选一致性」两段。连线见 [02-interaction-map.md](./02-interaction-map.md)。

---

## 通用 Style 段（可复制进每批 Platform 上方）

```text
Style:
- Primary #5B5BD6, hover #4F4FC4, soft #EEF0FB; on-primary #FFFFFF
- Background #FFFFFF, muted #F4F4F5, border #E4E4E7
- Text #18181B, muted #52525B, faint #A1A1AA
- Font Inter (UI), Geist Mono (IDs only)
- Radius buttons/inputs 8px; cards 8–12px; chips 6px
- Elevation: 1px border + shadow 0 1px 2px rgba(15,23,42,0.05); dialogs light shadow
- One primary filled CTA per screen; no purple gradients or neon glow
- WCAG AA contrast; respect prefers-reduced-motion
```

---

## 多选一致性 Prompt（每批生成后执行）

Shift 选中本批全部画板，粘贴：

```text
Apply a consistent visual theme across all selected screens:
- Background #FFFFFF; cards white with 1px #E4E4E7 border
- Primary actions #5B5BD6 with white label
- Secondary: white + border; ghost for toolbar icons
- Text hierarchy: titles #18181B semibold, body regular, captions #52525B
- Spacing 4px grid; compact for extension surfaces, roomier for marketing
- Lucide-style line icons 16–20px; no legacy violet #8b5cf6 brand
- Match screen IDs in frame titles: [EXT-*] or [WEB-*] or [ADM-*]
```

---

## 状态补充 Prompt 模板

对**单个**已生成主屏选中后粘贴（替换 `{SCREEN_NAME}`）：

```text
Design variant states for screen [{SCREEN_NAME}] in the same design system:
1) Empty state — helpful copy, single secondary action, no fake data
2) Loading state — skeleton or progress, disable primary CTA
3) Error state — border/error color #E5484D, retry + secondary escape
Keep layout identical; only change content and status indicators.
Use real product copy in Chinese where the app is zh-CN (e.g. 生成提示词, 提取失败).
```

Dialog 专用：

```text
Design a modal overlay on [{SCREEN_NAME}]: semi-transparent scrim rgba(0,0,0,0.4), centered card radius 12px, title + body + Cancel (secondary) + Confirm (primary destructive if delete). Frame title suffix: -DIALOG-OPEN.
```

---

# 项目 A：Extension（DESIGN.md 根目录）

## A1 — Popup 首配 + 空引导（2 屏）

**屏幕 ID**：`EXT-POPUP-SERVICE-CARD`、`EXT-POPUP-EMPTY-GUIDE`

```text
Context:
Prompt Hub Chrome extension popup, 360px wide toolbar popup. Product: right-click images → collect references → generate AI art prompts with BYOK vision API. First-time user has no history and must configure built-in platform or custom API.

Components:
Screen 1 [EXT-POPUP-SERVICE-CARD]:
- Header: logo + "Prompt Hub" + icon row (region snip, website, library)
- Amber alert strip "完成服务配置以开始反推"
- Segmented control: 内置服务 | 自定义 API
- Built-in pane: email login OR logged-in quota badge + recharge link + model selector
- Custom pane: provider select, API key, base URL, model, Save button
- Footer link "更多设置"
- Compact empty hint below: "暂无历史" two lines

Screen 2 [EXT-POPUP-EMPTY-GUIDE]:
- Same header with configured service menu button (indigo summary)
- EmptyGuide: 2 steps with icons — 右键提取图片提示词; 区域截取 Ctrl+Shift+E
- No history list

Style:
[Paste 通用 Style 段]

Platform:
Chrome extension popup 360×520px min height, light mode default, compact 13px body, 8px padding grid. Touch targets 32px for icon buttons.
```

## A2 — Popup 历史列表 + 版本内联（2 屏）

**屏幕 ID**：`EXT-POPUP-HISTORY-LIST`、`EXT-POPUP-VERSIONS-INLINE`

```text
Context:
Returning user popup with 3+ history cards. Each card shows thumbnail, provider/model, relative time, 3-line prompt preview.

Components:
Screen 1 [EXT-POPUP-HISTORY-LIST]:
- Scrollable list of history cards (~44px row height)
- Per card toolbar: Copy, Edit, Optimize, Recall panel, Delete (icon ghost)
- One card expanded affordance: v3 badge + chevron down
- Service menu in header with quota badge

Screen 2 [EXT-POPUP-VERSIONS-INLINE] (expanded under one card):
- Version timeline: time labels, compact/comfortable density toggle
- Per version: copy, restore (non-current), delete
- "展开其余 4 条" collapse control if >6 versions

Style:
[通用 Style 段]

Platform:
360px popup, list-first density, mono-sm only for model IDs.
```

## A3 — Options 设置：服务 + 输出（2 屏）

**屏幕 ID**：`EXT-OPTS-SETTINGS-PROVIDER`、`EXT-OPTS-SETTINGS-OUTPUT`

```text
Context:
Full-page Chrome extension options, tab 设置, max content ~920px. Autosave indicator top-right: idle/saving/saved.

Components:
Screen 1 [EXT-OPTS-SETTINGS-PROVIDER]:
- Left nav vertical: 内置服务/自定义 API (active), 输出, 交互, 数据与备份, 扩展更新
- Segmented 内置服务 | 自定义 API with "使用中" chip
- Platform login form OR account card with balance
- Provider fields: API key password, base URL, Fetch models button, model dropdown

Screen 2 [EXT-OPTS-SETTINGS-OUTPUT]:
- Same left nav, 输出 active
- 4 ChoiceCards grid for output style: 自然语言（中文）, Natural (English), 自然言語（日本語）, JSON（英文）
- Strategy select default label "v0.3.6 通用高还原 — 默认档：通用高还原，图/多图/视频"
- Temperature slider, max tokens number, system prompt textarea
- Preset save/apply/rename/delete row

Style:
[通用 Style 段]

Platform:
Desktop options page 1280×800, sticky header with logo 128px, segmented tab 设置|提示词库.
```

## A4 — Options 设置：交互 + 数据备份（2 屏）

**屏幕 ID**：`EXT-OPTS-SETTINGS-INTERACTION`、`EXT-OPTS-SETTINGS-DATA`

```text
Context:
Options settings continuation. Data panel supports File System Access backup sync.

Components:
Screen 1 [EXT-OPTS-SETTINGS-INTERACTION]:
- Nav 交互 active
- ChoiceCards: Popup toolbar → 打开提示词库 vs 召回面板
- Dropdown one-click refine randomness
- Checkboxes: save history, panel autofocus
- HelpDisclosure accordion

Screen 2 [EXT-OPTS-SETTINGS-DATA]:
- Nav 数据与备份 active
- Status card: connected directory path OR amber 未配置
- Buttons: 立即同步, 从目录恢复, 更换目录, 解除绑定
- HelpDisclosure: 导出全量备份, 从 JSON 恢复
- Optional second frame: ConfirmDialog "从 JSON 恢复 — 合并还是完全替换?"

Style:
[通用 Style 段]

Platform:
1280×800 options, form vertical spacing 12px.
```

## A5 — 提示词库：布局 + 空态（3 屏）

**屏幕 ID**：`EXT-LIB-SHELL`、`EXT-LIB-EMPTY`、`EXT-LIB-NO-MATCH`

```text
Context:
Options tab 提示词库, wide layout max 1536px. Folder tree + filter toolbar + list view.

Components:
Screen 1 [EXT-LIB-SHELL] (with data):
- Left folder tree: 全部, 未分类, 置顶, project folders with counts
- Toolbar: search, list/grid toggle, filter chips provider/style/sort, 复制 导出 清空
- 5 history rows with checkbox, pin stripe, thumbnail, prompt preview
- Bottom bulk bar hidden

Screen 2 [EXT-LIB-EMPTY]:
- EmptyState with EmptyGuide 3 steps: 右键收集 → 生成 → 入库

Screen 3 [EXT-LIB-NO-MATCH]:
- Same shell but center "无匹配结果" + button 清除筛选

Style:
[通用 Style 段]

Platform:
1536×900 desktop, sidebar 240px, table/list hybrid.
```

## A6 — 提示词库：多选 + 浮层（2 屏）

**屏幕 ID**：`EXT-LIB-BULK-BAR`、`EXT-LIB-FLOATING-PANEL`

```text
Context:
Library multi-select and in-page floating editor reusing panel success body.

Components:
Screen 1 [EXT-LIB-BULK-BAR]:
- 3 rows with checkboxes selected
- Fixed bottom bar: "已选 3", 全选, 复制, 导出, 移动到, 删除, 取消选择

Screen 2 [EXT-LIB-FLOATING-PANEL]:
- Dimmed page behind
- Floating card title "提示词库编辑"
- Panel success layout: reference strip, prompt editor, MetaRow, RefineBlock, ActionsBar (生成提示词 already done state)
- Close X, 跳转原图 link

Style:
[通用 Style 段]

Platform:
1536×900, floating panel ~480px wide centered right.
```

## A7 — Content 面板：收集（2 屏）

**屏幕 ID**：`EXT-PANEL-COMPOSE-IMAGE`、`EXT-PANEL-COMPOSE-VIDEO`

```text
Context:
Shadow DOM floating panel on arbitrary webpage, bottom-right. Main workflow: collect refs → 生成提示词.

Components:
Screen 1 [EXT-PANEL-COMPOSE-IMAGE]:
- Header dot + "收集参考图" + close
- Header tabs: 收集图片 (active) | 采集视频帧
- Reference strip 3 thumbnails removable + counter 3/8
- URL input + 添加 + 本地图片
- Strategy dropdown showing "v0.3.6 通用高还原"
- Output style dropdown "自然语言（中文）"
- Secondary buttons 提取材质, 提取风格
- Primary CTA 生成提示词 (enabled)

Screen 2 [EXT-PANEL-COMPOSE-VIDEO]:
- Tab 采集视频帧 active
- Video preview, play/pause, scrubber, segment handles on filmstrip
- Start/end seconds inputs, frame estimate
- Button 采样到参考
- Compact reference strip below

Style:
[通用 Style 段]

Platform:
Floating card ~400×560px, 13px prompt area sans, resize handles on edges subtle.
```

## A8 — Content 面板：反推流（3 屏）

**屏幕 ID**：`EXT-PANEL-LOADING`、`EXT-PANEL-SUCCESS`、`EXT-PANEL-ERROR`

```text
Context:
Core extract flow after user clicks 生成提示词.

Components:
Screen 1 [EXT-PANEL-LOADING]:
- Title "正在反推图片提示词…"
- Model dropdown in header, strategy badge
- Non-removable reference strip
- Progress bar 65%, hint "streaming tokens…", elapsed time
- Readonly textarea with partial English prompt streaming
- RefineBlock disabled note "生成后可调整"
- Versions sidebar collapsed or thin

Screen 2 [EXT-PANEL-SUCCESS]:
- Title "提示词已生成"
- Editable textarea full prompt, char count
- MetaRow: 历史版本 · 5 toggle, strategy/output dropdowns, dirty hint optional
- RefineBlock: instruction field, preset chips 提取材质 提取风格
- ActionsBar: 随机风格 dropdown + 保存为新版本 + 让 AI 调整 + 复制

Screen 3 [EXT-PANEL-ERROR]:
- Title "提取失败"
- Red error message area sample "API key invalid"
- Reference strip, buttons 打开设置, 重试

Style:
[通用 Style 段]

Platform:
400×560 floating panel; success may widen when versions-open variant in next batch.
```

## A9 — Content 面板：版本侧栏 + 区域框选（2 屏）

**屏幕 ID**：`EXT-PANEL-VERSIONS-SIDEBAR`、`EXT-REGION-CAPTURE`

```text
Context:
Version history sidebar and full-page region capture overlay.

Components:
Screen 1 [EXT-PANEL-VERSIONS-SIDEBAR]:
- Success panel split: main editor left ~60%, sidebar right
- Sidebar head "历史版本" count, density icons, collapse
- Version rows with current highlighted primary-soft bg
- One row label "生成中" spinner for parallel extract

Screen 2 [EXT-REGION-CAPTURE]:
- Full viewport dim overlay, crosshair cursor
- Top hint bar "拖拽框选区域 · Esc 取消"
- Dashed selection rectangle mid-screen
- No extension panel chrome (overlay only)

Style:
[通用 Style 段]

Platform:
Sidebar variant 560px total width; region overlay 1440×900 desktop page mock behind.
```

---

# 项目 B：Website + Admin（website/DESIGN.md）

## B1 — 首页 Hero + Workflow（2 屏）

**屏幕 ID**：`WEB-HOME`（Hero）、`WEB-HOME`（Workflow step 3 active）

```text
Context:
Marketing site Prompt Hub. H1 from product: "一键把参考图 / 变成提示词". Sub: 右键收集、多图合成、策略档位、对话改写。粘贴到 SD、Midjourney、Flux 即可开画.

Components:
Screen 1 [WEB-HOME-HERO]:
- Glass nav: logo, Features, Docs, API, Account, Install extension primary
- Hero two-column: headline, subcopy, CTA 从 Chrome 商店安装 + 快速开始 →
- Right: plugin mock illustration lazy placeholder card

Screen 2 [WEB-HOME-WORKFLOW]:
- Section label "Workflow"
- Title "产品流程 — 从右键收集到复制入库，完整走通一次反推工作流。"
- 5-step horizontal stepper, step 3 active (反推)
- Mock panel below stepper showing prompt output

Style:
[通用 Style 段] — marketing: display 56px hero, section spacing 48px, max-width 1200px centered

Platform:
Desktop 1440×900 light marketing page.
```

## B2 — 首页 Feature + CTA（2 屏）

**屏幕 ID**：`WEB-HOME`（features section）、`WEB-HOME`（footer CTA）

```text
Context:
Homepage lower sections. Six features from site: 右键即用, 多图合成, 多档策略, 对话改写, 自备或内置, 本地隐私.

Components:
Screen 1 [WEB-HOME-FEATURES]:
- Section "Features"
- 2×3 card grid with line icons, title, description each
- Link 查看完整功能说明 →

Screen 2 [WEB-HOME-CTA]:
- Band "准备好开始了吗？"
- Primary install + secondary link to /pricing

Style:
[通用 Style 段]

Platform:
1440×900, card padding 24px, hover border-strong.
```

## B3 — Features 页 + Pricing（2 屏）

**屏幕 ID**：`WEB-FEATURES`、`WEB-PRICING`

```text
Context:
/features five anchored sections; /pricing official API recharge.

Components:
Screen 1 [WEB-FEATURES]:
- Page hero 功能详解
- One FeatureSection zigzag: left copy #context 右键即用, right FeatureMock context variant

Screen 2 [WEB-PRICING]:
- Hero 官方 API 充值
- 3 pricing plan cards, one featured 推荐
- Anchor #recharge section visible

Style:
[通用 Style 段]

Platform:
1440×900 marketing.
```

## B4 — 充值 Modal 全流程（4 屏）

**屏幕 ID**：`WEB-RECHARGE-MODAL-IDLE`、`MOCK`、`QR`、`UNAUTH`

```text
Context:
User clicks plan card on pricing. Recharge modal steps.

Components:
Screen 1 [WEB-RECHARGE-MODAL-IDLE]:
- Modal: plan name, price ¥, points, payment method radios 微信/支付宝/mock
- Primary 创建订单

Screen 2 [WEB-RECHARGE-MODAL-MOCK]:
- Amber sandbox banner
- Button 模拟支付成功

Screen 3 [WEB-RECHARGE-MODAL-QR]:
- QR code canvas, polling hint 等待支付…

Screen 4 [WEB-RECHARGE-MODAL-UNAUTH]:
- Error text 请先登录, link to /account

Style:
[通用 Style 段]

Platform:
Modal max-width 480px centered on pricing page backdrop.
```

## B5 — 账户登录 + 概览（2 屏）

**屏幕 ID**：`WEB-ACCOUNT-LOGIN`、`WEB-ACCOUNT-OVERVIEW`

```text
Context:
/account authentication and dashboard.

Components:
Screen 1 [WEB-ACCOUNT-LOGIN]:
- Centered card, logo, email input, 发送登录链接 button
- Google sign-in button
- Collapsible ExtensionSetupDetails 4 steps

Screen 2 [WEB-ACCOUNT-OVERVIEW]:
- Account shell sidebar: 概览 active, 用量分析, 接入扩展, 充值记录
- Balance CountUp, 充值 CTA, low balance warning banner optional
- Session header with logout

Style:
[通用 Style 段]

Platform:
1280×800 account layout, sidebar 200px.
```

## B6 — 账户用量 + 订单（2 屏）

**屏幕 ID**：`WEB-ACCOUNT-USAGE`、`WEB-ACCOUNT-ORDERS`

```text
Context:
Logged-in account analytics and order history.

Components:
Screen 1 [WEB-ACCOUNT-USAGE]:
- Period toggle 1/7/30 天
- Tabs: 消耗分布, 调用趋势, 调用分布, 排行
- Area chart placeholder, loading skeleton variant note in subtitle

Screen 2 [WEB-ACCOUNT-ORDERS]:
- Table 5 recent orders: id, amount, points, status badge paid/pending
- Button 查看全部 → opens full list modal hint
- Row action 申请退款 for eligible order

Style:
[通用 Style 段]

Platform:
1280×800, charts flat minimal not heavy 3D.
```

## B7 — Docs + Download（2 屏）

**屏幕 ID**：`WEB-DOCS-HUB`、`WEB-DOWNLOAD`

```text
Context:
Documentation hub and extension download page.

Components:
Screen 1 [WEB-DOCS-HUB]:
- Docs layout: left SideNav with 推荐路径 steps, center guide grid cards with tags
- Links install, account, pricing

Screen 2 [WEB-DOWNLOAD]:
- DownloadHero + Chrome store button
- Card 安装后下一步 numbered list
- Card 无法访问商店 GitHub fallback

Style:
[通用 Style 段]

Platform:
1440×900, docs sidebar 240px on lg+.
```

## B8 — 移动营销头（1 屏 + 状态补充）

**屏幕 ID**：`WEB-HEADER-MOBILE-DRAWER`

```text
Context:
Mobile breakpoint marketing header.

Components:
Screen 1 [WEB-HEADER-MOBILE-DRAWER]:
- Top bar logo + hamburger
- Open drawer: full height panel from right, NAV links, login, install CTA
- Backdrop scrim

Style:
[通用 Style 段]

Platform:
393×852 iPhone light mode.
```

> 生成后对该屏运行状态补充模板（仅 loading 不适用）。

## B9 — Admin Gate + Shell（2 屏）

**屏幕 ID**：`ADM-GATE-UNAUTH`、`ADM-SHELL`（overview tab）

```text
Context:
Operations admin /admin, dark-friendly but design tokens light surfaces on white cards. Lago-style low noise.

Components:
Screen 1 [ADM-GATE-UNAUTH]:
- Centered card Shield icon, 需要管理员权限, button 前往登录 → /account

Screen 2 [ADM-SHELL]:
- Left sidebar 200px: 平台总览 active, 用户管理, 充值订单, 退款审批 badge, 请求日志, 上游接入, 支付管理, 定价管理, 审计日志
- Top bar title 平台总览, search ⌘K, UserMenu
- Stat tiles row, chart area, filter period 7d

Style:
[通用 Style 段] — admin denser: body-sm 14px tables, table-row component

Platform:
1440×900 admin, hide marketing header/footer.
```

## B10 — Admin 用户 + 订单（2 屏）

**屏幕 ID**：`ADM-USERS`、`ADM-ORDERS`

```text
Context:
Admin data tables with filter bars.

Components:
Screen 1 [ADM-USERS]:
- AdminFilterBar: search ID/email, date range, 筛选, 重置, 导出 CSV
- Table columns: ID, 账号, 余额, 累计消耗, 请求数, 注册时间
- One row selected violet tint
- Overlay AdminUserDetailDrawer: 用户概览, 禁用账户 switch, 调账 form

Screen 2 [ADM-ORDERS]:
- Filter status select pending/paid/...
- Table: order id truncate, user link, amount, points, channel, status badge, time
- Click row opens order detail drawer hint

Style:
[通用 Style 段]

Platform:
1440×900, table row height 48px, sticky header.
```

## B11 — Admin 退款 + 上游（2 屏）

**屏幕 ID**：`ADM-REFUNDS`、`ADM-UPSTREAMS`

```text
Context:
Refund approval queue and upstream API registry.

Components:
Screen 1 [ADM-REFUNDS]:
- Stat tile 待审退款 when filter pending
- Table with 批准/驳回 action menu on pending row
- Confirm dialog destructive on approve (second frame -DIALOG-OPEN)

Screen 2 [ADM-UPSTREAMS]:
- Overview bar: default markup, 新增上游, 批量测试
- Upstream card: name, health dot, balance, enable toggle, 编辑 删除
- Empty state CTA if no cards — separate small frame

Style:
[通用 Style 段]

Platform:
1440×900 admin.
```

## B12 — Admin 支付 + 定价（2 屏）

**屏幕 ID**：`ADM-PAYMENTS`、`ADM-PRICING`

```text
Context:
Payment channel config and recharge plan CRUD.

Components:
Screen 1 [ADM-PAYMENTS]:
- Stat band 3 channels
- WeChat/Alipay display toggles
- Platform cards grid wechat_native alipay_native with 编辑
- Routing section fallback chains + save

Screen 2 [ADM-PRICING]:
- Table: sort, name, amount, points, status badge 启用/推荐
- Button 新增套餐
- Edit dialog form: id, name, amount, points, featured switch

Style:
[通用 Style 段]

Platform:
1440×900.
```

---

## Prototypes 连线顺序（生成完成后）

1. Extension 项目：按 A7→A8→A9 连主路径 → A1–A2 Popup → A5–A6 库 → A3–A4 设置 → A9 region。
2. Website 项目：B1→B2→B3→B4→B5→B6→B7；B9→B10→B11→B12。
3. 对照 [02-interaction-map.md](./02-interaction-map.md) §九 checklist Play 测试。
4. 缺 hotspot 的屏回到对应批次补「状态补充」或单独一屏 prompt。

---

## 批次总览表

| 批次   | 项目          | 屏数 | 屏幕 ID                       |
| ------ | ------------- | ---- | ----------------------------- |
| A1     | Extension     | 2    | POPUP service, empty          |
| A2     | Extension     | 2    | POPUP history, versions       |
| A3     | Extension     | 2    | OPTS provider, output         |
| A4     | Extension     | 2    | OPTS interaction, data        |
| A5     | Extension     | 3    | LIB shell, empty, no-match    |
| A6     | Extension     | 2    | LIB bulk, floating            |
| A7     | Extension     | 2    | PANEL compose image/video     |
| A8     | Extension     | 3    | PANEL loading, success, error |
| A9     | Extension     | 2    | PANEL versions, region        |
| B1–B12 | Website+Admin | 22   | 见各节标题                    |

合计主屏约 **41 批帧**；加状态变体后约 **90+** 画板，与 inventory 一致。
