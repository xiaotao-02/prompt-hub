The slow part of AI art is rarely the final generation—it is turning a reference into a prompt you can reuse, in the right shape for your toolchain. Prompt Hub works where you already browse: when a pose, lighting, or composition catches your eye, right-click to add it to the floating reference panel—or skip collection and extract directly. Results land in an on-page panel in seconds, ready to copy into Stable Diffusion, Midjourney, Flux, and similar tools.

You configure your own vision-model API key and endpoint in Options; there is no developer-operated backend that receives your images or secrets (details under Privacy & data flow). After setup, refine prompts via chat, switch strategy tiers, and browse version history; large-image editing and AI adjustments are also available in the Options → Prompt Library tab.

Supported inputs span PNG / JPEG, animated GIF / APNG / animated WebP, and the faux-GIF <video> players common on Twitter, Reddit, and Discord; canvases, inline SVG, and CSS background images are covered too. When a site hijacks the context menu, use Ctrl+Shift+E to snip a region, or the popup’s region-capture button as a fallback.

━━━━━━━━━━━━━━━━━━━━━━
✦ Key features
━━━━━━━━━━━━━━━━━━━━━━

▸ Right-click & hotkeys
• Works on <img>, <video>, <canvas>, inline <svg>, and CSS background images
• Menu items: “Add to reference” (collect then compose) or “Extract prompt directly” (skip collection)
• Ctrl+Shift+E (Mac: Command+Shift+E) to drag-select a rectangle and add it to references
• Region capture is also available from the toolbar popup; blank-page context menu offers “Capture region to reference”

▸ Reference panel & multi-image compose
• Collect up to 8 reference images and synthesize them into one prompt
• “Generate prompt” for full extraction; “Extract material / Extract style” for narrower dimensions
• For videos, sample frames across a time range to produce storyboard-style prompts

▸ First-class GIF & video support
• GIF / APNG / animated WebP are automatically flattened to a static first frame before being sent
• <video> elements (including the mp4-as-fake-GIF used by Twitter / Reddit / Discord) are captured to a JPEG of the currently visible frame
• Canvas, inline SVG, CSS background-image / mask-image are also recognized

▸ Output styles & extraction strategies
• Four output styles: natural Chinese / English paragraph, Stable Diffusion tags, Midjourney
• Multiple strategy tiers: Classic, v0.2.2, v0.3.0, v0.3.5, v0.3.6 General High-Fidelity (default), Native, Custom combo
• Native: image goes straight to the VLM with minimal instructions; output-style presets do not apply
• Custom combo: mix instruction-set / sampling / join components for experiments

▸ Edit, AI refine & history
• Edit prompts inline in the floating panel; every change is auto-saved as a new version, restore any previous one
• Conversational refine: tell the model “make it more cinematic / translate to English / add 8k masterpiece”—it rewrites the existing prompt and saves a new version
• Options → Prompt Library: large-image editing, folder management, AI refine, and version browsing
• Local history: view, copy, and delete the last 100 results from the toolbar popup

▸ Model setup (Options)
• OpenAI Chat Completions–compatible vision endpoints
• Custom Base URL (self-hosted or compatible gateway)
• Paste-to-import API keys in Options; recognizes curl snippets and config blobs

▸ Config & sync
• API keys stored only in chrome.storage; preferences sync encrypted across your Chrome devices via storage.sync
• Options → Check for updates: manually compare against GitHub Releases

━━━━━━━━━━━━━━━━━━━━━━
✦ Quick start
━━━━━━━━━━━━━━━━━━━━━━

1. Click the toolbar icon → ⚙ to open Options
2. Enter your API key and vision-model endpoint
3. Right-click any image → “Add to reference” (or “Extract prompt directly” to skip collection)
   Click “Generate prompt” in the floating panel, wait a few seconds, then copy; switch strategies, refine via chat, or “Regenerate” as needed

━━━━━━━━━━━━━━━━━━━━━━
✦ Privacy & data flow (please read)
━━━━━━━━━━━━━━━━━━━━━━

✓ No backend server is operated by the developer. No telemetry, no analytics, no tracking.
✓ Your API key is stored only in chrome.storage and (optionally) synced encrypted across your own Chrome devices via Chrome Sync.
✓ The image you right-click is sent only when you click the menu item, and only to the vision-model endpoint you configured in Options.
✓ Full privacy policy: https://github.com/xiaotao-02/prompt-hub/blob/main/PRIVACY.md

━━━━━━━━━━━━━━━━━━━━━━
✦ Install & updates
━━━━━━━━━━━━━━━━━━━━━━

Official builds are distributed via the Chrome Web Store:
https://chromewebstore.google.com/detail/prompt-hub/oaanodmbndnpeohmfoedgmfleabhdmkg

━━━━━━━━━━━━━━━━━━━━━━
✦ FAQ
━━━━━━━━━━━━━━━━━━━━━━

Q: Why did the context menu change?
A: It now offers “Add to reference” (collect first, generate in the panel) and “Extract prompt directly” (skip collection). Use “Add to reference” when you need multi-image compose.

Q: Some images fail with “image download failed”. Why?
A: A handful of sites enforce Referer-based hot-link protection. Right-click → “Open image in new tab”, then re-extract.

Q: My image is too big.
A: There is an 8 MB cap. GIF / video frames are auto-resized to a max edge of 1280–1536 px before sending.

Q: Twitter / X GIFs don’t trigger the menu.
A: Those “GIFs” are actually <video> elements. Right-click directly on the video; menu items are “Add to reference” or “Extract prompt directly”.

Q: Video frame capture fails.
A: Some cross-origin videos lack crossorigin="anonymous", so the canvas is tainted and cannot export a frame. Pause on the desired frame and retry, or use region capture instead.

Q: My model cannot see the image.
A: Choose a vision model that accepts image input; plain text-only chat endpoints cannot perform vision extraction.

Q: The model errors or says it cannot see the image.
A: Choose a multimodal vision model that supports image_url. Do not use text-only models for vision extraction.

Q: Chrome shows “This extension is not trusted by Enhanced Safe Browsing”?
A: With Chrome’s Enhanced Safe Browsing enabled, Chrome may warn for extensions whose publisher has not yet been classified as trusted (see Google Help: https://support.google.com/chrome_webstore/answer/2664769). This does not mean the extension is malicious—choose “Continue to install” if you want to proceed.
