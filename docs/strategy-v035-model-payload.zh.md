# v0.3.5 策略（`v035`）发往模型的文本说明

本文说明在扩展中选择 **「v0.3.5 策略」** 时，`instruction` 如何组装，以及如何与参考图一起在 API 请求中发给多模态模型。

## 策略由哪些组件构成

源码：[`src/lib/strategies-meta.ts`](../src/lib/strategies-meta.ts) 中 `v035` 条目。

| 组件                                                             | 版本                                                       |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| 指令集（四套输出风格共用一套「版本」，但中文自然语言档单独收紧） | `stylePromptSet: 'v0.3.5'`                                 |
| 采样                                                             | `sampling: 'v0.3.0'` → 温度 **0.3**，`max_tokens` **1536** |
| 自定义模板拼接位置                                               | `customJoin: 'v0.3.0'` → **prepend**（模板在前）           |

扁平化解析见 [`src/lib/strategies.ts`](../src/lib/strategies.ts)。

## `natural-zh`（自然中文）下的核心指令正文

[`STYLE_PROMPT_SET_V035`](../src/lib/strategies.ts) 在 v0.3.0 基础上 **仅覆盖** `natural-zh`，正文为：

```text
根据图片结构合理分段详细描述提示词，不严格规定有几段，但是大概保留3-8段落，提示词为中文自然语言+参数，通用的提示词不适配模型，只返回提示词本体，不要出现违规提示词
```

其它三种输出风格（`natural-en` / `sd-tags` / `midjourney`）**与 v0.3.0 成套一致**，使用 v0.3.0 的长指令，而不是上面这句短中文。

## `instruction` 如何拼出来

入口：[`src/lib/api/extract.ts`](../src/lib/api/extract.ts) 的 `buildInstruction`，随后可能追加多图、专注模式、视频分镜等说明。

### 1. 基础情况（最常见）

- 策略：`v035`
- 输出风格：自然中文 `natural-zh`（非「原生识别」`native`）
- **未**填写「自定义提示词模板」
- 单张参考图
- 未开启「材质 / 画风专注」
- 非视频分镜多帧

此时 **`instruction` 就是上面那一段 `natural-zh` 字符串**，图片内容不会写进这段文字里，由模型看多模态消息中的图像部分理解画面。

### 2. 填写了自定义提示词模板

v0.3.5 使用 **prepend**：先用户模板（trim），空行分隔，再接风格对应的 `base` 指令。

```text
{自定义模板}

{所选输出风格对应的 base 指令 — natural-zh 时为上面那句}
```

若为 **append** 策略（例如经典档），则为 `base` + `\n\n额外要求：` + 自定义；**v0.3.5 不是 append**。

### 3. 可能追加的后缀（仍属于同一条 `instruction` 字符串）

- **多张参考图**（且无视频分镜上下文）：追加「综合理解多张图、输出一条完整连贯提示」类说明常量 `MULTI_IMAGE_INSTRUCTION_NOTE`。
- **材质 / 画风专注**：追加对应的 `EXTRACT_FOCUS_*` 说明。
- **视频分镜**：追加大段「分镜格式例外」说明（每条分镜与时间锚点等）。

具体字符串见 [`extract.ts`](../src/lib/api/extract.ts) 内常量与 `appendVideoSegmentInstruction` / `appendExtractFocusInstruction`。

### 4. 「原生识别」策略说明（对比）

「原生识别」`native` 策略下**不读取**设置里的四套输出风格来选指令，而是固定走 `natural-zh` 键对应的极简口令；这与 **v0.3.5** 不同——v0.3.5 **会**跟随 `settings.outputStyle`（`native` 除外）。

## 请求里「打包」结构（概念）

指令 **不是**和像素说明混成一段话描述图片，而是：

1. **`instruction`**：纯文本字符串（如上）。
2. **参考图**：各 provider 中将图像作为多模态 `user` 消息里的独立块（例如 OpenAI 兼容：`text` part 后再跟若干 `image_url`）。

示例（OpenAI 兼容流式）：[`src/lib/api/providers/openai.ts`](../src/lib/api/providers/openai.ts) 中 `callOpenAICompatible` —— 默认 **`content` 为先 `text`（instruction）再逐张图**；**`minimax` 渠道在存在参考图时为「先 image 后 text」**（见源码 `buildOpenAIMultimodalUserContent`），并为 MiniMax 附带「已含图、勿要求上传」的补充约束；其它 OpenAI 兼容厂商保持「文 + 图」顺序。

**MiniMax + 带参考图反推时的模型：** 不要使用 `MiniMax-M2*`（含 highspeed）做识图反推——部分路由不按多模态处理 `image_url`，易反复出现「未见图」。扩展在 [`extract.ts`](../src/lib/api/extract.ts) 中会在**存在参考图且当前模型匹配 `MiniMax-M2*`** 时于**发起请求前拦截**并提示换用 VL；请改用控制台中的 **VL / 多模态** id（推荐 `MiniMax-VL-01`，以实际列表为准）。背景与排错见 [MiniMax 疑难说明](./troubleshooting-minimax.zh.md)。

**MiniMax 流式语义：** 官方 OpenAI 兼容 SSE 下，各 chunk 的 `delta.content` 为**截止当前的完整正文**（累计快照），不是 OpenAI 常见的逐 token 增量；`reasoning_split` 时较长时间可能只有 `delta.reasoning_details` 在涨。扩展用 `applyOpenAIStreamDelta`：`minimax` 下用快照覆盖正文、并可用 reasoning 驱动面板进度，最终以 `delta.content` 为准落库。

若模型仍回复「请上传图片」等，见 [MiniMax 疑难说明](./troubleshooting-minimax.zh.md)。

同一请求中与策略相关的数值参数通常为：

- `temperature: 0.3`
- `max_tokens: 1536`（或等价字段名，视 provider 封装而定）

## 示例场景：单图 UI 卡片

以「智能家居灯具场景卡片」（白底文案 + 渐变光晕等）**单图**、`natural-zh`、无自定义模板、无专注/分镜为例：

**发往模型的文本部分**即为本节「核心指令正文」中的单段中文；画面中的 `alex's workspace`、`color / intensity 64%` 等均由模型阅读图像得出，扩展侧不会在 `instruction` 里预先描述该截图。

若要复现同款 payload，可在仓库内对应该图跑一次提取，并用开发者工具或代理查看实际 HTTP body（注意不要泄露 API Key）。

## 相关文件索引

| 说明                             | 路径                                                                    |
| -------------------------------- | ----------------------------------------------------------------------- |
| 策略档位元数据与组件版本         | [`src/lib/strategies-meta.ts`](../src/lib/strategies-meta.ts)           |
| 各版本指令全文、采样、拼接注册表 | [`src/lib/strategies.ts`](../src/lib/strategies.ts)                     |
| 组装 instruction 与路由 provider | [`src/lib/api/extract.ts`](../src/lib/api/extract.ts)                   |
| OpenAI 兼容多模态消息形态        | [`src/lib/api/providers/openai.ts`](../src/lib/api/providers/openai.ts) |
