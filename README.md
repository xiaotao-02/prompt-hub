# Prompt Hub

在浏览网页时收集图片与视频参考，通过视觉模型生成、改写和管理 AI 绘画提示词。

**简体中文** · [English](README.en.md) · [下载扩展](https://github.com/xiaotao-02/prompt-hub/releases) · [反馈问题](https://github.com/xiaotao-02/prompt-hub/issues)

Prompt Hub 是一款基于 Chrome Manifest V3 的开源扩展。右键添加参考，在当前网页的浮动面板中生成提示词，再复制到你的创作工具；也可以保存到提示词库，继续编辑、改写和回溯版本。

本仓库提供 **BYOK（Bring Your Own Key，自备 API Key）版本**：使用你配置的模型服务，不包含平台代调用、官网登录或充值计费功能。

## 快速开始

### 1. 安装扩展

1. 前往 [GitHub Releases](https://github.com/xiaotao-02/prompt-hub/releases)，下载发布附件中的 `prompt-hub-v*.zip`，而非源码压缩包。
2. 将压缩包解压到固定目录。
3. 打开 `chrome://extensions`，开启「开发者模式」。
4. 点击「加载已解压的扩展程序」，选择包含 `manifest.json` 的解压目录。
5. 将 Prompt Hub 固定到工具栏，方便打开设置和历史记录。

### 2. 配置模型

打开扩展设置，选择模型供应商，填写 **API Key**，确认 **Base URL** 并选择支持图片输入的**反推模型**。文本改写可单独配置改写模型。

扩展内置 OpenAI、Anthropic Claude、Google Gemini、智谱 GLM、通义千问、SiliconFlow、Moonshot Kimi、豆包、MiniMax、OpenRouter 等供应商配置，也支持自定义 OpenAI 兼容端点。可用模型及调用费用以你使用的服务为准。

### 3. 生成第一条提示词

1. 打开一个包含参考图片的网页，右键图片，选择「添加参考」。
2. 在浮动面板中点击「生成提示词」。
3. 复制结果，或继续编辑、对话改写。

只处理单张图片时，可右键选择「提取提示词」直接开始。安装或更新扩展后，已打开的网页需刷新再使用。

## 核心功能

| 功能         | 使用方式                                                               |
| ------------ | ---------------------------------------------------------------------- |
| 网页参考收集 | 从图片、视频、Canvas、内联 SVG 或 CSS 背景图添加参考，也可选择本地图片 |
| 多图合成     | 最多添加 8 张参考图，组合主体、构图、材质和风格信息                    |
| 区域截图     | 拖拽框选网页区域，适用于右键菜单受限或难以直接提取的内容               |
| 视频参考     | 通过「添加视频参考」选择时间范围，采样视频帧并生成故事板式提示词       |
| 按需提取     | 使用「生成提示词」「提取材质」或「提取风格」处理不同需求               |
| 对话改写     | 输入「更电影感」「翻译成英文」「突出材质」等要求，继续调整结果         |
| 历史与版本   | 编辑提示词、保存修订并恢复历史版本                                     |
| 提示词库     | 集中管理提示词，按文件夹整理，继续编辑或 AI 改写                       |
| 数据备份     | 支持本地数据目录，以及 JSON 导入与导出                                 |

### 输出格式与策略

| 输出格式           | 说明                                 |
| ------------------ | ------------------------------------ |
| 自然语言（中文）   | 段落式中文描述                       |
| Natural（English） | 段落式英文描述                       |
| 自然言語（日本語） | 段落式日语描述                       |
| JSON（英文）       | 英文结构化内容，便于接入结构化工作流 |

默认使用 **v0.3.6 通用高还原**策略，也可切换经典策略、v0.2.2、v0.3.0、v0.3.5、原生识别或自定义组合，调整反推指令与生成方式。

### 截图快捷键

| 系统            | 快捷键            |
| --------------- | ----------------- |
| Windows / Linux | `Ctrl+Shift+E`    |
| macOS           | `Command+Shift+E` |

也可从工具栏弹窗发起区域截图。快捷键未响应时，可在 `chrome://extensions/shortcuts` 中检查或重新设置。

## 数据与隐私

- **模型请求直连配置的服务**：图片、视频帧、截图及相关提示词会发送到你配置的模型端点，不经过开发者运营的代调用网关。
- **密钥与设置**：API Key 和偏好设置使用 `chrome.storage.sync` 保存，可能随浏览器同步设置在同账号设备间同步；调用模型时，密钥用于向配置的端点认证。
- **本地提示词库**：历史和版本存储在扩展的 IndexedDB 中，文件夹等辅助数据存储在浏览器本地。
- **备份与恢复**：可在设置中配置本地数据目录或导出 JSON，卸载、重装或迁移前建议备份。
- **无遥测、无埋点**。完整说明见 [隐私政策](PRIVACY.md)。

## 常见问题

### 添加参考与提取提示词有什么区别？

「添加参考」先收集素材，适合多图组合或进一步选择提取方式；「提取提示词」直接对当前图片或视频帧发起反推。

### 模型已配置，但无法识别图片？

确认选择的是支持图片输入的模型，而非仅支持文本的模型；同时检查 API Key、Base URL、模型 ID 和服务额度。供应商出现在列表中，不代表其所有模型都能识图。

### 图片下载失败，或网站拦截了右键菜单？

可尝试在新标签页打开图片后重试，或直接使用区域截图。防盗链、登录权限和站点脚本都可能影响素材读取。

### 视频或动图无法提取？

部分网站的「GIF」实际以视频播放，可在视频上右键添加参考。跨域限制可能导致视频帧读取失败，此时可暂停到目标画面后使用区域截图；需要分析一段视频时，使用「添加视频参考」。

### 如何更新扩展？

在设置页检查更新，并从 [GitHub Releases](https://github.com/xiaotao-02/prompt-hub/releases) 获取新版本。手动更新时，先备份数据，将新版解压覆盖到原安装目录，再到 `chrome://extensions` 点击扩展的重新加载按钮，并刷新使用中的网页。

## 本地开发

开发环境使用 **Node.js 22**（与仓库 CI 一致）和 npm。

```bash
git clone https://github.com/xiaotao-02/prompt-hub.git
cd prompt-hub
npm ci
npm run dev
```

开发服务默认打开 `http://localhost:5173/__dev__/ui-preview`，用于预览弹窗、设置页和浮动面板。预览页面使用模拟数据；右键菜单、截图和真实模型调用需要在浏览器中加载扩展验证。

### 构建与加载

```bash
npm run build           # 构建到 dist/
npm run install:chrome  # 使用独立浏览器配置启动 Chrome
npm run install:edge    # 使用 Edge
npm run zip             # 构建并输出到 dist-zip/
```

手动加载时，在 `chrome://extensions` 开启开发者模式，选择「加载已解压的扩展程序」并指向 `dist/`。

安装脚本默认使用 `.chrome-dev-profile/`。需要启动前重新构建时，执行 `npm run install:chrome -- --build`；使用系统默认浏览器配置时，执行 `npm run install:chrome -- --use-default-profile`，并先退出浏览器。

### 质量检查

```bash
npm run lint
npm run test
npm run build
npm run format:check
```

**技术栈**：Manifest V3、Vite 6、React 19、TypeScript、Tailwind CSS v4、Shadow DOM。

### 目录结构

```text
src/
  background/    后台服务、模型调用与消息路由
  content/       网页注入、区域截图与浮动面板
  popup/         工具栏弹窗
  options/       设置、提示词库与数据管理
  lib/           模型适配、策略、存储与共享类型
  components/    共享 UI 组件
  dev/preview/   开发预览与模拟数据
scripts/         构建、打包与维护脚本
docs/            架构与使用文档
```

本公开仓由私有 monorepo 导出。维护者应在源仓修改扩展逻辑后重新导出，具体流程见 [维护者指南](docs/MAINTAINER.zh.md)。问题与功能建议可提交到 [GitHub Issues](https://github.com/xiaotao-02/prompt-hub/issues)。

## 更多文档

- [扩展 UI 概览](docs/plugin-pages-overview.zh.md)：弹窗、设置页、面板与开发预览入口。
- [架构地图](docs/architecture-map.generated.md)：模块划分与依赖关系。
- [UI 组件规范](docs/ui-component-system.zh.md)：共享组件与样式约定。
- [供应商流式响应说明](docs/provider-streaming.zh.md)：模型响应与兼容处理。
- [维护者指南](docs/MAINTAINER.zh.md)：源码同步与发版流程。
- [隐私政策](PRIVACY.md) · [安全说明](SECURITY.md)。

## 许可证

本项目采用 [MIT License](LICENSE)。
