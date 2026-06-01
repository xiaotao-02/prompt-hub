# 开源扩展安全指南（BYOK 构建）

本仓库**仅含 Chrome 扩展**，不含 `services/api` 或 `website`。

## 勿提交

- 个人 `.env`（本扩展通常不需要服务端 env）
- 真实 API Key、JWT、支付私钥

## 与商业版关系

| 构建 | 来源 | 能力 |
|------|------|------|
| **GitHub 开源 BYOK** | 本公开仓 | 仅自备 API Key |
| **Chrome Web Store 官方版** | 私有 monorepo | 可含平台代调用 / 官网登录 |

维护者在私有仓运行 `npm run export:byok` 生成本公开仓内容；**请勿在公开仓直接改扩展逻辑**，应改私有仓后重新 export。

## CI

- `ci.yml` — lint / test / build / knip
- `gitleaks.yml` — 密钥扫描
- `auto-release.yml` — GitHub Release zip

不含 `publish-chrome-store.yml`（商店发版在私有仓）。
