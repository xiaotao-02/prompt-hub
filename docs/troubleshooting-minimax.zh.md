# MiniMax 疑难：返回「请上传图片」或未见图

若在 **MiniMax** provider 下识图后，模型仍用中文回复「请先上传图片」「我这边还没有看到您提供的图片」「抱歉，我未能看到附带的图片」「无法根据画面内容生成……」等，通常表示 **多模态未在该端点/模型上生效**，或请求被网关弱化成了纯文本会话。（扩展侧已对 MiniMax **前置 + 句末双重约束**，若这些话术仍频繁出现，更说明需核对模型/VL 与 Base URL，而非仅靠改提示词文案。）**若在已注入上述约束的情况下仍出现「抱歉，我未能看到附带的图片」等与禁止列表重合的套话，应视为当前模型（常见为 `MiniMax-M2*`）未走 VL 多模态链路，请直接改用 VL 等多模态型号，不要继续只靠改提示词排查。**

## 为什么配置里看起来像 MiniMax，设置页却显示「自定义」？

导入 JSON / curl / NewAPI 渠道时，会先按 **Base URL 的域名**匹配厂商；网关域名里 **没有** `minimax.chat` / `minimaxi.com` / `minimax.io` 等关键字时，会回落到 **「自定义 (OpenAI 兼容)」**。这是预期行为：**协议仍是 OpenAI 兼容**，只差在扩展不会走 `provider === minimax` 时的官方特化（如 `reasoning_split`、多模态 instruction 包装、流式累计快照语义等）。

**你可以这样对准 MiniMax：**

1. **一键导入后**：若在 JSON 里带有模型 id 形如 **`MiniMax-*`** 或 **`abab*`** ，导入逻辑会 weak 推断并切到「MiniMax」条目。
2. **仍落在「自定义」时**：请到「模型供应商」里 **手动选中「MiniMax」**，再在卡片中填写你的网关 **Base URL** 与 Key（与同一条聚合渠道一致）。这样 `activeProvider` 为 `minimax`，特化分支才会启用。

内置列表里单独写明的 **「数科隆达 中转」** 只是某一家的固定模板；一般的 NewAPI / 自架网关 **不会自动变成「中转」条目**，多数是「自定义」或按 URL 识别的具体厂商。

## 设置页识图标注

在 **选项 → 模型与连接** 中，每个供应商卡片会列出 **支持识图** / **未确认** / **不支持识图** 的模型（未拉取端点时显示内置示例；填写 Key 并从 `/models` 拉取后会按规则实时更新）。模型下拉亦分组并带「识图」徽章；仅 **高置信不支持** 的型号会拦截反推（如 embed、MiniMax-M2\*），新型号如 `gpt-5.5` 默认归入对话多模态族，不会误报。维护说明见 [vision-model-catalog.zh.md](./vision-model-catalog.zh.md)。

## 建议排查顺序

1. **模型是否支持视觉**
   - 在控制台或模型列表中选显式 **VL / 多模态** 型号（例如 `MiniMax-VL-*` 或当前文档中的视觉模型 id）。
   - **纯文本侧重** 的 `MiniMax-M2*` 在部分 Base URL 组合下可能不按 `image_url` 走视觉链路；若反复出现「未见图」，优先换 **VL** 再试。

2. **Base URL**
   - 新控制台常见为 `https://api.minimax.io/v1`（路径以各端文档为准）。
   - 若仍使用旧域（如 `api.minimax.chat`）而密钥与控制台已是新平台，可能出现行为不一致；请与账户文档中的 **官方 endpoint** 对齐。

3. **实际请求体**
   - 在浏览器 **Service Worker / 扩展背景页** 或通过代理抓包，确认 `POST .../chat/completions` 的 `messages[0].content` 为 **数组**，且含 `type: image_url`（一般为 `data:image/...;base64,...`）。
   - 若根本没有 `image_url`，问题在扩展前置流程；若有 `image_url` 仍被模型无视，多为 **模型或网关** 侧能力/路由问题。

## 扩展侧适配（实现说明）

自本仓库相关提交起，对 **activeProvider 为 `minimax`** 且 **存在参考图** 时：

- **模型为 `MiniMax-M2*`（含 highspeed）**：在发起请求前于 `extractPrompt` 内 **直接拦截** 并提示改用 VL，避免浪费调用与误以为扩展未发图（实现见 [`src/lib/api/extract.ts`](../src/lib/api/extract.ts)）。
- 多模态 `content` 采用 **先若干 `image_url`，后 `text`（含策略 instruction）** 的顺序，以兼容部分实现对块顺序较敏感的情况。
- 发往 MiniMax 的 **text** 在去 API 时使用 **prepend 多模态必读 + 所选策略正文 + append 禁止套话后缀**（不写入设置页的自定义模板；仅作用于 MiniMax），减轻「长内置策略冲淡句末约束」时的「未见图」套话。
- **流式输出（SSE）**：MiniMax OpenAI 兼容流下，`delta.content` 为**截至该 chunk 的完整正文**（累计快照）；`MiniMax-M2*` 且 `reasoning_split` 时，**前期可能只有 `delta.reasoning_details` 在更新**。**反推（extract）** 可用思考链驱动进度预览；**AI 调整（refine）** 主编辑器**只展示正式 `delta.content`**，思考阶段保持改写前 baseline 并显示「模型思考中…」，避免把「修改要点」类思考文案误当成提示词闪烁。保存的结果仍以 `delta.content` 为准（见 `applyOpenAIStreamDelta`）。与标准 OpenAI 的「逐小块增量拼接」不同，勿对 MiniMax 误用 `acc += delta.content`。
- `promptStrategy`（v0.3.5 / v0.3.0 / 原生识别等）**共用同一套 MiniMax 多模态拼装**；切换策略若仍被拒，优先按上文排查 VL 与网关。

若即使用 VL + 官方 Base URL 仍顽固出现「未见图」，多为 **网关/路由未把 image 交给该模型实例**；请更换可用 VL id、核对官方 endpoint，或联系 MiniMax。扩展无法替代厂商未开放的多模态路由。

## 相关源码

- [`src/lib/configImport.ts`](../src/lib/configImport.ts)：`matchProviderByUrl`（含 `minimax.io` 等域名）、`matchProviderByModel`，导入时对「自定义」的补充推断
- [`src/lib/api/extract.ts`](../src/lib/api/extract.ts)：MiniMax + `MiniMax-M2*` + 有参考图时的前置校验
- [`src/lib/api/providers/openai.ts`](../src/lib/api/providers/openai.ts)：`buildOpenAIMultimodalUserContent`、`MINIMAX_VISION_CONSTRAINT_PREFIX` / `_SUFFIX`、`effectiveMultimodalInstruction`、`applyOpenAIStreamDelta`
- [`src/lib/providers.ts`](../src/lib/providers.ts)：MiniMax 默认说明与选型提示
