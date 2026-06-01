# Data usage disclosure (BYOK open-source build)

## What the extension processes

| Data | Collected | Purpose | Storage | Leaves device |
|------|-----------|---------|---------|---------------|
| API keys (optional) | Yes | Direct calls to your chosen provider | `chrome.storage.sync` | Only to configured provider |
| Images / video frames / region captures | Yes | Vision model input | In-memory | Only to configured provider |
| Prompts & history | Yes | UI & version history | `chrome.storage.local` | No |
| Settings | Yes | UX persistence | `chrome.storage.sync` | Synced across Chrome profiles |
| Analytics | **No** | — | — | — |

## Data flow

```
Browser → HTTPS → Vision provider you configure in Settings
```

The extension developer does **not** receive keys, images, or prompts.

## Privacy policy

https://github.com/xiaotao-02/prompt-hub/blob/main/PRIVACY.md
