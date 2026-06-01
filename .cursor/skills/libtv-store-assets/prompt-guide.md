# Prompt 编写指南（LibTV 商店素材）

> 配合 [SKILL.md](SKILL.md) 使用。更新项目功能或换视觉风格时，先改本指南对应的条目，再写入 `prompts.json`。

## 1. 从项目提炼卖点

生成前先读这些来源，列出 **3–5 个核心功能** 和 **1 句主标语**：

| 来源                                               | 用途               |
| -------------------------------------------------- | ------------------ |
| `store-listing/summary.zh.txt`                     | 132 字摘要，主标语 |
| `store-listing/description.zh.md`                  | 完整功能列表       |
| `README.md`                                        | 最新特性           |
| `src/popup/`、`src/options/`、`src/content/panel/` | UI 真实布局参考    |

**Prompt Hub 当前核心功能（随版本更新）：**

1. 右键 `<img>` / `<video>` / canvas / SVG / CSS 背景，或 **Ctrl+Shift+E 框选** → 加入参考面板；也可「直接反推提示词」跳过收集
2. 参考面板最多 8 张图：**生成提示词 / 提取材质 / 提取风格**；视频可按时间段采样多帧生成分镜式提示词
3. 四种输出风格（自然语言中/英、SD Tag、Midjourney）+ 多档**策略档位**（含原生识别、自定义组合）
4. 浮动面板与 popup：**对话式 AI 调整**、**版本回溯**、召回面板；popup 内可启动区域截图
5. 设置页：**curl / 多 provider 一键导入**、12+ 视觉模型、**提示词库**；API Key **本地存储**，无开发者后端

**主标语：** 右键图片，获得 AI 提示词（见 `store-listing/summary.zh.txt`）

## 2. 七张图分工（固定结构）

| node               | 商店字段           | 像素     | ratio  | 内容重点                                       |
| ------------------ | ------------------ | -------- | ------ | ---------------------------------------------- |
| `promo-small`      | Small promo tile   | 440×280  | `3:2`  | logo + 参考面板 UI mock + 动图/框选 hint       |
| `promo-marquee`    | Marquee promo tile | 1400×560 | `21:9` | logo + 主标语 + 三步流程 + chip                |
| `shot-1-hero`      | Screenshot 1       | 1280×800 | `16:9` | 核心三步卡片（加入参考 / 合成反推 / 复制即用） |
| `shot-2-reference` | Screenshot 2       | 1280×800 | `16:9` | 参考面板 UI mock（材质/风格/视频分镜/策略）    |
| `shot-3-popup`     | Screenshot 3       | 1280×800 | `16:9` | Popup 历史 + 版本/召回/对话调整                |
| `shot-4-settings`  | Screenshot 4       | 1280×800 | `16:9` | 设置页 curl 导入 + 提示词库 Tab                |
| `shot-5-providers` | Screenshot 5       | 1280×800 | `16:9` | 多 Provider 网格 + 隐私一行                    |

**不要改** `node` / `out` / `width` / `height` / `ratio`（除非 Chrome 商店规格变更）。

## 3. 品牌 token（`brand.json`）

换风格时优先改 [`brand.json`](../../store-assets/libtv/brand.json)：

```json
{
  "productName": "Prompt Hub",
  "colors": {
    "background": "#0a0a0f",
    "backgroundSoft": "#12121a",
    "violet": "#7c3aed",
    "violetSoft": "#ede9fe",
    "cyan": "#22d3ee",
    "panel": "#ffffff",
    "ink": "#0f172a",
    "inkSoft": "#475569"
  },
  "visualStyle": "Near-black dark canvas with purple glow; center pixel-perfect white UI mock card...",
  "safeArea": "Keep all text and UI within central 90% safe margins; leave generous empty padding on all edges for crop.",
  "promptTone": "pixel-perfect UI mock on dark canvas, moderate Chinese labels, real extension layout"
}
```

每条 `prompt` 应包含：

- `brand.json` 中的 `visualStyle` 关键词
- 末尾 `safeArea` 句（一字不差）
- `promptTone` 约束（UI mock 允许适量按钮/chip/中文 label）
- 显式禁止旧风格：`no cyan/amber honeycomb theme`

## 4. Prompt 模板

### 通用结构（英文写 prompt，中文写 UI 文案）

```
[Asset type] for [productName]. Near-black canvas #0a0a0f, purple #7c3aed glow.
[Pixel-perfect white UI mock — popup / panel / settings / grid on dark canvas].
[Exact Chinese labels from Playwright templates — headline + buttons].
Purple accent buttons, Inter-style typography, no browser chrome, no cyan/amber honeycomb theme.
[safeArea sentence].
```

### 示例：marquee 主标语

```json
{
  "node": "promo-marquee",
  "prompt": "Wide Chrome Web Store marquee for Prompt Hub. Near-black canvas, purple glow. Logo left. Headline: 右键图片，获得 AI 提示词 with 获得 in purple. Three-step UI strip: 加入参考 → 合成反推 → 复制即用. Chips: 12+ 视觉模型, 本地存储. Pixel-perfect UI mock, 21:9, no cyan/amber honeycomb theme. Keep all text and UI within central 90% safe margins; leave generous empty padding on all edges for crop."
}
```

### 视觉风格变体

| 风格                       | prompt 关键词                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| **真实 UI 截图感（当前）** | `pixel-perfect UI mock`, `white card on dark canvas`, `exact extension popup/panel layout` |
| 极简图标（备选）           | `icon-led`, `minimal text`, `UI diagram`                                                   |
| 插画风                     | `flat illustration`, `isometric`, `soft gradients on dark bg`                              |
| 高对比营销                 | `bold typography`, `large headline`, `cinematic lighting`                                  |

换风格时 **7 张统一换**，不要混用两种风格。

## 5. 比例与裁切

Lib Image 2 **没有** 16:10 / 2.5:1，只能选最接近 ratio，脚本用 sharp `contain` + 黑底缩放到精确像素。

| 目标比例         | 使用 ratio | 黑边方向     |
| ---------------- | ---------- | ------------ |
| 1280×800 (16:10) | `16:9`     | 左右黑边     |
| 1400×560 (2.5:1) | `21:9`     | 上下黑边     |
| 440×280 (11:7)   | `3:2`      | 轻微上下黑边 |

文案/UI **必须** 在安全区内，避免贴边被黑边挤压视觉。

## 6. 单张重生成

只改某条 prompt 后：

```powershell
npm run store:libtv -- --only shot-2-reference
```

## 7. 常见问题

| 现象                     | 处理                                                                 |
| ------------------------ | -------------------------------------------------------------------- |
| 中文乱码/不可读          | 减少中文字数；或改用 Playwright 方案                                 |
| 3 分钟超时               | 脚本自动重试 1 次；仍失败则跳过，稍后 `--only` 单张重跑              |
| 内容被裁切               | 确认 `STORE_LIBTV_CROP` 未设为 `cover`；检查 safe-area               |
| 风格不一致               | 统一改 `brand.json` + 7 条 prompt 的 visualStyle 描述                |
| 仍出旧 cyan/amber 蜂巢风 | prompt 显式写 `no cyan/amber honeycomb theme, use purple #7c3aed`    |
| logo 旧了                | 先按 `.cursor/rules/logo-replacement.mdc` 换图标，再跑 `store:libtv` |
