# Zeabur 上线 Runbook（\*.zeabur.app 验证阶段）

> **用途**：按本清单在 Zeabur 首次部署 Prompt Hub 官网 + 平台 API，并配置 push 自动部署。
> **关联**：[deploy-zeabur.zh.md](deploy-zeabur.zh.md)（平台概念速查）、[deploy-platform.zh.md](deploy-platform.zh.md)（环境变量对照）、[deploy-hosting-selection.zh.md](deploy-hosting-selection.zh.md)（套餐选型）。
> **本阶段域名**：先用 Zeabur 生成的 `*.zeabur.app` 子域名跑通；**扩展内登录**需等切到 `github.com/xiaotao-02/prompt-hub` 后再测。

---

## 前置条件

- [ ] GitHub 仓库已 push 最新代码（含本 runbook 与 `scripts/gen-secrets.mjs`）
- [ ] Zeabur 账号已注册；**正式上线建议 Dev 档（$5/月）** 以启用 Volume 备份（Free 无备份）
- [ ] 本地已生成生产密钥：`npm run gen:secrets`（输出 `JWT_SECRET` / `AUTH_LINK_SECRET` / `CONFIG_ENCRYPTION_KEY`）
- [ ] 已准备好上游 `UPSTREAM_API_KEY`（仅填 Zeabur 控制台，勿提交 git）

---

## 步骤 1：绑定 GitHub

- [ ] 打开 [Zeabur 控制台](https://dash.zeabur.com) → **设置** → **集成**
- [ ] 点击 **绑定 GitHub**，安装 Zeabur App 到存放本仓库的账号/组织
- [ ] 确认仓库在 Zeabur 创建服务时可被搜索到

> 一个 GitHub 账号只能绑定一个 Zeabur 账号。

---

## 步骤 2：创建 Project 与官网服务（website）

- [ ] 新建 **Project**（名称自定，如 `prompt-hub`）
- [ ] **Add Service** → 选 **Git** → **GitHub** → 选择本仓库
- [ ] 服务命名建议：`website`
- [ ] **设置** → **Root Directory** → 填 `website` → 保存
- [ ] **设置** → **监控路径（Watch Paths）** → 填 `/website` → 保存
- [ ] 等待首次构建完成（Zeabur 自动识别 Next.js）

| 配置项         | 值              |
| -------------- | --------------- |
| Root Directory | `website`       |
| Watch Paths    | `/website`      |
| 构建方式       | 自动（Next.js） |

> 仓库根目录的 `zbpack.json` 已把默认 `app_dir` 指向 `website`，可避免 Zeabur 误部署 Chrome 扩展主目录（`src/`、`vite` 等仅用于 Chrome Web Store 打包，不在服务器运行）；控制台里仍建议显式设置 Root Directory = `website`。

---

## 步骤 3：创建 API 服务（api）

- [ ] 同一 Project 内 **Add Service** → 再次选同一 GitHub 仓库
- [ ] 服务命名建议：`api`
- [ ] **设置** → **Root Directory** → 填 `services/api` → 保存
- [ ] **设置** → **Watch Paths** → 填 `/services/api` → 保存
- [ ] 确认使用 [services/api/Dockerfile](../services/api/Dockerfile) 构建（Root Directory 下存在 Dockerfile 即自动 Docker 构建）

| 配置项         | 值                 |
| -------------- | ------------------ |
| Root Directory | `services/api`     |
| Watch Paths    | `/services/api`    |
| 构建方式       | Docker（自动识别） |

> 若服务名为 `api` 且从仓库根目录构建，`zbpack.api.json` 会使用根目录 [api.Dockerfile](../api.Dockerfile)（只复制 `services/api/`，不加载扩展代码）；Root Directory = `services/api` 时仍用 [services/api/Dockerfile](../services/api/Dockerfile)。控制台里仍建议显式设置 Root Directory = `services/api`。

### 挂载 SQLite 持久卷（必做）

- [ ] API 服务 → **硬盘** → **Mount Volumes**
- [ ] Volume ID：`data`
- [ ] Mount Directory：`/data`
- [ ] 保存

> ⚠️ **首次挂载会清空目标目录**。新部署无历史数据可忽略；若已有数据须先备份再挂卷。

---

## 步骤 4：生成临时域名

- [ ] **website** 服务 → **域名** → **生成域名** → 记下 `https://<WEB>.zeabur.app`
- [ ] **api** 服务 → **域名** → **生成域名** → 记下 `https://<API>.zeabur.app`

下文用占位符：

- `<WEB>` = 官网域名，如 `prompt-hub-web.zeabur.app`
- `<API>` = API 域名，如 `prompt-hub-api.zeabur.app`

---

## 步骤 5：配置环境变量

### 5.1 API 服务变量

服务 → **变量** → **编辑原始环境变量**，粘贴并替换占位符与密钥：

```env
DATABASE_PATH=/data/platform.db

JWT_SECRET=<npm run gen:secrets 输出>
AUTH_LINK_SECRET=<npm run gen:secrets 输出>
CONFIG_ENCRYPTION_KEY=<npm run gen:secrets 输出>

DEV_LOGIN_ENABLED=false
MOCK_PAY_ENABLED=false
EMAIL_DEV_LOG=false
# 生产若误设为 true，API 启动会失败（验证码/魔法链接会写入日志）

# Zeabur 反代后须 >= 1，否则 IP 限流与试用风控失效
TRUSTED_PROXY_HOPS=1

SITE_URL=https://<WEB>.zeabur.app
API_PUBLIC_URL=https://<API>.zeabur.app
CORS_ORIGIN=https://<WEB>.zeabur.app

UPSTREAM_BASE_URL=https://www.tokenrouter.tech/v1
UPSTREAM_API_KEY=<你的上游令牌>
UPSTREAM_DEFAULT_MODEL=gpt-5.5
UPSTREAM_INPUT_PRICE_PER_1K=0.015
UPSTREAM_OUTPUT_PRICE_PER_1K=0.090
POINTS_PER_USD=144
MIN_BALANCE_POINTS=1
MIN_CHARGE_POINTS=0.1
UPSTREAM_MAX_TOKENS=1024

# 管理员后台：Google 登录邮箱白名单 + 与官网相同的 OAuth Client ID（见 docs/zeabur-admin-google-login.zh.md）
ADMIN_EMAILS=<你的管理员邮箱>
GOOGLE_CLIENT_ID=<Google OAuth Web Client ID，与 website 的 NEXT_PUBLIC_GOOGLE_CLIENT_ID 相同>

WECHAT_PAY_ENABLED=false
ALIPAY_ENABLED=false
ZPAY_ENABLED=false
# ZPAY 聚合（生产在 /admin 支付管理填写，或 env 预填后启用）：
# ZPAY_PID=
# ZPAY_KEY=
# ZPAY_API_BASE=https://zpayz.cn
# 异步回调（ZPAY 商户后台）：{API_PUBLIC_URL}/v1/webhooks/zpay
```

**不要手动设置 `PORT`** — Zeabur 会自动注入。

生产启动校验见 [services/api/src/env.ts](../services/api/src/env.ts) `assertProductionConfig`：缺少强随机 `JWT_SECRET` / `CONFIG_ENCRYPTION_KEY` 或误开 `DEV_LOGIN_ENABLED` / `MOCK_PAY_ENABLED` 会导致 API **启动失败**。

### 5.1.1 邮箱登录发信（SMTP / Zeabur Email）

官网 `/account` 发送魔法链接依赖 API 发信。`EMAIL_DEV_LOG=false` 且未配置发信时，页面会显示「邮件服务未配置」。

**方案 A — Gmail SMTP（推荐个人站）**

1. Google 账号开启两步验证，创建[应用专用密码](https://myaccount.google.com/apppasswords)。
2. 复制 `output/zeabur-smtp.env.example` → `output/zeabur-smtp.env`，填入 `SMTP_PASS`。
3. 写入 Zeabur 并重启 API：

```powershell
$env:ZEABUR_TOKEN = '<Zeabur API Key>'
.\scripts\apply-zeabur-smtp.ps1
```

或把下列变量并入 `output/zeabur-api.env` 后执行 `.\scripts\apply-zeabur-api-env.ps1 -UseGraphql`：

```env
EMAIL_FROM=Prompt Hub <your@gmail.com>
EMAIL_DEV_LOG=false
# 生产若误设为 true，API 启动会失败（验证码/魔法链接会写入日志）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=<16-char-app-password>
```

**方案 B — Zeabur Email REST**

在 [Zeabur Email](https://zeabur.com/email) 验证发信域名并创建 API Key，设置 `ZSEND_API_KEY` + `ZSEND_FROM`（发件地址须在已验证域名下）。API 会优先使用 Zeabur Email，无需 SMTP。

验收：

```powershell
.\scripts\verify-zeabur-email.ps1 `
  -ApiUrl https://<API>.zeabur.app `
  -Email <your@gmail.com>
```

### 5.2 官网服务变量

```env
NEXT_PUBLIC_SITE_URL=https://<WEB>.zeabur.app
NEXT_PUBLIC_API_URL=https://<API>.zeabur.app
NEXT_PUBLIC_MOCK_PAY_ENABLED=false
NEXT_PUBLIC_DEV_LOGIN_ENABLED=false
NEXT_PUBLIC_PRICING_ENABLED=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<与 API 的 GOOGLE_CLIENT_ID 相同>
```

生成 env 片段（本地）：`.\scripts\zeabur-admin-google-env.ps1 -ClientId "<CLIENT_ID>" -AdminEmail "<邮箱>" -WebHost "<WEB>.zeabur.app" -ApiHost "<API>.zeabur.app"`

### 5.3 重新部署

- [ ] API 服务 → **Redeploy Service**
- [ ] website 服务 → **Redeploy Service**
- [ ] 查看构建日志，确认 API 无 `Production config validation failed`

---

## 步骤 6：验收 Smoke

- [ ] `curl -s https://<API>.zeabur.app/health` 返回 200 / 正常 JSON
- [ ] 浏览器打开 `https://<WEB>.zeabur.app` 首页正常
- [ ] 打开 `https://<WEB>.zeabur.app/account` 账户页可加载
- [ ] **邮箱登录**：`verify-zeabur-email.ps1` 返回 OK，收件箱收到魔法链接（见 5.1.1）
- [ ] **管理员后台（Google）**：按 [zeabur-admin-google-login.zh.md](zeabur-admin-google-login.zh.md) 配好 OAuth + `ADMIN_EMAILS` / `GOOGLE_CLIENT_ID` 并 Redeploy 后，`/account` Google 登录 → `/admin` 可进控制台；可选 `.\scripts\verify-zeabur-admin.ps1 -ApiUrl "https://<API>.zeabur.app" -WebUrl "https://<WEB>.zeabur.app"`
- [ ] **持久卷**：在账户页注册/登录一次 → API 服务 **Redeploy** → 再次访问账户，数据仍在
- [ ] **Watch Paths**：仅改 `website/` 下文件并 push 到 `main` → 确认只有 website 服务重建，api 未触发

### 本阶段不测项

- Chrome 扩展「登录账号 → 官网回传 Key」：**不可用**。`externally_connectable` 仅允许 `github.com/xiaotao-02/prompt-hub`，见 [src/manifest.config.ts](../src/manifest.config.ts)。切自定义域名后再测。

---

## 自动部署（以后代码更新）

绑定 GitHub 并完成首次部署后：

| 操作                                             | 行为                                   |
| ------------------------------------------------ | -------------------------------------- |
| `git push origin main`（改 `website/**`）        | 仅 **website** 服务自动重建            |
| `git push origin main`（改 `services/api/**`）   | 仅 **api** 服务自动重建                |
| 修改 Zeabur 控制台环境变量                       | **不会**自动部署 → 需手动 **Redeploy** |
| GitHub Actions（`.github/workflows/api.yml` 等） | 仅 CI 测试/构建，**不负责**部署 Zeabur |

### 推荐工作流

1. 本地 `npm run lint && npm run test && npm run build`（扩展改动时）
2. PR 合并到 `main`
3. Zeabur 监听 push 自动部署对应服务
4. 部署完成后跑一遍 Smoke（至少 `/health` + 官网首页）

---

## 备份（点数 = 真实资产）

### Zeabur 平台备份（Dev 档起）

- [ ] 升级到 **Dev** 档
- [ ] API 服务 → 启用 **Backup**（备份对象为 `/data` 持久卷）
- [ ] 定期在控制台验证备份可导出 / 恢复流程

### 可选：离线双保险

在容器内或挂载卷路径导出 SQLite（需 Zeabur Shell / 临时任务）：

```bash
# 示例：复制到卷内备份文件（仍在本卷，建议再配合对象存储）
sqlite3 /data/platform.db ".backup '/data/platform-$(date +%Y%m%d).db'"
```

长期建议：[Litestream](https://litestream.io/) 实时复制到 S3/R2 等对象存储。

---

## 切到自定义域名（后续）

当自定义域名就绪时（当前生产域 `aipromptstudio.top`，详见 [custom-domain-aipromptstudio.zh.md](custom-domain-aipromptstudio.zh.md)）：

1. 两服务 **域名** → 添加自定义域名 → 按提示配置 DNS（Cloudflare 勿用 Full Strict）
2. 更新两服务 env 中的 `SITE_URL` / `API_PUBLIC_URL` / `CORS_ORIGIN` / `NEXT_PUBLIC_*`
3. Redeploy 两服务
4. 确认 [src/lib/platform/config.ts](../src/lib/platform/config.ts) 与 [src/manifest.config.ts](../src/manifest.config.ts) 已含生产域名
5. 重新打包并发版 Chrome 扩展
6. 跑完整 Smoke（含扩展登录、扣点、充值）

---

## 常见问题

| 现象                                                   | 处理                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 官网 `*.zeabur.app` 全站 **502 Bad Gateway**           | 控制台显示「运行中」但公网 502：① 确认 **Root Directory = `website`**；② 确认 **未**把 `next start -p 4321` 写死在启动命令（应使用仓库 `website/package.json` 的 `next start`，由 Zeabur 注入 `PORT`）；③ **不要**在 website 变量里手填 `PORT=8787` 等 API 端口；④ 另建 **api** 服务并生成 `*-api.zeabur.app`，`NEXT_PUBLIC_API_URL` 指向 API 域名。验收：`.\scripts\verify-zeabur-deploy.ps1 -WebUrl ... -ApiUrl ...`   |
| 官网 `*.zeabur.app` 全站 **404**（含 `/`、`/account`） | 多为**只建了一个服务且 Root Directory 为空（仓库根）**。根目录是 Chrome 扩展（Vite），不是 Next.js。→ 将该服务 **Root Directory** 改为 `website`、**Watch Paths** 改为 `/website` 后 **Redeploy**；另建 **api** 服务（Root `services/api`、挂卷 `/data`）。管理员后台需 **官网 + API 两个域名** 都正常后再配 Google（见 [zeabur-admin-google-login.zh.md](zeabur-admin-google-login.zh.md)）。                           |
| API 域名 `/health` 返回 **404**                        | API 服务未创建或域名未绑定到 api 服务。→ 新建服务 Root `services/api`，生成独立 `*.zeabur.app` 域名后再测 `/health`                                                                                                                                                                                                                                                                                                      |
| 插件登录 **HTTP 404**（`/health` 仍为 200）            | 自定义 `api.<根域>` 常绑到**旧 api 实例**，无 `/v1/auth/email/code/send`。→ `.\scripts\diagnose-api-auth-404.ps1`；在 Zeabur 将 api 子域仅绑当前 api 服务后 **Redeploy**。详见 [zeabur-api-domain-404.zh.md](zeabur-api-domain-404.zh.md)                                                                                                                                                                                |
| 容器反复 **Back-off restarting** / 启动中卡住          | 展开运行日志首条 `ERROR`：① `TRUSTED_PROXY_HOPS must be >= 1` → API 变量加 `TRUSTED_PROXY_HOPS=1`（Zeabur 反代后必填）；② `JWT_SECRET` / `CONFIG_ENCRYPTION_KEY` 缺或仍为 dev 默认值；③ `DEV_LOGIN_ENABLED` / `MOCK_PAY_ENABLED` / `EMAIL_DEV_LOG` 须为 `false`。本地先跑 `.\scripts\check-zeabur-api-env.ps1`，再 `.\scripts\apply-zeabur-api-env.ps1 -UseGraphql` 或控制台粘贴 `output/zeabur-api.env` 后 **Redeploy** |
| API 启动报 `Production config validation failed`       | 同上；验收 `curl https://<API>.zeabur.app/health` 与 `.\scripts\verify-zeabur-deploy.ps1 -ApiUrl ...`                                                                                                                                                                                                                                                                                                                    |
| 重启后用户余额丢失                                     | 未挂 Volume 或 `DATABASE_PATH` 未指向 `/data/platform.db`                                                                                                                                                                                                                                                                                                                                                                |
| 改 `website/` 却两个服务都重建                         | Watch Paths 未设为 `/website` 与 `/services/api`                                                                                                                                                                                                                                                                                                                                                                         |
| 官网调 API CORS 失败                                   | `CORS_ORIGIN` 须含 `https://<WEB>.zeabur.app`（与 `NEXT_PUBLIC_SITE_URL` 一致）                                                                                                                                                                                                                                                                                                                                          |
| Docker 构建误走 Node builder                           | 确认 Root Directory = `services/api` 且该目录有 `Dockerfile`                                                                                                                                                                                                                                                                                                                                                             |

---

## 快速索引

| 我要…                | 操作                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| 官网 502 / API 404   | [`zeabur-502-service-split.zh.md`](zeabur-502-service-split.zh.md) + `.\scripts\verify-zeabur-deploy.ps1`  |
| 生成生产密钥         | 仓库根目录 `npm run gen:secrets`                                                                           |
| 部署前校验 API env   | `.\scripts\check-zeabur-api-env.ps1`                                                                       |
| 绑定 GitHub          | 控制台 → 设置 → 集成                                                                                       |
| 指定 monorepo 子目录 | 服务 → 设置 → Root Directory                                                                               |
| 隔离重建范围         | 服务 → 设置 → Watch Paths                                                                                  |
| 挂 SQLite 卷         | API 服务 → 硬盘 → Mount Volumes → `/data`                                                                  |
| 手动触发部署         | 服务 → Redeploy Service                                                                                    |
| env 模板             | [services/api/.env.example](../services/api/.env.example)、[website/.env.example](../website/.env.example) |
