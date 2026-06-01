---
name: local-platform-dev-login
description: >-
  跑通 Prompt Hub 本地平台账号登录与点数同步。用户提到 dev@local.test、本地插件登录、本地官网登录、
  同步点数、平台账户联调、插件通过官网登录时使用；重点覆盖扩展 UI 预览（5173）、官网（4321）与平台 API（8787）。
---

# 本地平台登录与点数同步

## 目标

让扩展本地预览中的“平台账户”使用本地 API 登录 `dev@local.test`，并同步本地点数余额。

默认入口：

- 扩展 UI 预览：`http://localhost:5173/__dev__/ui-preview#options`
- 官网账户页：`http://localhost:4321/account`
- 平台 API 健康检查：`http://localhost:8787/health`

## 先加载相关 skill

如果用户还需要启动或排查三服务预览，先读取并遵循同目录的 `open-plugin-ui-preview` skill。

## 代码前置

确认这些本地联调能力存在；没有时按现有模式补齐：

1. `scripts/start-dev-previews.ps1`
   - 扩展服务必须注入：
     - `DEV_PREVIEW_NO_OPEN=1`
     - `VITE_PLATFORM_SITE_URL=http://localhost:4321`
     - `VITE_PLATFORM_API_URL=http://localhost:8787`
   - 官网/API env 仍由脚本 upsert：
     - `website/.env`：`PUBLIC_API_URL=http://localhost:8787`、`PUBLIC_MOCK_PAY_ENABLED=true`
     - `services/api/.env`：`MOCK_PAY_ENABLED=true`、`SITE_URL=http://localhost:4321`、`API_PUBLIC_URL=http://localhost:8787`

2. `src/components/PlatformLoginForm.tsx`
   - 本地预览（`localhost` + `VITE_PLATFORM_API_URL=http://localhost:8787`）显示「一键登录 dev@local.test」
   - 调用 `PLATFORM_LOGIN_DEV` → API `/v1/auth/dev-login`，跳过邮箱验证码
   - 仍保留预填与验证码登录作为备选

3. `src/dev/preview/chromeShim.ts`
   - `routePreviewMessageAsync()` 必须处理：
     - `PLATFORM_LOGIN_DEV` → 调 `devLogin()`，成功后 `applyPlatformLogin()` 并刷新余额
     - `PLATFORM_LOGIN_EMAIL_SEND` → 调 `emailCodeSend()`
     - `PLATFORM_LOGIN_EMAIL_VERIFY` → 调 `emailCodeVerify()`，成功后 `applyPlatformLogin()` 并 `fetchProviderQuota({ providerId: 'platform', force: true })`
     - `FETCH_PROVIDER_QUOTA` → 调 `fetchProviderQuota()`
   - 这是 `__dev__/ui-preview` 必需的模拟 background 行为；真实扩展由 `src/background/messages.ts` 处理。

## 启动流程

在仓库根目录运行：

```powershell
npm run dev:previews
```

预期输出包含：

```text
Dev previews ready (npm run dev:previews):
  Extension gallery  http://localhost:5173/__dev__/ui-preview
  Website account  http://localhost:4321/account
  Website pricing  http://localhost:4321/pricing
  API health       http://localhost:8787/health
```

如果脚本提示某个端口已占用但服务健康检查通过，可以继续；如果健康检查失败，优先看 `.cursor/dev-preview/*.log`。

## 登录步骤

1. 打开 `http://localhost:5173/__dev__/ui-preview#options`
2. 进入设置里的「平台账户」
3. 点击「一键登录 dev@local.test」（推荐，无需验证码）

或走完整邮箱验证码链路（预填 `dev@local.test` / `123456`）：

1. 点击「发送验证码」
2. 点击「登录」

成功后扩展应显示已连接平台代调用，余额 badge 会从本地 API 的 `/v1/account` 刷新。

## 为什么验证码是 123456

本地 API 非 production 时，`services/api/src/routes/auth.ts` 的 `randomCode()` 返回 `config.smsDevCode`；默认来自 `SMS_DEV_CODE=123456`。邮箱验证码发送逻辑在 `services/api/src/mail.ts`，本地通常写入 API 日志或直接使用固定验证码。

## 验证命令

代码改动后至少运行：

```powershell
npm run lint:types
```

健康检查：

```powershell
Invoke-WebRequest -Uri "http://localhost:8787/health" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:5173/__dev__/ui-preview" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:4321/account" -UseBasicParsing
```

## 排障

- 扩展仍请求生产 API：确认 5173 是由 `npm run dev:previews` 启动，且扩展服务 env 包含 `VITE_PLATFORM_API_URL=http://localhost:8787`。
- 登录消息无响应：确认 `chromeShim.ts` 已处理 `PLATFORM_LOGIN_EMAIL_SEND` / `PLATFORM_LOGIN_EMAIL_VERIFY`。
- 余额不刷新：确认 `FETCH_PROVIDER_QUOTA` 在 `chromeShim.ts` 中转给 `fetchProviderQuota()`，并检查本地 API `/v1/account` 是否返回正常。
- 官网向真实扩展回传失败：真实 Chrome 扩展的 `externally_connectable.matches` 默认不包含 `http://localhost/*`；本 skill 主要覆盖 `__dev__/ui-preview`，真实扩展本地回传需临时加 localhost 白名单，发布前移除。
