# 供应商 API 额度查询

扩展可在 **设置页 · 模型与连接**、**Popup 头部**、**网页浮动面板** 查看当前所选供应商的剩余额度（若厂商提供公开查询接口）。

## 已支持插件内查询

| 供应商 id     | 说明                    | 数据来源                                                                                                            |
| ------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `platform`    | 平台代调用              | `GET {PLATFORM_API_URL}/v1/account` → `balancePoints`                                                               |
| `siliconflow` | 硅基流动                | `GET /v1/user/info` → `totalBalance`                                                                                |
| `deepseek`    | DeepSeek 官方           | `GET /user/balance`                                                                                                 |
| `moonshot`    | Moonshot Kimi           | `GET /v1/users/me/balance`                                                                                          |
| `openrouter`  | OpenRouter              | `GET /api/v1/key` → `limit_remaining` 等                                                                            |
| `openai`      | OpenAI                  | `GET /v1/dashboard/billing/credit_grants`（非官方稳定接口，Key 无账单权限时会降级为「暂不支持」）                   |
| `shukelongda` | 数科隆达 中转 (New API) | `GET {origin}/api/usage/token` → `total_available` / `total_granted`（内部单位 500,000 ≈ $1，与控制台美元展示一致） |

## 暂不支持插件内查询

以下供应商 **没有** 稳定、可仅凭 API Key 调用的余额接口，扩展会显示「暂不支持插件内查询」，并提供控制台链接（`docsUrl`）：

- 原生协议：`anthropic`、`gemini`
- 国内：`zhipu`、`qwen`、`doubao`、`stepfun`、`minimax`、`yi`、`baidu`
- 海外：`xai`、`mistral`、`groq`、`together`、`fireworks`
- 中转 / 自定义：`custom`

请前往各厂商控制台查看余额与用量。

## 缓存与刷新

- 查询结果缓存在 `chrome.storage.local`（键 `provider_quota_cache_v1`），默认 **60 秒** 内复用，避免频繁请求。
- 点击额度徽章可 **强制刷新**。
- 额度查询由 **background service worker** 发起（消息 `FETCH_PROVIDER_QUOTA`），使用设置中保存的 Key 或平台 Token。

## 相关源码

- [`src/lib/quota/`](../src/lib/quota/) — adapter 注册表与缓存
- [`src/components/ProviderQuotaBadge.tsx`](../src/components/ProviderQuotaBadge.tsx) — React 徽章
- [`src/content/panel/quotaBadge.ts`](../src/content/panel/quotaBadge.ts) — 浮动面板 DOM 徽章

## 扩展 adapter

1. 在 `src/lib/quota/adapters/` 新增 adapter 文件。
2. 在 `src/lib/quota/registry.ts` 的 `ADAPTERS` 中注册。
3. 补充本页「已支持」表格与单测（`src/lib/quota/quota.test.ts`）。
