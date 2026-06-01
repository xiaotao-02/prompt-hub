<p align="center">
  <img src="docs/images/readme/logo-128.png" width="96" alt="Prompt Hub" />
  <h1>Prompt Hub</h1>
  <p>Right-click/hotkey: compose refs, AI prompts (CN/EN, SD, MJ) via your vision endpoint; multi-ref, strategies, chat refine &amp; history.</p>
</p>

<p align="center">
  <a href="https://github.com/xiaotao-02/prompt-hub/releases"><img src="https://img.shields.io/badge/Chrome-Extension-7c3aed?logo=googlechrome&logoColor=white" alt="Chrome Extension" /></a>
  <strong>English</strong> · <a href="README.md">简体中文</a>
</p>

![Core flow: add references → compose → copy](docs/images/readme/hero-marquee.png)

The slow part of AI art is rarely the final render—it is turning a reference into a reusable prompt in the right shape for your toolchain. **Prompt Hub** works where you already browse: right-click to add images to the floating reference panel, or skip collection and extract directly. Results land in an on-page panel in seconds, ready for Stable Diffusion, Midjourney, Flux, and similar tools.

Configure your own vision-model API key in Options; the extension **does not send images or secrets to a developer backend** ([Privacy Policy](PRIVACY.md)).

---

## Quick start

1. Install → toolbar icon → ⚙ **Options**
2. Enter API key and a **vision-capable** model
3. On any page **right-click an image** → **Add to reference** (or **Extract prompt directly**) → **Generate prompt** in the panel → **Copy**

![Three-step workflow](docs/images/readme/workflow-three-step.png)

---

## Features

### Right-click & reference panel

- Works on `<img>`, `<video>`, `<canvas>`, inline SVG, CSS background images
- **Add to reference** (up to 8 images, then compose) or **Extract prompt directly**
- **Ctrl+Shift+E** (Mac: Command+Shift+E) region snip; also available from the toolbar popup

<p align="center">
  <img src="docs/images/readme/context-menu.png" alt="Context menu: add reference or extract prompt" width="720" />
</p>

![Reference panel: multi-image understanding](docs/images/readme/reference-panel.png)

- **Generate prompt** for full extraction; **Extract material / Extract style** for narrower dimensions
- Videos: sample frames across a time range for storyboard-style prompts

### GIF, video & region capture

- GIF / APNG / animated WebP → flattened to a static first frame
- Twitter / Reddit / Discord faux-GIF `<video>` → current frame via canvas
- When sites hijack the menu, use region snip or popup **capture region**

### Output styles & strategies

| Style           | Description           |
| --------------- | --------------------- |
| Natural CN / EN | Paragraph prompts     |
| SD Tag          | Stable Diffusion tags |
| Midjourney      | MJ-style phrasing     |

Strategy tiers: Classic, v0.2.2, v0.3.0, v0.3.5, **v0.3.6 General High-Fidelity** (default), Native, Custom combo.

### History, chat refine & prompt library

![History and versions](docs/images/readme/popup-history.png)

- Edit in panel and popup; **auto-saved versions**, restore any revision
- **Conversational refine**: “more cinematic / translate to English / add 8k masterpiece”
- Options → **Prompt Library**: large-image editing, folders, AI refine

### 12+ vision providers

![Multi-provider picker](docs/images/readme/providers-grid.png)

OpenAI, Anthropic, Google, Zhipu GLM, Qwen, SiliconFlow (incl. DeepSeek-VL2), Moonshot, Doubao, Baidu Qianfan, OpenRouter, custom OpenAI-compatible endpoints—keys stored **only in your browser**.

### Options & privacy

![Paste key and go](docs/images/readme/settings-quickstart.png)

- Keys sync via `chrome.storage.sync` across your Chrome devices
- Updates via **Chrome Web Store**; current version shown in Options

> **DeepSeek’s official API** does not accept images. For DeepSeek vision, use **SiliconFlow** in Options with model `deepseek-ai/deepseek-vl2`.

---

## Install & develop

Requires **Node 18+**.

```bash
npm install
npm run dev          # HMR; UI preview http://localhost:5173/__dev__/ui-preview
npm run build        # → dist/
npm run zip          # extension zip
```

**Load in Chrome (recommended)**

```bash
npm run install:chrome    # or npm run install:edge
```

Manual: `npm run build` → `chrome://extensions` → Developer mode → Load unpacked `dist/`.

<details>
<summary>install:chrome flags</summary>

| Flag                    | Description                               |
| ----------------------- | ----------------------------------------- |
| `--build`               | Force rebuild before launch               |
| `--browser=edge`        | Use Edge                                  |
| `--use-default-profile` | System Chrome profile (quit Chrome first) |

Default uses isolated profile `.chrome-dev-profile/` to avoid conflicting with a running Chrome instance.

</details>

**Stack**: Manifest V3 · Vite 6 · React 18 · TypeScript · Tailwind CSS v4 · Shadow DOM injection

---

## FAQ

**Q: What’s in the context menu?**  
A: **Add to reference** (collect first) and **Extract prompt directly**. Use “Add to reference” when composing multiple images.

**Q: “Failed to download image” on some sites?**  
A: Hotlink / Referer protection. Open the image in a new tab and try again.

**Q: Twitter / X GIFs don’t work?**  
A: They are `<video>` elements—right-click **on the video**. Use **Ctrl+Shift+E** if the site hijacks the menu.

**Q: Can’t capture video frames?**  
A: Cross-origin videos without `crossorigin="anonymous"` taint the canvas. Pause on the desired frame, or use region snip.

**Q: “Enhanced Safe Browsing doesn’t trust this extension”?**  
A: Common for newer developers when [Enhanced protection](https://support.google.com/chrome/answer/9890866) is on—it [does not mean the extension is malicious](https://support.google.com/chrome_webstore/answer/2664769). You can still **Continue to install**.

More: [store listing (EN)](store-listing/description.en.md).

---

## More docs

- [Maintainer & store publishing (ZH)](docs/MAINTAINER.zh.md)
- [Chrome Web Store CI](docs/CHROME_WEB_STORE_CI.md)
- [Extension UI overview (ZH)](docs/plugin-pages-overview.zh.md)
- [Privacy Policy](PRIVACY.md)

---

## License

This repository is proprietary (All rights reserved). See [LICENSE](LICENSE). End users should install the official build from the [Chrome Web Store](https://github.com/xiaotao-02/prompt-hub/releases).
