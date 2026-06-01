<p align="center">
  <img src="docs/images/readme/logo-128.png" width="96" alt="Prompt Hub" />
  <h1>Prompt Hub</h1>
  <p>Image to Prompt · Multi-provider vision API hub for Chrome</p>
</p>

<p align="center">
  <a href="https://github.com/xiaotao-02/prompt-hub/releases"><img src="https://img.shields.io/badge/Download-GitHub%20Releases-7c3aed?logo=github&logoColor=white" alt="GitHub Releases" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
  <a href="README.md">简体中文</a> · <strong>English</strong>
</p>

**Prompt Hub** is an open-source Chrome extension (BYOK). Collect reference images or video frames while browsing, then reverse-engineer AI art prompts using **your own** vision model API keys. Switch freely among **12+ providers** (OpenAI, Anthropic, Gemini, Zhipu, Qwen, SiliconFlow, Moonshot, Doubao, OpenRouter, custom OpenAI-compatible endpoints, and more).

Images and API keys are sent **directly** to the provider you configure—not through a developer-operated proxy. See [PRIVACY.md](PRIVACY.md).

---

## Quick start

1. Download `prompt-hub-v*.zip` from [GitHub Releases](https://github.com/xiaotao-02/prompt-hub/releases), or run `npm run build` and load `dist/`
2. Open `chrome://extensions` → Developer mode → **Load unpacked**
3. Configure API Key and Base URL under **Settings**
4. Right-click an image → **Add to references** or **Extract prompt** → **Generate** → **Copy**

---

## Development

```bash
npm install
npm run dev
npm run build
npm run lint && npm run test
```

---

## License

[MIT License](LICENSE)
