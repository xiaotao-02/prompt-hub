# 部署托管平台选型记忆（官网 + API + SQLite）

> **用途**：记录"Prompt Hub 后端 + 官网 + 数据库上线该托管在哪"的选型讨论与结论，供后续上线决策直接复用。
> **关联文档**：架构与 checklist 见 [`deploy-vps-checklist.zh.md`](deploy-vps-checklist.zh.md)；环境变量对照见 [`deploy-platform.zh.md`](deploy-platform.zh.md)。
> **日期**：2026-06-02

---

## 1. 讨论的核心问题

本项目（官网 Next.js + 平台 API + 数据库）上线该托管在哪、用哪种形态。依次讨论了：

1. 后端 + 数据库放 VPS 与云服务器的区别。
2. 能否把官网 + API + 数据库全放一台云服务器（不混合部署）。
3. Zeabur 与阿里云 / 腾讯云对比。
4. 有没有类似 Zeabur、支持持久磁盘 + 定时备份、且便宜的平台。
5. Zeabur 哪个套餐能支撑上线。

纯方案讨论，未改动任何代码或配置。

---

## 2. 贯穿全程的硬约束（最关键）

来自 [`deploy-vps-checklist.zh.md`](deploy-vps-checklist.zh.md)：

- 后端 `services/api` 用 **`better-sqlite3` + 本地文件 `DATABASE_PATH=./data/platform.db`**，必须 **持久磁盘 + 常驻进程**。
- 因此 **API 不能放 Vercel / 纯 Serverless**（文件系统临时、进程无状态会丢库）。
- **初期不需要 Postgres**；单实例 SQLite + 备份足够，仅多实例水平扩展时才换 Postgres。
- **点数 = 真实资产**，SQLite 必须定时备份（cron `cp` 到对象存储或 Litestream 实时复制），丢库 = 用户余额丢失。

无论选哪个平台，两条底线不变：**持久卷存 SQLite** + **定时备份**。

---

## 3. 各问题的结论

| 问题                         | 结论                                                                           | 理由                                                        |
| ---------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| VPS vs 云服务器              | 对本项目**本质相同**（都是 IaaS 持久 VM）                                      | 真正有别的是"持久 VM vs Serverless"；选哪个看价格/备案/生态 |
| 官网+API+DB 全塞一台云服务器 | **可行**（单机一体化），Caddy/Nginx 按域名反代 `:3000` 官网 / `:8787` API      | 省钱省运维；代价是单点故障、资源竞争、HTTPS/守护自理        |
| 阿里云 / 腾讯云              | 适合**国内用户、要快、愿备案**；推荐**轻量应用服务器**；需预留 ICP 备案 1–3 周 | 国内访问快但要备案；长期单价低                              |
| Zeabur                       | PaaS，省心，**支持持久卷**满足 SQLite；计费 = 档位费 + 用量费                  | 像 Vercel 但有持久卷，不会一部署就丢库                      |

---

## 4. Zeabur 套餐选型结论（重点）

依据 [Zeabur 价格页](https://zeabur.com/zh-CN/pricing)（Free $0 / Dev $5 / Pro $19 / Team $79）：

- 计费 = **控制台功能档位订阅费 + CPU/内存/持久卷按用量计费**（两部分叠加）。
- **关键卡点是"数据库备份"**：Free 仅"控制台基础能力 + 社区支持"，**不含备份/监控**；Dev 明确含"监控与**备份**"。
- 因点数=真实资产、**无备份不能上线** → **正式上线最低档 = Dev（$5/月，前 14 天免费）**，初期约 $5 + 少量用量费。
- **Free（$0）只用于先跑通流程验证**（能部署、能挂卷，但无备份、日志仅 48h）。
- **Pro（$19）**：流量大、需 30 天日志/进阶搜索/更多域名再升。
- **Team（$79）**：多人协作团队向，当前单人上线无关。
- 上线自检：①持久卷确实挂到 SQLite 目录（`DATABASE_PATH` 指向卷内路径如 `/data/platform.db`）；②验证 Dev 备份能导出+恢复，建议再加 Litestream/cron 双保险。
- 平台操作速查（Root Directory、Watch Paths、Volume、域名、env 等）→ [`deploy-zeabur.zh.md`](deploy-zeabur.zh.md)
- **逐步上线 checklist** → [`deploy-zeabur-runbook.zh.md`](deploy-zeabur-runbook.zh.md)

---

## 5. 同类便宜 PaaS 备选池

- **Fly.io**：支持 Volumes，按量个位数美元起；**SQLite 备份最优雅**（官方 LiteFS/Litestream）。
- **Railway**：体验最像 Zeabur，支持 Volume，约 $5/月起；备份自理。
- **Render**：支持 Persistent Disk，但免费档不带持久盘且会休眠，挂盘需付费档 ~$7/月起。
- **Koyeb / Northflank / Sevalla(Kinsta)**：均 Zeabur 类、支持持久卷。
- **最省钱玩法**：便宜 VPS（Hetzner/Vultr/腾讯云轻量）+ 自建开源 PaaS **Coolify / Dokploy**，面板化体验 + 内置定时备份到 S3；代价是 VPS 系统层自维护。

---

## 6. 当前状态

- ✅ 已完成选型讨论，结论：Zeabur **Dev 档为上线最低档**（含 Volume 备份）。
- ✅ **已选定 Zeabur** 作为官网 + API 统一部署平台；逐步上线清单见 [`deploy-zeabur-runbook.zh.md`](deploy-zeabur-runbook.zh.md)。
- 密钥生成：仓库根目录 `npm run gen:secrets`。
- 自动部署：GitHub 绑定 Zeabur 后，`main` push 触发重建；Watch Paths 隔离 `website/` 与 `services/api/`。

---

## 7. 后续落地提醒

- **Zeabur 首次部署**：按 [`deploy-zeabur-runbook.zh.md`](deploy-zeabur-runbook.zh.md) 执行（双 Service + `/data` 卷 + env + Smoke）；环境变量对照 [`deploy-platform.zh.md`](deploy-platform.zh.md)。
- **阿里云/腾讯云备选**：Caddyfile + Docker/pm2 + DNS + 备份 cron，见 [`deploy-vps-checklist.zh.md`](deploy-vps-checklist.zh.md)。
- **不要**把 API 放 Vercel / 纯 Serverless；**不要**初期上 Postgres；**不要**在 Zeabur Free 档承载真实付费用户数据。
- **换域名**时必须同步改 [`src/manifest.config.ts`](../src/manifest.config.ts) 的 `externally_connectable.matches` 与 [`src/lib/platform/config.ts`](../src/lib/platform/config.ts) 默认 URL，并重新发版扩展。
