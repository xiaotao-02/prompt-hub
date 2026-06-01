# 维护者指南（开源 BYOK 仓）

## 发版

```bash
npm run lint && npm run test && npm run build
npm run zip
# GitHub Actions auto-release 会在 push main 时打 tag 并上传 zip
```

## 同步源码

本仓由私有 monorepo **export 生成**，请勿在此直接开发 platform 相关功能。

私有仓命令：

```bash
npm run export:byok -- --out ../prompt-hub-open
```

详见 [GITHUB_MIGRATION.zh.md](GITHUB_MIGRATION.zh.md)。
