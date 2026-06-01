# 识图模型分类维护说明

扩展在「设置 → 模型与连接」中为每个模型标注是否适合参考图（`image_url`）反推。分类分三层：

1. **模型族规则**（[`src/lib/providerVisionFamilies.ts`](../src/lib/providerVisionFamilies.ts)）— 日常主力，`gpt-5.5`、`claude-4` 等新 id 通常自动归入对话多模态族，无需逐个登记。
2. **端点 `/models` 拉取** — OpenRouter 等可解析 `input_modalities`；其余厂商按规则重算 `discoveredVisionById`。
3. **静态示例目录**（[`src/lib/providerVisionCatalog.ts`](../src/lib/providerVisionCatalog.ts)）— 仅用于未拉取端点时的卡片展示；**不单独用于拦截**。

## 拦截原则

仅 **高置信 `no_vision`** 会在有参考图时拦截反推（如 `text-embedding-*`、`MiniMax-M2*`、官方 `deepseek-chat`）。  
`unknown` 与低置信 `vision` **不拦截**，避免新型号误报。

## 发版前检查清单

1. 对照 OpenAI / Anthropic / Google / 国内主流文档，更新 `providerVisionCatalog` 中的 `visionExamples` / `nonVisionExamples`。
2. 将 `CATALOG_UPDATED` 改为当前年月。
3. 若某厂商出现「特殊陷阱」（如 MiniMax M2 冒充多模态），在 `providerVisionFamilies` 的 `PROVIDER_DEFINITE_NO_VISION` 增加规则。
4. 运行：`npm test -- modelVision`

## 相关源码

- [`src/lib/modelVision.ts`](../src/lib/modelVision.ts) — `classifyModel`、`shouldBlockExtract`
- [`src/lib/api/providerValidation.ts`](../src/lib/api/providerValidation.ts) — 反推前校验
- [`src/lib/modelVision.matrix.test.ts`](../src/lib/modelVision.matrix.test.ts) — 跨厂商回归矩阵
