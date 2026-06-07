# 官网运营后台（Admin Dashboard）

官网 `/admin` 路由 + 平台 API `/v1/admin/*`，供授权管理员查看用户量、用量、订单，审批退款并进行人工调账。

## 访问与鉴权

| 层级                     | 机制                                                                        |
| ------------------------ | --------------------------------------------------------------------------- |
| **后端（唯一可信闸门）** | `adminAuth`：Bearer JWT + 登录邮箱须在 `ADMIN_EMAILS` 白名单，否则 403      |
| **前端门禁**             | `AdminGate` 挂载时探测 `GET /v1/admin/overview`；401/403 不渲染任何运营数据 |
| **SEO**                  | `/admin` 设置 `robots: noindex`；不在 `website/app/sitemap.ts`              |
| **入口**                 | Header「后台」链接仅在白名单管理员登录后显示；也可直达 `/admin`             |

配置示例（API `.env`）：

```env
ADMIN_EMAILS=ops@example.com,admin@example.com
```

管理员与普通用户共用账户登录（Google / 邮箱 / Dev 登录），无需单独账号体系。

## Zeabur 公网登录后台（Google）

生产无密码、无 Dev 登录。步骤见 **[zeabur-admin-google-login.zh.md](zeabur-admin-google-login.zh.md)**：Google Cloud 创建 Web OAuth 客户端（origins = `https://<WEB>.zeabur.app`）→ API 设 `GOOGLE_CLIENT_ID` + `ADMIN_EMAILS` → website 设 `NEXT_PUBLIC_GOOGLE_CLIENT_ID`（同一 Client ID）→ 双服务 Redeploy → `/account` Google 登录 → `/admin`。

## 本地登录后台

> 后台权限只看后端 `ADMIN_EMAILS` 白名单，**与是否登录无关**。白名单为空时谁都是 403；登录邮箱不在白名单也是 403。本地 Dev 登录默认邮箱为 `dev@local.test`。

```bash
# 根目录一键启动：5173 扩展预览 + 4321 官网 + 8787 API
npm run dev:previews
```

`npm run dev:previews` 会自动把 `ADMIN_EMAILS=dev@local.test` 写入 `services/api/.env`（见 [`scripts/start-dev-previews.ps1`](../scripts/start-dev-previews.ps1) 的 API 默认 env），首次启动即可用 Dev 邮箱进后台。步骤：

1. 打开 `http://localhost:4321/account`，邮箱填 `dev@local.test`，点「登录」（Dev 一键登录，无需收信）。
2. 访问 `http://localhost:4321/admin`，或扩展预览页（5173）「插件官网预览」标签点「后台」，或 Header「后台」。
3. 若停在「无管理员权限」页，点「重新验证」即可（JWT 仍有效，无需重新登录）。

### 关键坑：改 `ADMIN_EMAILS` 后必须重启 API

`ADMIN_EMAILS` 只在 API 进程启动时读取一次。手动改 `services/api/.env`（如加别的白名单邮箱）后，**必须重启 8787 进程**才生效；只刷新浏览器无效。

```powershell
# 停掉占用 8787 的进程后，在 services/api 重新 npm run dev；或重跑 dev:previews
Get-NetTCPConnection -LocalPort 8787 -State Listen | Select-Object -Expand OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force }
```

> 注意：若 `services/api/.env` 里的 `ADMIN_EMAILS` 已等于脚本默认值，`dev:previews` 会判定 env 未变而**不重启** API，此时需手动重启。

验证白名单是否已对 Dev 邮箱生效（200 + 总览 JSON 即成功）：

```powershell
$t = (Invoke-RestMethod http://localhost:8787/v1/auth/dev-login -Method Post `
  -ContentType application/json -Body '{"email":"dev@local.test"}').token
Invoke-RestMethod "http://localhost:8787/v1/admin/overview?days=7" -Headers @{ Authorization = "Bearer $t" }
```

非白名单邮箱：页面显示「无管理员权限」，所有 `/v1/admin/*` 返回 403。

## 前端文件地图

| 路径                                                                                                                                              | 职责                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [`website/app/admin/page.tsx`](../website/app/admin/page.tsx)                                                                                     | 页面入口（noindex metadata）                                                                                  |
| [`website/components/admin/AdminPageClient.tsx`](../website/components/admin/AdminPageClient.tsx)                                                 | 主 Client 壳                                                                                                  |
| [`website/components/admin/AdminGate.tsx`](../website/components/admin/AdminGate.tsx)                                                             | 权限门禁                                                                                                      |
| [`website/components/admin/AdminShell.tsx`](../website/components/admin/AdminShell.tsx)                                                           | 后台 2.0 控制台外壳：左侧导航 + 顶栏（⌘K 搜索）+ 主工作区 + 右侧待办栏；`/admin` 不渲染官网营销 header/footer |
| [`website/components/admin/adminShell/`](../website/components/admin/adminShell/)                                                                 | `AdminTopBar`、`AdminSidebar`、`AdminWorkspace`、`AdminContextPanel` 等 2.0 布局组件                          |
| [`website/components/admin/AdminOverview.tsx`](../website/components/admin/AdminOverview.tsx)                                                     | 平台总览                                                                                                      |
| [`website/components/admin/AdminUsers.tsx`](../website/components/admin/AdminUsers.tsx)                                                           | 用户列表 / 详情 / 调账                                                                                        |
| [`website/components/admin/AdminOrders.tsx`](../website/components/admin/AdminOrders.tsx)                                                         | 全站订单                                                                                                      |
| [`website/components/admin/AdminRefunds.tsx`](../website/components/admin/AdminRefunds.tsx)                                                       | 退款审批                                                                                                      |
| [`website/components/admin/AdminRequestLogs.tsx`](../website/components/admin/AdminRequestLogs.tsx)                                               | 请求日志（扣点折合人民币 + 真实成本）                                                                         |
| [`website/components/admin/AdminUpstreams.tsx`](../website/components/admin/AdminUpstreams.tsx)                                                   | 上游接入向导、详情弹窗（概览/Keys/模型/公开路由/设置）、倍率、同步状态、聚合模型、运行统计                    |
| [`website/components/admin/adminUpstreams/UpstreamOnboardingWizard.tsx`](../website/components/admin/adminUpstreams/UpstreamOnboardingWizard.tsx) | 四步接入向导（厂商 → 连通 test-draft → 计费 → 完成）                                                          |
| [`website/components/admin/adminUpstreams/UpstreamDetailDrawer.tsx`](../website/components/admin/adminUpstreams/UpstreamDetailDrawer.tsx)         | 单上游详情 Drawer + Tab                                                                                       |
| [`website/components/admin/AdminPayments.tsx`](../website/components/admin/AdminPayments.tsx)                                                     | 支付双层配置 UI：展示/路由/平台三列并排 + 底部全宽订单统计表；子模块见 `adminPayments/`                       |
| [`website/components/admin/AdminPricing.tsx`](../website/components/admin/AdminPricing.tsx)                                                       | 充值定价卡片 CRUD（金额/点数/启用/排序，含 0.01 测试档）                                                      |
| [`website/components/admin/AdminAuditLogs.tsx`](../website/components/admin/AdminAuditLogs.tsx)                                                   | 管理员审计日志                                                                                                |
| [`website/lib/adminApi/`](../website/lib/adminApi/)（`index.ts` 统一导出）                                                                        | Admin API 封装（401/403 错误类型）；`GET /overview` 响应含 `adminRole` 供前端 Tab/写操作裁剪                  |
| [`website/hooks/useAdmin.ts`](../website/hooks/useAdmin.ts)                                                                                       | `useAdminAccess` / `useIsAdmin`                                                                               |

**UI 布局与组件约定**（按钮尺寸、表格、属性块、参考实现）：[`admin-ui-conventions.zh.md`](admin-ui-conventions.zh.md)。

## Admin API 端点

全部挂载于 [`services/api/src/routes/admin.ts`](../services/api/src/routes/admin.ts)，前缀 `/v1/admin`，需 `adminAuth`。

| 方法   | 路径                                                                 | 说明                                                                                                                                                |
| ------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/overview?days=1\|7\|30`                                            | 平台总览（含 `totalUsers`、活跃、请求、扣点、`estimatedCostCny`、`grossMarginCny`、`pointPriceCny`；保留 `estimatedCostUsd`/`grossMarginUsd` 兼容） |
| GET    | `/users?search=&limit=&offset=`                                      | 用户列表（ID/邮箱/手机模糊搜索 + lifetime 聚合）                                                                                                    |
| GET    | `/users/:id`                                                         | 用户详情（用量 30 天、`orders[]`、`ledger[]`）；前端合并为「点数变动」时间线（已入账充值去重）；`orders[]` 含余额快照字段                           |
| POST   | `/users/:id/adjust-balance`                                          | 人工调账（增减）`{ deltaPoints, reason }` → 写 `balance_ledger`                                                                                     |
| POST   | `/users/:id/set-balance`                                             | 设为指定点数 `{ targetPoints, reason }` → 写 `balance_ledger`（kind=`adjustment`）                                                                  |
| PUT    | `/users/:id/settings`                                                | 风控：`disabled` / `rateLimitPerMin` / `allowedModels`                                                                                              |
| GET    | `/orders?status=&userId=&limit=&offset=`                             | 全站订单分页；`items[]` 含 `balanceBefore` / `pointsDelta` / `balanceAfter`（已入账订单从 `balance_ledger` topup 推算，未入账为 `null`）            |
| GET    | `/refunds?status=&limit=&offset=`                                    | 退款申请列表                                                                                                                                        |
| POST   | `/refunds/:id/approve`                                               | 批准并执行 PSP 退款                                                                                                                                 |
| POST   | `/refunds/:id/reject`                                                | 驳回（可选 `{ note }`）                                                                                                                             |
| GET    | `/logs?userId=&model=&status=&limit=&offset=`                        | 全站请求日志；`items[]` 含 `pointsValueCny`、`pointPriceCny`、`upstreamCostCny`、`marginCny`                                                        |
| GET    | `/logs/:id`                                                          | 单条请求日志详情（同上计费字段 + tokens / errorDetail）                                                                                             |
| GET    | `/upstreams?days=`                                                   | 上游统计 + 熔断状态                                                                                                                                 |
| GET    | `/upstream-config`                                                   | 上游与模型路由配置（含 `defaultMarkup`、`upstreamPriority`；API Key 脱敏）                                                                          |
| PUT    | `/upstream-config/upstream-priority`                                 | 调整厂商使用顺序（body `{ upstreamIds }`；影响同名模型合并路由 failover 优先级）                                                                    |
| GET    | `/upstream-config/default-markup`                                    | 读取全局默认倍率                                                                                                                                    |
| PUT    | `/upstream-config/default-markup`                                    | 更新全局默认倍率                                                                                                                                    |
| GET    | `/upstream-config/aggregated-models`                                 | 按上游分组的聚合模型（成本/倍率/售价预览）                                                                                                          |
| POST   | `/upstream-config/upstreams`                                         | 新建上游（可选 `markup`、`label`；`modelFilter` 已废弃）                                                                                            |
| GET    | `/upstream-config/upstreams/:id/available-models`                    | **已废弃** 浏览上游全部模型                                                                                                                         |
| POST   | `/upstream-config/upstreams/:id/keep-models`                         | **已废弃** 增删 `modelFilter.keep` 并重同步                                                                                                         |
| GET    | `/upstream-config/upstreams/:id/keys`                                | 厂商下 API Key 列表（掩码 + `sortOrder` + 用量）                                                                                                    |
| POST   | `/upstream-config/upstreams/:id/keys`                                | 新增 Key                                                                                                                                            |
| PUT    | `/upstream-config/upstreams/:id/keys/reorder`                        | 调整 Key 使用顺序（body `{ keyIds }`；影响代理轮询优先级）                                                                                          |
| PUT    | `/upstream-config/upstreams/:id/keys/:keyId`                         | 启用/禁用、改备注、更换 Key 明文                                                                                                                    |
| DELETE | `/upstream-config/upstreams/:id/keys/:keyId`                         | 删除 Key                                                                                                                                            |
| POST   | `/upstream-config/upstreams/:id/keys/:keyId/reveal`                  | 获取完整 Key 明文（`upstreams_write` + 审计；供运营复制）                                                                                           |
| POST   | `/upstream-config/upstreams/:id/keys/:keyId/test`                    | 单 Key 连通测试                                                                                                                                     |
| PUT    | `/upstream-config/upstreams/:id`                                     | 更新厂商（响应含 `syncPending`；Key 在子资源管理）                                                                                                  |
| GET    | `/upstream-config/upstreams/:id/sync-status`                         | 同步元数据 + `inflight`（编辑后轮询）                                                                                                               |
| POST   | `/upstream-config/test-draft`                                        | 保存前连通测试（`baseUrl` + `protocol` + `apiKey`，不写 DB）                                                                                        |
| DELETE | `/upstream-config/upstreams/:id`                                     | 删除上游                                                                                                                                            |
| POST   | `/upstream-config/upstreams/:id/test`                                | 拉 `/models` 连通性测试                                                                                                                             |
| POST   | `/upstream-config/upstreams/:id/sync-models`                         | 手动同步该上游全部模型到 `upstream_models`                                                                                                          |
| PUT    | `/upstream-config/aggregated-models/:upstreamId/:model`              | 聚合模型禁用 / `markupOverride` 覆盖                                                                                                                |
| POST   | `/upstream-config/upstreams/:id/batch-enable`                        | 批量启用/禁用聚合模型（`{ enabled }` 或 `{ visionOnly: true }`）                                                                                    |
| POST   | `/upstream-config/models`                                            | 新建手动模型路由（优先于聚合 id）                                                                                                                   |
| PUT    | `/upstream-config/models/:model`                                     | 更新手动模型路由                                                                                                                                    |
| DELETE | `/upstream-config/models/:model`                                     | 删除手动模型路由                                                                                                                                    |
| GET    | `/payment-config`                                                    | 支付双层配置：前端展示方式 + 支付平台 + 路由优先级                                                                                                  |
| PUT    | `/payment-display/:method`                                           | 更新展示开关（`mock`/`wechat`/`alipay`）                                                                                                            |
| PUT    | `/payment-platforms/:platform`                                       | 更新平台凭据与启用（`wechat_native`/`alipay_native`/`zpay`/`yungouos`）                                                                             |
| PUT    | `/payment-routing`                                                   | 更新微信/支付宝路由优先级数组                                                                                                                       |
| POST   | `/payment-platforms/:platform/test`                                  | 平台连通性 / 凭据校验                                                                                                                               |
| GET    | `/payment-channels`                                                  | **已废弃** 扁平通道列表（兼容旧客户端）                                                                                                             |
| PUT    | `/payment-channels/:channel`                                         | **已废弃** 映射到 display 或 platform                                                                                                               |
| GET    | `/payment-stats?days=`                                               | 各支付方式订单量、成功率、退款率（按 `orders.channel`）                                                                                             |
| GET    | `/pricing-packs`                                                     | 全部充值套餐（含已禁用）                                                                                                                            |
| POST   | `/pricing-packs`                                                     | 新建套餐（`id`、`label`、`amountCents`、`points` 等）                                                                                               |
| PUT    | `/pricing-packs/:id`                                                 | 更新套餐（金额、点数、启用、排序、角标、featured）                                                                                                  |
| DELETE | `/pricing-packs/:id`                                                 | 删除套餐                                                                                                                                            |
| GET    | `/audit-logs?action=&adminUserId=&from=&to=`                         | 管理员操作审计日志                                                                                                                                  |
| GET    | `/export/users` `/export/orders` `/export/logs` `/export/audit-logs` | CSV 导出（最多 5000 行）                                                                                                                            |

配置持久化于 SQLite（`upstreams`、`upstream_models`、`model_routes`、`payment_channels`、`payment_settings`、`pricing_packs` 表），密钥经 `CONFIG_ENCRYPTION_KEY` AES-256-GCM 加密；写入后调用 `reloadUpstreamRegistry()` / `reloadPaymentSettings()` 热加载。DB 为空时首次启动会从 `upstreams.json` / env 一次性 seed 入库；`pricing_packs` 首次迁移会 seed 18/39/79 与 `test001`（¥0.01 / 3 点）。`payment_channels` 存平台凭据（`wechat_native`/`alipay_native`/`zpay`/`yungouos`/`mock`）；`payment_settings.config` JSON 存前端展示开关与路由顺序。

官网公开读取：`GET /v1/pricing-packs`（套餐）、`GET /v1/payment-methods`（支付方式展示开关），实现于 [`services/api/src/routes/payment.ts`](../services/api/src/routes/payment.ts)；前端 [`website/hooks/usePricingPacks.ts`](../website/hooks/usePricingPacks.ts)、[`website/hooks/usePaymentMethods.ts`](../website/hooks/usePaymentMethods.ts)。

**支付安全（运营必读）**：后台关闭「模拟支付」展示并不能单独保证生产安全；须同时设置 `MOCK_PAY_ENABLED=false` 并确保 webhook 公网可达。关闭微信/支付宝展示也不等于关闭对应平台凭据——路由与平台启用状态见 `payment_settings` / `payment_channels`。上线勾选见 [go-live-risk-checklist.zh.md](go-live-risk-checklist.zh.md)。

**多上游模型聚合**（自动同步 `/models`、成本×倍率、`上游名/模型名` 路由）详见 [`upstream-model-aggregation.zh.md`](upstream-model-aggregation.zh.md)。

DB 查询与配置 CRUD 实现在 [`services/api/src/db.ts`](../services/api/src/db.ts)；上游运行时 [`services/api/src/upstream/registry.ts`](../services/api/src/upstream/registry.ts)、聚合同步 [`syncModels.ts`](../services/api/src/upstream/syncModels.ts)、路由 [`routes.ts`](../services/api/src/upstream/routes.ts)；支付运行时 [`services/api/src/payment/settings.ts`](../services/api/src/payment/settings.ts)。

测试：[`services/api/src/admin.routes.test.ts`](../services/api/src/admin.routes.test.ts)。

## 功能模块

| 模块     | 能力                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 平台总览 | 注册用户、活跃用户、请求量、成功率、扣点、按日趋势；**预估成本/毛利统一人民币**（`estimatedCostCny` / `grossMarginCny`）                                                                                                                                                                                                                                                                                               |
| 用户管理 | 搜索、详情、30 天模型用量、点数变动时间线（订单未入账 + 余额流水，已支付去重）；人工调账（增减/设为）、列表行内快速改点、常用原因预设与快捷金额按钮                                                                                                                                                                                                                                                                    |
| 充值订单 | 全站订单 + 状态 / 用户筛选                                                                                                                                                                                                                                                                                                                                                                                             |
| 退款审批 | 待审列表、批准（原路退款 + 扣点）、驳回                                                                                                                                                                                                                                                                                                                                                                                |
| 请求日志 | 按 userId / model / status 排查；列表展示 **扣点折合人民币** 与 **上游真实成本（CNY）** 对比                                                                                                                                                                                                                                                                                                                           |
| 上游接入 | **接入向导**（test-draft 预检）；详情弹窗五 Tab（`headerLayout="split"` 顶栏）；厂商列表两行卡片（序号 + 上下移调整 priority；展示协议/ID/同步/连通/成功率/耗时等）；Key 池；openai 全量同步 + 目录内开关；非 openai 公开路由；聚合目录批量开关；统计与熔断                                                                                                                                                            |
| 支付管理 | **前端支付方式**（模拟/微信/支付宝展示开关）+ **路由策略**（每方式的平台优先级）+ **支付平台**（官方/ZPAY/YunGouOS 凭据、启用、测试）三列并排；底部 **各通道订单统计** 全宽表（7 列含支付成功/退款数）。**安全提示**：展示开关只控制用户是否看到按钮，**不是**安全边界；生产入账以 `MOCK_PAY_ENABLED`、webhook 验签与 `fulfillOrder` 为准（见 [go-live-risk-checklist.zh.md](go-live-risk-checklist.zh.md) §坑点 1–2） |
| 定价管理 | 官网充值卡片：金额（分）、到账点数、角标、推荐样式、启用与排序；支持新增/删除（含 0.01 元测试档）                                                                                                                                                                                                                                                                                                                      |
| 审计日志 | 调账、退款、上游/支付/定价配置变更记录；支持筛选与 CSV 导出                                                                                                                                                                                                                                                                                                                                                            |

## 角色分级（可选）

通过 `ADMIN_ROLES` 为白名单邮箱分配角色（默认 `super`）：

```env
ADMIN_ROLES=ops@example.com:ops,finance@example.com:finance,viewer@example.com:readonly
```

| 角色       | 能力摘要                                |
| ---------- | --------------------------------------- |
| `super`    | 全权限                                  |
| `ops`      | 运营：用户/订单/日志/上游，无支付凭据写 |
| `finance`  | 财务：订单/退款/支付/调账               |
| `readonly` | 只读 + 导出                             |

## 环境变量

生产环境除 `ADMIN_EMAILS` 外，须配置 **`CONFIG_ENCRYPTION_KEY`**（独立随机串，用于加密 DB 中的上游 Key 与支付凭据）。轮换该密钥会使已有密文无法解密，需重新在后台录入凭据。

```env
ADMIN_EMAILS=ops@example.com
ADMIN_ROLES=ops@example.com:super
CONFIG_ENCRYPTION_KEY=<强随机串，勿与 JWT_SECRET 相同>
USD_TO_CNY_RATE=7.2
```

**人民币口径（运营必读）**

- 上游真实成本：代理成功/结算失败时按命中模型的 `cost_*_per_1k` + usage 计算 USD，再乘 `USD_TO_CNY_RATE` 写入 `request_logs.upstream_cost_cny`。
- 点数售价：`pointPriceCny` = 启用充值套餐加权均价（元/点），**排除** `amount_cents <= 1` 的 ¥0.01 测试档；`pointsValueCny = points × pointPriceCny`。
- 平台总览毛利：`grossMarginCny = revenueCents/100 - estimatedCostCny`；无历史成本字段的旧日志会 fallback 到点数反推估算。

## 改功能时首读

- 改后台页面 UI / 表格 / 按钮排布：先读 [`admin-ui-conventions.zh.md`](admin-ui-conventions.zh.md)，上游模块可作样板
- 新增 admin 端点：先改 `db.ts` 查询 / 迁移 → `routes/admin/` → `website/lib/adminApi/` → 对应 `Admin*.tsx` 组件
- 前端角色：`ADMIN_ROLES` 映射经 `overview.adminRole` 下发；`website/lib/adminPermissions.ts` 与后端 `requirePermission` 矩阵对齐，隐藏无权限 Tab 与写操作
- 改上游运行时：[`upstream/registry.ts`](../services/api/src/upstream/registry.ts) + [`upstream/syncModels.ts`](../services/api/src/upstream/syncModels.ts) + [`upstream/routes.ts`](../services/api/src/upstream/routes.ts) + `reloadUpstreamRegistry()`
- 改多上游聚合行为：先读 [`upstream-model-aggregation.zh.md`](upstream-model-aggregation.zh.md)
- 改支付运行时：[`payment/settings.ts`](../services/api/src/payment/settings.ts) + `reloadPaymentSettings()`
- 改鉴权白名单：[`services/api/src/http/auth.middleware.ts`](../services/api/src/http/auth.middleware.ts) + `ADMIN_EMAILS` env
- 改前端门禁/入口：[`AdminGate.tsx`](../website/components/admin/AdminGate.tsx)、[`AdminShell.tsx`](../website/components/admin/AdminShell.tsx)、[`SiteHeader.tsx`](../website/components/SiteHeader.tsx)
