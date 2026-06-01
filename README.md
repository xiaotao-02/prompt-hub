<p align="center">
  <img src="docs/images/readme/logo-128.png" width="96" alt="Prompt Hub" />
  <h1>Prompt Hub</h1>
  <p>Image to Prompt · 聚合多家视觉模型 API，右键图片反推 AI 绘画提示词</p>
</p>

<p align="center">
  <a href="https://github.com/xiaotao-02/prompt-hub/releases"><img src="https://img.shields.io/badge/Download-GitHub%20Releases-7c3aed?logo=github&logoColor=white" alt="GitHub Releases" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
  <a href="README.en.md">English</a> · <strong>简体中文</strong>
</p>

**Prompt Hub** 是一款开源 Chrome 扩展（BYOK）：在浏览网页时收集参考图/视频帧，通过**你自备的**视觉模型 API 反推 Stable Diffusion、Midjourney、Flux 等工具可用的提示词。支持 OpenAI、Anthropic、Gemini、智谱、通义、SiliconFlow、Moonshot、豆包、OpenRouter 等 **12+ 供应商**，在设置页自由切换。

扩展**不向开发者后端**上传图片或 API Key；请求直连你在设置中配置的供应商端点。详见 [隐私政策](PRIVACY.md)。

---

## 快速开始

1. 从 [GitHub Releases](https://github.com/xiaotao-02/prompt-hub/releases) 下载 `prompt-hub-v*.zip`，或在本地 `npm run build` 后加载 `dist/`
2. 打开 `chrome://extensions` → 开发者模式 → **加载已解压的扩展程序**
3. 工具栏图标 → ⚙ **设置** → 填入视觉模型 **API Key** 与 **Base URL**
4. 任意网页 **右键图片** → **添加到参考** 或 **直接反推提示词** → **生成提示词** → **复制**

---

## 功能亮点

- 右键识别 `<img>` / `<video>` / 区域截图（**Ctrl+Shift+E**）
- 多参考图合成反推（最多 8 张）
- 自然语言 / SD Tag / Midjourney 等多种输出风格
- 对话式 AI 调整与版本回溯
- 提示词库、历史记录、本地导入导出

---

## 开发与构建

需要 **Node 18+**。

```bash
npm install
npm run dev          # 开发预览 http://localhost:5173/__dev__/ui-preview
npm run build        # 生产构建 → dist/
npm run zip          # 打包 zip
npm run lint && npm run test
```

加载到 Chrome：

```bash
npm run install:chrome
```

**技术栈**：Manifest V3 · Vite 6 · React 19 · TypeScript · Tailwind CSS v4

---

## 文档

- [维护者指南](docs/MAINTAINER.zh.md)
- [插件页面结构](docs/plugin-pages-overview.zh.md)
- [隐私政策](PRIVACY.md)
- [安全说明](SECURITY.md)

---

## 许可

[MIT License](LICENSE)
