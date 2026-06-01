# GitHub 双仓迁移指南（维护者）

## 目标

| 仓库 | 可见性 | 内容 |
|------|--------|------|
| `prompt-hub-commercial`（原仓改名） | **Private** | 扩展 + platform + `services/api` + `website` + CWS CI |
| `prompt-hub` | **Public** | `npm run export:byok` 输出的 BYOK 扩展 |

## 步骤

1. 在私有仓开发并合并到 `main`
2. 运行 `npm run export:byok -- --out ../prompt-hub-open`
3. 在输出目录 `npm ci && npm run lint && npm run test && npm run build`
4. GitHub Settings → 当前仓 **Rename** 为 `prompt-hub-commercial` → **Private**
5. 新建公开仓 `prompt-hub`，push export 结果
6. 确认私有仓 `.github/workflows/publish-chrome-store.yml` 仍可发商店版

## 注意

- 公开 fork 在私有化后会失效；在公开仓 README 说明迁移
- 商店隐私 URL 可继续指向官网（商业版含平台披露）；开源 BYOK 用本仓 `PRIVACY.md`
