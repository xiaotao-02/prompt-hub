# Prompt Hub

**Prompt Hub** 是一款开源 Chrome 浏览器扩展（BYOK 构建）：在网页上收集参考图/视频，通过自备视觉模型 API 反推 AI 绘画提示词。

- 安装：从 [GitHub Releases](https://github.com/xiaotao-02/prompt-hub/releases) 下载 zip，在 `chrome://extensions` 开启开发者模式后「加载已解压的扩展程序」
- 请在扩展「设置 → 模型与连接」中填写您自己的视觉模型 API Key
- 隐私政策：见 [PRIVACY.md](PRIVACY.md)

## 开源 BYOK 版说明

本仓库为 **自备 API Key（BYOK）** 开源构建，不含平台代调用、官网登录或充值功能。

维护者在私有 monorepo 运行 export 生成本公开仓内容；**请勿在公开仓直接改扩展逻辑**，应改私有仓后重新 export。

## 开发

```bash
npm install
npm run lint && npm run test && npm run build
```
