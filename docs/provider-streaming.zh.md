# 模型供应商流式输出说明

扩展在**反推（extract）**与 **AI 调整（refine）**时，API 层**始终请求流式**（OpenAI 兼容 `stream:true`、Anthropic Messages `stream:true`、Gemini `:streamGenerateContent?alt=sse`）。

若上游实际返回 `Content-Type: application/json` 而非 `text/event-stream`，插件会**自动降级**为一次性解析完整 JSON。等待完整结果期间，UI 可能短暂显示：

> 当前接口未返回流式响应，正在等待完整结果…

拿到全文后，API 层会用**客户端打字机**按前缀逐帧把 `partial` 推给面板（`streamMode: buffered`），因此在不支持真 SSE 的中转 / 自部署网关上，用户仍能看到「逐字出现」的流式体验。极短回复（≤12 字符）跳过动画、一次性展示。最终结果仍会正常返回，不会因此失败。

---

## 各协议 / 供应商流式支持

| 协议 / 分组                                           | 流式支持         | 说明                                                                                                                        |
| ----------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| OpenAI 官方                                           | 支持             | `stream:true` + SSE                                                                                                         |
| Anthropic Claude                                      | 支持             | Messages API `stream:true`                                                                                                  |
| Google Gemini                                         | 支持             | `:streamGenerateContent?alt=sse`                                                                                            |
| 国内 OpenAI 兼容（智谱、通义、DeepSeek、Moonshot 等） | 通常支持         | 与 OpenAI Chat Completions 相同请求体                                                                                       |
| 海外 OpenAI 兼容（OpenRouter、Groq、Together 等）     | 通常支持         | 同上                                                                                                                        |
| `platform` 平台代调用                                 | 支持             | 后端透传 `stream` 参数                                                                                                      |
| `custom` / `shukelongda`                              | **取决于端点**   | 中转或自部署网关可能忽略 `stream:true` → 自动降级 + 客户端模拟逐字揭示                                                      |
| MiniMax M2                                            | 支持（特殊语义） | `delta.content` 为累计快照；refine 不展示 reasoning 链，见 [troubleshooting-minimax.zh.md](./troubleshooting-minimax.zh.md) |

插件**不维护**「按模型 id 的流式能力静态表」——运行时根据响应 `Content-Type` 判断是否 SSE，比硬编码更准确。

---

## 常见降级原因与排查

1. **baseUrl 错误**：须为 API 根路径并含 `/v1`（如 `https://api.openai.com/v1`），勿填网站首页。
2. **中转 / 代理剥离 SSE**：部分网关收到 `stream:true` 仍返回整段 JSON；换官方端点或支持 SSE 的中转。
3. **Gemini 经非官方代理**：须保留 `:streamGenerateContent?alt=sse` 路径；若被改写为 `:generateContent` 会触发降级。
4. **自定义 OpenAI 兼容**：确认网关返回 `Content-Type: text/event-stream` 且 body 为 `data: {...}` 行格式。

---

## 相关源码

- [`src/lib/api/providers/openai.ts`](../src/lib/api/providers/openai.ts) — OpenAI 兼容 extract / refine
- [`src/lib/api/providers/anthropic.ts`](../src/lib/api/providers/anthropic.ts) — Claude
- [`src/lib/api/providers/gemini.ts`](../src/lib/api/providers/gemini.ts) — Gemini
- [`src/lib/api/http.ts`](../src/lib/api/http.ts) — `isSseResponse`、`readSseDataChunks`
- [`src/lib/api/types.ts`](../src/lib/api/types.ts) — `StreamDeliveryMode`、`emitBuffered*Progress`、`revealBuffered*Progress` / `simulateStreamReveal`
- [`src/content/panel/loading.ts`](../src/content/panel/loading.ts) — 面板 buffered 进度文案
