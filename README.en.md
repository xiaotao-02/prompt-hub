# Prompt Hub

Collect image and video references as you browse, then use vision models to generate, refine, and organize AI art prompts.

[简体中文](README.md) · **English** · [Download](https://github.com/xiaotao-02/prompt-hub/releases) · [Report an issue](https://github.com/xiaotao-02/prompt-hub/issues)

Prompt Hub is an open-source Chrome extension built on Manifest V3. Right-click to add references, generate prompts in a floating panel on the current page, and copy the results into your creative tools. Save prompts to your library to keep editing, refine them with AI, or restore earlier versions.

This repository provides the **BYOK (Bring Your Own Key) build**. It uses the model services you configure and does not include a hosted model gateway, website login, or top-up and billing features.

## Quick start

### 1. Install the extension

1. Visit [GitHub Releases](https://github.com/xiaotao-02/prompt-hub/releases) and download the `prompt-hub-v*.zip` release asset rather than a source-code archive.
2. Extract it to a folder you intend to keep.
3. Open `chrome://extensions` and enable **Developer mode**.
4. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
5. Pin Prompt Hub to the toolbar for easy access to settings and history.

### 2. Configure a model

Open the extension settings, choose a provider, enter your **API key**, and confirm the **Base URL**. Select an **extraction model** that accepts image input. You can configure a separate model for text refinement.

Built-in provider configurations include OpenAI, Anthropic Claude, Google Gemini, Zhipu GLM, Qwen, SiliconFlow, Moonshot Kimi, Doubao, MiniMax, and OpenRouter. Custom OpenAI-compatible endpoints are also supported. Model availability and API charges depend on the service you use.

### 3. Generate your first prompt

1. Open a webpage with a reference image, right-click it, and choose **Add reference** (`添加参考`).
2. Click **Generate prompt** (`生成提示词`) in the floating panel.
3. Copy the result, edit it, or refine it through conversation.

For a single image, choose **Extract prompt** (`提取提示词`) from the context menu to start immediately. Refresh existing tabs after installing or updating the extension.

## Features

| Feature                   | How it works                                                                                                         |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Reference collection      | Add references from images, videos, Canvas, inline SVG, or CSS backgrounds, or select local images                   |
| Multiple references       | Combine up to 8 reference images to describe subjects, composition, materials, and style                             |
| Region capture            | Select a rectangular area of a webpage when its context menu or media is difficult to access                         |
| Video references          | Choose **Add video reference** (`添加视频参考`), select a time range, and sample frames for storyboard-style prompts |
| Focused extraction        | Choose **Generate prompt**, **Extract material** (`提取材质`), or **Extract style** (`提取风格`)                     |
| Conversational refinement | Adjust results with requests such as "more cinematic," "translate to English," or "emphasize the material"           |
| History and versions      | Edit prompts, save revisions, and restore earlier versions                                                           |
| Prompt library            | Organize prompts into folders and continue editing or refining them with AI                                          |
| Data backup               | Use a local data folder or import and export JSON backups                                                            |

### Output formats and strategies

| Output format               | Description                                        |
| --------------------------- | -------------------------------------------------- |
| Natural language (Chinese)  | Paragraph-style descriptions in Chinese            |
| Natural language (English)  | Paragraph-style descriptions in English            |
| Natural language (Japanese) | Paragraph-style descriptions in Japanese           |
| JSON (English)              | Structured English output for structured workflows |

The default strategy is **v0.3.6 General High-Fidelity**. Classic, v0.2.2, v0.3.0, v0.3.5, Native Recognition, and Custom Combination are also available to adjust extraction instructions and generation behavior.

### Capture shortcuts

| System          | Shortcut          |
| --------------- | ----------------- |
| Windows / Linux | `Ctrl+Shift+E`    |
| macOS           | `Command+Shift+E` |

You can also start region capture from the toolbar popup. If the shortcut does not respond, check or reassign it at `chrome://extensions/shortcuts`.

## Data and privacy

- **Direct model requests**: Images, video frames, screenshots, and related prompts are sent to the model endpoint you configure, without passing through a developer-operated model gateway.
- **Keys and preferences**: API keys and preferences are saved using `chrome.storage.sync` and may sync across devices signed into the same browser account, depending on your browser settings. Keys authenticate model requests to the configured endpoint.
- **Local prompt library**: History and versions are stored in the extension's IndexedDB. Supporting data, such as folders, is stored locally in the browser.
- **Backup and recovery**: Configure a local data folder or export JSON in settings. Back up your data before uninstalling, reinstalling, or migrating.
- **No telemetry or analytics tracking**. See the [Privacy Policy](PRIVACY.md) for details.

## FAQ

### What is the difference between Add reference and Extract prompt?

**Add reference** collects material first, so you can combine multiple images or choose a more focused extraction mode. **Extract prompt** immediately starts extraction from the current image or video frame.

### Why can't my configured model recognize images?

Check that the selected model accepts image input rather than text only. Verify the API key, Base URL, model ID, and available quota. A provider appearing in the list does not mean that all of its models support vision.

### What if an image fails to download or a site blocks the context menu?

Try opening the image in a new tab, or use region capture. Hotlink protection, login requirements, and site scripts can affect access to media.

### What if video or animated-image extraction fails?

Some sites display "GIFs" as videos; right-click the video to add a reference. Cross-origin restrictions can prevent frame capture. If that happens, pause on the desired frame and use region capture. To analyze a video segment, choose **Add video reference**.

### How do I update the extension?

Check for updates in settings and download the new version from [GitHub Releases](https://github.com/xiaotao-02/prompt-hub/releases). To update manually, back up your data, extract the new files over the original installation folder, click the extension's reload button at `chrome://extensions`, and refresh any webpages where you use it.

## Local development

Use **Node.js 22**, matching the repository's CI environment, and npm.

```bash
git clone https://github.com/xiaotao-02/prompt-hub.git
cd prompt-hub
npm ci
npm run dev
```

The development server opens `http://localhost:5173/__dev__/ui-preview` by default. It provides previews of the popup, settings, and floating panel using mock data. Load the extension in a browser to verify context menus, screen capture, and actual model requests.

### Build and load

```bash
npm run build           # Build to dist/
npm run install:chrome  # Launch Chrome with an isolated browser profile
npm run install:edge    # Use Edge
npm run zip             # Build and package to dist-zip/
```

To load manually, enable **Developer mode** at `chrome://extensions`, choose **Load unpacked**, and select `dist/`.

The install scripts use `.chrome-dev-profile/` by default. Run `npm run install:chrome -- --build` to rebuild before launch. To use your default browser profile, quit the browser first and run `npm run install:chrome -- --use-default-profile`.

### Quality checks

```bash
npm run lint
npm run test
npm run build
npm run format:check
```

**Stack**: Manifest V3, Vite 6, React 19, TypeScript, Tailwind CSS v4, and Shadow DOM.

### Directory structure

```text
src/
  background/    Background services, model requests, and message routing
  content/       Page injection, region capture, and floating panel
  popup/         Toolbar popup
  options/       Settings, prompt library, and data management
  lib/           Model adapters, strategies, storage, and shared types
  components/    Shared UI components
  dev/preview/   Development previews and mock data
scripts/         Build, packaging, and maintenance scripts
docs/            Architecture and usage documentation
```

This public repository is exported from a private monorepo. Maintainers should update extension logic in the source repository and re-export it. See the [Maintainer guide (Chinese)](docs/MAINTAINER.zh.md) for the workflow. Submit bug reports and feature requests through [GitHub Issues](https://github.com/xiaotao-02/prompt-hub/issues).

## More documentation

- [Extension UI overview (Chinese)](docs/plugin-pages-overview.zh.md): Popup, settings, panel, and development preview entry points.
- [Architecture map](docs/architecture-map.generated.md): Modules and dependencies.
- [UI component conventions (Chinese)](docs/ui-component-system.zh.md): Shared components and styling rules.
- [Provider streaming (Chinese)](docs/provider-streaming.zh.md): Model responses and compatibility handling.
- [Maintainer guide (Chinese)](docs/MAINTAINER.zh.md): Source synchronization and releases.
- [Privacy Policy](PRIVACY.md) · [Security](SECURITY.md).

## License

This project is licensed under the [MIT License](LICENSE).
