---
name: open-plugin-ui-preview
description: >-
  启动或说明 Prompt Hub 本地开发预览：扩展 UI 聚合页（5173）、官网（4321）与平台
  API（8787）。用户说「启动预览」「插件预览」「官网预览」「本地联调」时使用。优先
  npm run dev:previews。
---

# 打开开发预览（扩展 UI + 官网 + API）

本仓库本地预览包含三个服务，**默认应一并启动**：

| 服务 | 地址 |
|------|------|
| 扩展 UI 聚合页 | http://localhost:5173/__dev__/ui-preview |
| 官网 | http://localhost:4321/ |
| 官网账户 | http://localhost:4321/account |
| 官网定价 | http://localhost:4321/pricing |
| 官网文档 | http://localhost:4321/docs |
| 平台 API | http://localhost:8787/health |

## 默认流程（Agent）

1. **优先**在仓库根目录执行 **`npm run dev:previews`**（[`scripts/start-dev-previews.ps1`](../../../scripts/start-dev-previews.ps1)）。
2. 脚本会：每次 upsert 本地联调 env（`PUBLIC_API_URL`、`PUBLIC_MOCK_PAY_ENABLED`、`PUBLIC_PRICING_ENABLED`、`MOCK_PAY_ENABLED` 等）、检测端口、后台启动三服务、等待就绪、打开扩展聚合页与官网账户页。
3. 启动前先确认端口未重复占用；若 5173/4321/8787 已有服务在跑且 env 无变更则跳过；env 刚被 patch 时会重启对应服务。
4. 日志目录：`.cursor/dev-preview/`（`extension.log` / `website.log` / `api.log`）；启动超时会 tail 日志尾部。

预期输出包含：

```text
Dev previews ready (npm run dev:previews):
  Extension gallery  http://localhost:5173/__dev__/ui-preview
    #popup         ...
    #options       ...
  Website account  http://localhost:4321/account
  Website pricing  http://localhost:4321/pricing
  API health       http://localhost:8787/health
```

### 非 Windows 降级

若 PowerShell 脚本不可用，手动开三个终端：

```bash
# 终端 1 — 扩展（DEV_PREVIEW_NO_OPEN=1 避免 Vite 自动开浏览器）
DEV_PREVIEW_NO_OPEN=1 VITE_PLATFORM_SITE_URL=http://localhost:4321 VITE_PLATFORM_API_URL=http://localhost:8787 npm run dev

# 终端 2 — 官网
cd website && cp -n .env.example .env && npm run dev

# 终端 3 — API
cd services/api && cp -n .env.example .env && npm run dev
```

就绪后打开：

- http://localhost:5173/__dev__/ui-preview
- http://localhost:4321/account

Windows 可用：

```powershell
Start-Process "http://localhost:5173/__dev__/ui-preview"
Start-Process "http://localhost:4321/account"
```

## 扩展 UI 聚合页

- 锚点：**`#popup`** / **`#options`** / **`#panel`** / **`#contextmenu`** / **`#website`**
- 快捷键 **`1`–`5`**（焦点在聚合页时）
- 官网标签内可切换 `/`、`/account`、`/pricing`、`/docs`
- 仅扩展 UI 时可单独 `npm run dev`；Vite 默认自动打开聚合页。禁止自动开浏览器：`$env:DEV_PREVIEW_NO_OPEN='1'; npm run dev`

## 不要与生产预览混淆

- **`npm run preview`**（`vite preview`）预览 **build 产出**；[`devUiPreviewGallery`](../../../vite.config.ts) 仅 `apply: 'serve'`，不会在 preview 服务器注册 `/__dev__/ui-preview`。
- 官网生产预览用 `cd website && npm run preview`，与 `npm run dev` 不同。

## 实现位置（排障）

- 编排脚本：[`scripts/start-dev-previews.ps1`](../../../scripts/start-dev-previews.ps1)
- 聚合页：[`src/dev/preview/gallery.html`](../../../src/dev/preview/gallery.html)
- Chrome 垫片：[`src/dev/preview/chromeShim.ts`](../../../src/dev/preview/chromeShim.ts)
- 本地联调说明：[`docs/PLATFORM_OPERATIONS.zh.md`](../../../docs/PLATFORM_OPERATIONS.zh.md)
