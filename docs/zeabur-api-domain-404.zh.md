# Zeabur：插件登录 HTTP 404（自定义 API 域名）

> 插件「内置服务」发送验证码显示 `HTTP 404`，但 `GET /health` 仍为 200。

## 根因

同一 Project 内可能存在**两个**曾部署过的 API 实例，或自定义域名 `api.<根域>` 仍绑在**旧服务**上：

| 探测                            | `api.aipromptstudio.top` | `prompt-hub-api.zeabur.app` |
| ------------------------------- | ------------------------ | --------------------------- |
| `GET /health`                   | 200                      | 200                         |
| `POST /v1/auth/email/code/send` | **404**                  | **400**（路由存在）         |

插件与官网构建默认请求 `https://api.aipromptstudio.top`（见 [env.production.example](../env.production.example)）。自定义域指向旧镜像时，登录路由不存在，表现为 404。

## 修复（Zeabur 控制台）

1. **api** 服务 → **设置** → Root Directory = `services/api`，Watch Paths = `/services/api`
2. **api** 服务 → **域名** → 确认 `api.aipromptstudio.top`（或你的 api 子域）**仅**绑在当前 api 服务
3. 若其他服务（含旧 api、误用仓库根目录的服务）也绑了同名域名 → **删除**旧绑定
4. **Redeploy Service**（非仅 Restart）
5. 本地验收：

```powershell
.\scripts\diagnose-api-auth-404.ps1
.\scripts\verify-api-auth-route.ps1 -ApiUrl https://api.aipromptstudio.top
```

有 API Key 时可自动重绑域名并写入 env：

```powershell
$env:ZEABUR_TOKEN = '<Zeabur API Key>'
.\scripts\apply-zeabur-production-domain.ps1
```

## 插件侧

1. `chrome://extensions` → 重新加载扩展
2. 若仍失败，确认上架包由 `npm run release:store` 构建且 `VITE_PLATFORM_API_URL=https://api.aipromptstudio.top`
3. 修复域名后无需改插件路径；404 提示已改为可操作文案（见 `src/lib/platform/authErrors.ts`）

## 关联

- [zeabur-502-service-split.zh.md](zeabur-502-service-split.zh.md)
- [deploy-zeabur-runbook.zh.md](deploy-zeabur-runbook.zh.md)
