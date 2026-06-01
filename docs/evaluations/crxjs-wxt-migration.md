# CRXJS → WXT 迁移评估（Go/No-Go）

**日期**：2026-05  
**结论**：**暂缓迁移（No-Go for main）** — 当前 Vite 6 + `@crxjs/vite-plugin@^2.0.0-beta.28` 可稳定交付；WXT 适合独立 PoC 分支验证后再决策。

## 现状

- 构建：`vite build` + `manifest.config.ts`（@crxjs）
- 已知痛点：换图标需 `Remove-Item dist`（项目规则已文档化）；HMR 偶发失效
- CI：`lint` / `format:check` / `test` / `build` / `knip` 全绿

## WXT 潜在收益

| 项         | 说明                             |
| ---------- | -------------------------------- |
| 维护活跃度 | 社区推荐度高于放缓的 CRXJS       |
| 增量缓存   | 旧资源残留问题可能缓解           |
| 跨浏览器   | Firefox / Safari 入口约定统一    |
| 内置能力   | auto-imports、storage 封装、i18n |

## 迁移成本（估算 3–5 天）

1. 目录重排：`src/background` → `entrypoints/background.ts` 等
2. `wxt.config.ts` + Tailwind v4 兼容验证
3. `manifest.config.ts` 逻辑迁移到 WXT manifest 钩子
4. 全量回归：右键提取、面板、popup、options、zip/store 构建
5. 更新 AGENTS.md、MAINTAINER、logo 规则中的 dist 清理说明

## 风险

| 项               | 说明                                    |
| ---------------- | --------------------------------------- |
| 一次性 diff 大   | 与功能 PR 冲突概率高                    |
| Tailwind 4 + WXT | 需实测 `@tailwindcss/vite` 是否即插即用 |
| beta 换 beta     | CRXJS beta → WXT 版本节奏不同，非零风险 |

## PoC 验收清单（临时分支）

- [ ] `wxt build` 产出可加载的 Chrome MV3 包
- [ ] content script Shadow 面板正常
- [ ] `npm run test` 路径别名 `@/*` 仍有效
- [ ] `npm run zip` / `release:store` 流程可对接或等价脚本

## 决策

**主分支继续使用 CRXJS**，直至 PoC 分支完成上表验收且无 blocker。与 [optimization-roadmap.md](../optimization-roadmap.md) §4.3 一致。
