<p align="center">
  <img src="docs/images/readme/logo-128.png" width="96" alt="Prompt Hub" />
  <h1>Prompt Hub</h1>
  <p>浏览即创作：右键收集参考图/视频，自备视觉 API，秒级反推 SD / MJ / Flux 可用提示词</p>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://github.com/xiaotao-02/prompt-hub/releases"><img src="https://img.shields.io/badge/Chrome-Extension-7c3aed?logo=googlechrome&logoColor=white" alt="Chrome Extension" /></a>
  <a href="https://github.com/xiaotao-02/prompt-hub/actions/workflows/ci.yml"><img src="https://github.com/xiaotao-02/prompt-hub/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <strong>简体中文</strong> · <a href="README.en.md">English</a>
</p>

![核心流程：收集参考 → 合成 → 复制](docs/images/readme/hero-marquee.png)

AI 绘画的瓶颈往往不在最终出图，而是把参考变成可复用、格式正确的提示词。**Prompt Hub** 在你已经浏览的网页上就地完成这件事：右键把图片加入浮动参考面板，或跳过收集直接反推。结果秒级呈现在页面内面板，可直接用于 Stable Diffusion、Midjourney、Flux 等工具。

在扩展设置中配置你自己的视觉模型 API Key；扩展**不会把图片或密钥发往开发者后端**（见 [隐私政策](PRIVACY.md)）。

---

## 30 秒上手

1. 从 [GitHub Releases](https://github.com/xiaotao-02/prompt-hub/releases) 下载 zip，在 `chrome://extensions` 开启开发者模式后「加载已解压的扩展程序」
2. 点击工具栏图标 → **设置**，在「模型与连接」中填写 API Key 并选择**支持识图**的模型
3. 在任意网页 **右键图片** → **加入参考**（或 **直接反推提示词**）→ 在面板点击 **生成提示词** → **复制**

![三步工作流](docs/images/readme/workflow-three-step.png)

---

## 核心功能

### 右键与参考面板

- 支持 `<img>`、`<video>`、`<canvas>`、内联 SVG、CSS 背景图
- **加入参考**（最多 8 张图合成）或 **直接反推提示词**
- **Ctrl+Shift+E**（Mac：`Command+Shift+E`）区域框选截图；也可从工具栏弹窗发起

<p align="center">
  <img src="docs/images/readme/context-menu.png" alt="右键菜单：加入参考或直接反推" width="720" />
</p>

![参考面板：多图理解](docs/images/readme/reference-panel.png)

- **生成提示词** 做完整反推；**提取素材 / 提取风格** 针对单一维度
- 视频：在时间范围内采样帧，生成故事板式提示词

### GIF、视频与区域捕获

- GIF / APNG / 动图 WebP → 取首帧静态图
- Twitter / Reddit / Discord 伪 GIF `<video>` → 通过 canvas 抓取当前帧
- 站点劫持右键菜单时，用区域框选或弹窗 **截取区域**

### 输出风格与策略

| 风格       | 说明                  |
| ---------- | --------------------- |
| 自然中文   | 段落式中文提示词      |
| 自然英文   | 段落式英文提示词      |
| SD Tag     | Stable Diffusion 标签 |
| Midjourney | MJ 风格表述           |

策略档位：经典策略、v0.2.2、v0.3.0、v0.3.5、**v0.3.6 通用高还原**（默认）、原生识别、自定义组合。

### 历史、对话改写与提示词库

![历史与版本](docs/images/readme/popup-history.png)

- 在面板与弹窗中编辑；**自动保存版本**，可恢复任意修订
- **对话式改写**：「更电影感 / 翻译成英文 / 加上 8k masterpiece」等
- 设置页 → **提示词库**：大图编辑、文件夹管理、AI 改写

![提示词库](docs/images/readme/prompt-library.png)

### 12+ 视觉模型供应商

![多供应商选择](docs/images/readme/providers-grid.png)

OpenAI、Anthropic、Google Gemini、智谱 GLM、通义千问、SiliconFlow（含 DeepSeek-VL2）、Moonshot、豆包、百度千帆、OpenRouter、自定义 OpenAI 兼容端点等——API Key **仅存于你的浏览器**。

### 设置与隐私

![粘贴 Key 即可开始](docs/images/readme/settings-quickstart.png)

- Key 与偏好通过 `chrome.storage.sync` 在同账号 Chrome 设备间同步
- 通过 **GitHub Releases** 获取更新；当前版本显示在设置页
- **无遥测 / 无埋点**

> **DeepSeek 官方 API** 不支持识图。如需 DeepSeek 视觉能力，请在设置中选择 **SiliconFlow**，模型填 `deepseek-ai/deepseek-vl2`。

---

## 开源 BYOK 版说明

本仓库为 **自备 API Key（BYOK）** 开源构建：

| 包含                                 | 不包含      |
| ------------------------------------ | ----------- |
| 完整扩展逻辑、自备 Key、直连供应商   | 平台代调用  |
| 本地历史与提示词库                   | 官网登录    |
| GitHub Releases 分发与扩展内检查更新 | 充值 / 计费 |

维护者在私有 monorepo 运行 export 生成本公开仓内容；**请勿在公开仓直接改扩展逻辑**，应改私有仓后重新 export。详见 [维护者指南](docs/MAINTAINER.zh.md)。

---

## 安装与开发

需要 **Node 18+**。

```bash
npm install
npm run dev          # HMR；UI 预览 http://localhost:5173/__dev__/ui-preview
npm run build        # → dist/
npm run zip          # 打包扩展 zip
```

**加载到 Chrome（推荐）**

```bash
npm run install:chrome    # 或 npm run install:edge
```

手动方式：`npm run build` → `chrome://extensions` → 开发者模式 → 加载已解压的扩展程序，选择 `dist/`。

<details>
<summary>install:chrome 参数</summary>

| 参数                    | 说明                                    |
| ----------------------- | --------------------------------------- |
| `--build`               | 启动前强制重新构建                      |
| `--browser=edge`        | 使用 Edge                               |
| `--use-default-profile` | 使用系统 Chrome 配置（需先退出 Chrome） |

默认使用独立配置目录 `.chrome-dev-profile/`，避免与正在运行的 Chrome 实例冲突。

</details>

**技术栈**：Manifest V3 · Vite 6 · React 18 · TypeScript · Tailwind CSS v4 · Shadow DOM 注入

---

## 常见问题

**问：右键菜单有哪些选项？**  
答：**加入参考**（先收集再合成）和 **直接反推提示词**。多图合成时请用「加入参考」。

**问：部分网站提示「图片下载失败」？**  
答：防盗链 / Referer 限制。请在新标签页打开图片后重试。

**问：Twitter / X 的 GIF 用不了？**  
答：实为 `<video>` 元素——请**在视频上**右键。若站点劫持菜单，用 **Ctrl+Shift+E** 框选。

**问：无法捕获视频帧？**  
答：跨域视频未设置 `crossorigin="anonymous"` 会污染 canvas。暂停到目标帧后重试，或用区域框选。

**问：「增强型安全浏览不信任此扩展」？**  
答：新开发者扩展在开启 [增强保护](https://support.google.com/chrome/answer/9890866) 时较常见，[不代表扩展恶意](https://support.google.com/chrome_webstore/answer/2664769)。仍可点击 **继续安装**。

---

如果 Prompt Hub 帮你节省了写 prompt 的时间，欢迎在 GitHub 点 Star —— 这对独立维护的开源扩展意义重大。

---

## 更多文档

- [隐私政策](PRIVACY.md)
- [扩展 UI 概览](docs/plugin-pages-overview.zh.md)
- [维护者指南](docs/MAINTAINER.zh.md)

---

## 许可证

本仓库采用 [MIT License](LICENSE)。终端用户请从 [GitHub Releases](https://github.com/xiaotao-02/prompt-hub/releases) 安装。
