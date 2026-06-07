# Zeabur 502：单服务拆分为 website + api

> 针对 `https://<name>.zeabur.app` 返回 **502**，而控制台显示「运行中」的情况。

## 根因（本项目）

1. **只部署了一个 Git 服务**，且未把 Root Directory 设为 `website`（仓库根是 Chrome 扩展 Vite，不是 Next.js）。
2. **Next.js 监听 4321**，但 Zeabur 网关转发到平台注入的 `PORT`（曾用 `next start -p 4321` 会导致 502）。
3. **API 未单独部署**，`NEXT_PUBLIC_API_URL` 指向的 `*-api.zeabur.app` 返回 404。

## 控制台操作（约 15 分钟）

### A. 修正现有官网服务（或重命名为 `website`）

1. 服务 → **设置** → **Root Directory** = `website`
2. **Watch Paths** = `/website`
3. **环境变量**：粘贴 [output/zeabur-website.env](../output/zeabur-website.env)（**不要**包含 `PORT=` 行）
4. **域名**：保留 `https://prompt-hub.zeabur.app`（或你的 web 子域）
5. **Redeploy Service**

### B. 新建 API 服务

1. 同一 Project → **新建服务** → GitHub → 同一仓库
2. 命名 `api`；**Root Directory** = `services/api`；**Watch Paths** = `/services/api`
3. **硬盘** → Mount Volume：`data` → `/data`
4. **环境变量**：粘贴 [output/zeabur-api.env](../output/zeabur-api.env)，替换 `UPSTREAM_API_KEY`、管理员邮箱等；部署前本地跑 `.\scripts\check-zeabur-api-env.ps1`（须含 `TRUSTED_PROXY_HOPS=1`，且勿手填 `PORT`）
5. **域名** → 生成域名，例如 `prompt-hub-api.zeabur.app`
6. 回到 **website** 与 **api** 两边，把 `NEXT_PUBLIC_API_URL` / `API_PUBLIC_URL` / `CORS_ORIGIN` 改成实际 API 域名
7. 两服务各自 **Redeploy**

## 代码侧已修复

- [website/package.json](../website/package.json)：`start` 改为 `next start`（自动读 `process.env.PORT`）
- [zbpack.json](../zbpack.json)：默认 `app_dir` 指向 `website`，避免 Zeabur 误部署仓库根目录的 Chrome 扩展。
- [zbpack.api.json](../zbpack.api.json)：服务名为 `api` 且从仓库根构建时，使用 [api.Dockerfile](../api.Dockerfile)（仅打包 `services/api/`，不加载 Chrome 扩展主目录）。

## 验收

```powershell
.\scripts\verify-zeabur-deploy.ps1 `
  -WebUrl "https://prompt-hub.zeabur.app" `
  -ApiUrl "https://prompt-hub-api.zeabur.app"
```

期望：API `/health` 200、官网 `/` 与 `/account` 200。
