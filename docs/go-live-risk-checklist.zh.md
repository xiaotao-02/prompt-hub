# 上线风险检查清单

> 面向维护者：将「后端安全、支付风控、版权合规、流量运营」四类常见坑点映射到 Prompt Hub 本仓库。**公开版**不含真实密钥、商户号、对账样本或告警具体阈值；数值与法务材料请记在私有笔记。

**用法**：上线前逐项勾选，填写负责人与日期；详细步骤链到下方「延伸阅读」。

| 字段   | 说明                 |
| ------ | -------------------- |
| ☐      | 未完成               |
| ☑      | 已完成               |
| 负责人 | 维护者姓名或角色     |
| 日期   | 完成日（YYYY-MM-DD） |

---

## 延伸阅读（按主题）

| 主题              | 文档                                                             |
| ----------------- | ---------------------------------------------------------------- |
| 运维与支付三层    | [`PLATFORM_OPERATIONS.zh.md`](PLATFORM_OPERATIONS.zh.md)         |
| Zeabur 生产 env   | [`deploy-zeabur-runbook.zh.md`](deploy-zeabur-runbook.zh.md)     |
| 变量对照          | [`deploy-platform.zh.md`](deploy-platform.zh.md)                 |
| 敏感信息 / 勿提交 | [`OPEN_SOURCE_SECURITY.zh.md`](OPEN_SOURCE_SECURITY.zh.md)       |
| 上线顺序与 smoke  | [`launch-readiness-memory.zh.md`](launch-readiness-memory.zh.md) |
| 运营后台          | [`admin-dashboard.zh.md`](admin-dashboard.zh.md)                 |

**说明**：本仓库**未集成 Stripe**；支付风控对应微信/支付宝官方、ZPAY、YunGouOS 及平台侧限流/试用策略。

---

## 坑点 1：后端安全（非所见即所得）

前端充值 UI 简单，**点数与订单资产在 API + SQLite**；公网扫描主要针对 webhook、鉴权与误配置。

### P0 — 上线前必过

| ☐   | 检查项                                                                                                                                                                                                                                               | 负责人 | 日期 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---- |
| ☐   | **生产 env 强校验**：`JWT_SECRET`、`CONFIG_ENCRYPTION_KEY` 为强随机（`npm run gen:secrets`）；`DEV_LOGIN_ENABLED=false`；`MOCK_PAY_ENABLED=false`；`EMAIL_DEV_LOG=false`（否则 API 启动失败，见 `services/api/src/env.ts` `assertProductionConfig`） |        |      |
| ☐   | **密钥不入 Git**：无 `.env`、`upstreams.json`、`platform.db` 提交；`git ls-files` 自检见 [`OPEN_SOURCE_SECURITY.zh.md`](OPEN_SOURCE_SECURITY.zh.md)                                                                                                  |        |      |
| ☐   | **Webhook 仅验签入账**：`/v1/webhooks/*` 无 Bearer 属正常；依赖渠道验签 + `fulfillOrder` 金额校验与 `payment_events` 幂等（[`payment/webhookHandler.ts`](../services/api/src/payment/webhookHandler.ts)）                                            |        |      |
| ☐   | **禁止生产 mock / dev 登录**：后台「模拟支付」展示关闭；`POST /v1/orders/:id/mock-pay` 仅在沙箱可用（需 JWT + 订单归属）                                                                                                                             |        |      |
| ☐   | **Admin 最小权限**：`ADMIN_EMAILS` 仅必要邮箱；`ADMIN_ROLES` 按 finance/ops 分权；无共享弱口令账号                                                                                                                                                   |        |      |
| ☐   | **SQLite 备份**：Zeabur Volume 或等价备份策略已确认（订单、账本、用户余额）                                                                                                                                                                          |        |      |
| ☐   | **E2E smoke ≠ `/health`**：登录 → 下单 → webhook/查单入账 → 反推扣点 → `balance_ledger` 对账（清单见 [`launch-readiness-memory.zh.md`](launch-readiness-memory.zh.md) §上线 smoke）                                                                  |        |      |

### P1 — 建议尽早

| ☐   | 检查项                                                                                                                                                                            | 负责人 | 日期 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---- |
| ☐   | 多实例部署时 `TRUSTED_PROXY_HOPS` 与反代层数一致；`CORS_ORIGIN` 仅生产官网域名（勿用 `*`）；`RATE_LIMITER_BACKEND=redis` 当前仍为进程内内存回退，多副本需网关限流或后续实现 Redis |        |      |
| ☐   | 监控：扣费失败、上游 5xx、`rateLimit` 触发、单用户短时异常 `topup`（阈值记私有笔记）                                                                                              |        |      |
| ☐   | `CONFIG_ENCRYPTION_KEY` 轮换预案：轮换后须在 Admin 重新录入上游/支付凭据                                                                                                          |        |      |

### 本仓已内置（确认理解即可，无需重复开发）

- 生产启动阻断弱 `JWT_SECRET` / mock / dev 登录 / `EMAIL_DEV_LOG`
- 微信 RSA 验签 + 资源解密；支付宝签名验证；ZPAY/YunGouOS 各自 provider 校验
- `fulfillOrder` 幂等与金额不一致拒绝入账
- Admin：`adminAuth` + 写操作 `adminWriteRateLimit`
- DB 内支付/上游 Key：`CONFIG_ENCRYPTION_KEY` AES-256-GCM

---

## 坑点 2：支付风控（非 Stripe）

「风控拉满」分 **商户控制台** 与 **平台 env/后台** 两层；黑产盗刷、异常退款需两边同时收紧。

### P0 — 商户侧（支付平台控制台）

| ☐   | 检查项                                                                                                                                                                                    | 负责人 | 日期 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---- |
| ☐   | **生产已关闭 mock**：`MOCK_PAY_ENABLED=false`，官网无 `NEXT_PUBLIC_MOCK_PAY_ENABLED`                                                                                                      |        |      |
| ☐   | **回调 URL 正确且 HTTPS 可达**：微信 `{API_PUBLIC_URL}/v1/webhooks/wechat`；支付宝 `.../alipay`；ZPAY `.../zpay`（见 [`PLATFORM_OPERATIONS.zh.md`](PLATFORM_OPERATIONS.zh.md) §商户参数） |        |      |
| ☐   | **微信官方**：回调域名/IP 白名单、异常交易告警；退款策略与 `REFUND_WINDOW_DAYS` 一致                                                                                                      |        |      |
| ☐   | **支付宝官方**：异步通知 URL 固定；开启异常通知/风控规则（按商户后台能力）                                                                                                                |        |      |
| ☐   | **ZPAY**：单笔/日累计限额；回调 URL 配置；**勿与 YunGouOS 同时启用**（路由以 YunGouOS 优先）                                                                                              |        |      |
| ☐   | **YunGouOS**：聚合通道风控规则；在 Admin「路由策略」中明确优先级                                                                                                                          |        |      |
| ☐   | **小额真实充值验收**：到账 → `orders.provider_tx_id` 有值；重复 webhook 不重复加点                                                                                                        |        |      |

### P0 — 平台侧（本仓配置）

| ☐   | 检查项                                                                                                                                                   | 负责人 | 日期 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---- |
| ☐   | 试用防刷 env 已按生产收紧：`SIGNUP_TRIAL_IP_LIMIT_PER_DAY`、`SIGNUP_TRIAL_RATE_LIMIT_PER_MIN` 等（[`signupRisk.ts`](../services/api/src/signupRisk.ts)） |        |      |
| ☐   | 代调用限流：用户 `rate_limit_per_min` 合理；全局 `rateLimit` 生效                                                                                        |        |      |
| ☐   | Admin 支付：**展示开关 ≠ 安全边界**；入账真相源为 env + webhook + `MOCK_PAY_ENABLED`（见 [`admin-dashboard.zh.md`](admin-dashboard.zh.md)）              |        |      |
| ☐   | 充值异常告警阈值已写入**私有**运维笔记（如短时大量 `topup`、同 IP 多账号试用）                                                                           |        |      |

### P1

| ☐   | 检查项                                                                         | 负责人 | 日期 |
| --- | ------------------------------------------------------------------------------ | ------ | ---- |
| ☐   | Admin 展示试用发放/拒绝原因（当前后端已有，UI 可观测性见 launch-readiness P1） |        |      |
| ☐   | 退款审批 SLA 与 finance 角色分工明确                                           |        |      |

---

## 坑点 3：数字产品与版权

### P0

| ☐   | 检查项                                                                                                                                            | 负责人 | 日期 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---- |
| ☐   | [`TERMS.md`](../TERMS.md) 已覆盖：数据使用、退款（与平台运维文档 §退款一致）、用户内容责任                                                        |        |      |
| ☐   | [`PRIVACY.md`](../PRIVACY.md) 与官网隐私页 URL 为生产域名                                                                                         |        |      |
| ☐   | Chrome Web Store **数据披露**与隐私政策 URL 指向生产官网（[`store-listing/data-usage-disclosure.md`](../store-listing/data-usage-disclosure.md)） |        |      |
| ☐   | 营销素材（官网截图、商店图）**不含**未授权影视/游戏画面、他人商标                                                                                 |        |      |
| ☐   | **禁止上架**：他人受版权保护的提示词包、未授权模型权重、侵权课程类数字商品（若业务扩展须法务先审）                                                |        |      |

### P1 — 法务待办（私有记录）

| ☐   | 检查项                                                                                                         | 负责人 | 日期 |
| --- | -------------------------------------------------------------------------------------------------------------- | ------ | ---- |
| ☐   | 自有产品软件著作权 / 商标等登记（证书号与材料仅存私有笔记，**勿写入公开仓**）                                  |        |      |
| ☐   | 品牌 logo 更换已走完整流程（见 [`.cursor/rules/logo-replacement.mdc`](../.cursor/rules/logo-replacement.mdc)） |        |      |

---

## 坑点 4：流量与运营（最难）

技术基建有成熟方案；**获客、留存、客服**需单独 SOP，不能指望「上线即增长」。

### P0 — 技术与商业闭环

| ☐   | 检查项                                                                                           | 负责人 | 日期 |
| --- | ------------------------------------------------------------------------------------------------ | ------ | ---- |
| ☐   | 上游已配置：Admin 录入 Key、同步模型，至少一次真实反推扣点成功                                   |        |      |
| ☐   | 支付策略已二选一：**真实支付自动入账**，或 **人工充值 SOP**（确认订单、调账、通知用户）          |        |      |
| ☐   | 正式域名与扩展 `externally_connectable` 对齐；`npm run check:launch-domain` 通过；扩展已重新发版 |        |      |
| ☐   | 生产登录路径可用（Google / SMTP 等），无面向用户的 dev 登录                                      |        |      |
| ☐   | 定价一致：Admin 套餐、`POINTS_PER_USD` / 充值点数与官网展示一致                                  |        |      |

### P1 — 增长与运营（决策模板）

在私有笔记中填写，公开仓只保留决策项：

| ☐   | 决策项                                                                      | 备注（私有） |
| --- | --------------------------------------------------------------------------- | ------------ |
| ☐   | **首发主 CTA**：安装扩展 / 注册账户 / 充值（只选一个主路径）                |              |
| ☐   | **首发渠道**：扩展商店、社区、SEO、付费投放等优先级                         |              |
| ☐   | **客服与退款 SLA**：响应时间、审批人、人工充值联系人                        |              |
| ☐   | **核心指标**：注册 → 首次反推 → 首充 → 7 日留存；与 Admin 订单/流水对照方式 |              |
| ☐   | BYOK 与平台代调用两条路径的用户引导文案是否清晰                             |              |

### 技术基建索引（已实现，上线时引用即可）

- 部署：[`deploy-zeabur-runbook.zh.md`](deploy-zeabur-runbook.zh.md)
- 支付双层 + `GET /v1/payment-methods`：[`PLATFORM_OPERATIONS.zh.md`](PLATFORM_OPERATIONS.zh.md) §支付
- 运营后台：[`admin-dashboard.zh.md`](admin-dashboard.zh.md)
- 建议上线顺序：[`launch-readiness-memory.zh.md`](launch-readiness-memory.zh.md)

---

## 快速自检（约 30 分钟）

1. 通读 **坑点 1 P0** 七项 + 跑一遍 **launch-readiness smoke**。
2. 通读 **坑点 2** 商户回调 URL 与 mock 关闭。
3. **坑点 3** 核对 TERMS / PRIVACY / 商店披露。
4. **坑点 4** 确认支付与上游 P0 已勾，增长决策写入私有笔记。

全部 P0 勾选后，再进行公开商业推广或大规模获客。
