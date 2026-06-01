# Privacy Policy / 隐私政策

> 适用产品 / Applies to: **Prompt Hub** Chrome 浏览器扩展（GitHub 开源 BYOK 构建）
> 联系方式 / Contact: xiaotao666.1@gmail.com

---

## 中文版

### 一、我们是谁

Prompt Hub 是一款开源 Chrome 浏览器扩展（BYOK 构建），源代码发布在
[GitHub](https://github.com/xiaotao-02/prompt-hub)。
本构建**不包含**开发者运营的平台代调用网关；您需自备视觉模型 API Key。

### 二、我们处理哪些数据

| 数据类别 | 是否收集 | 处理目的 | 存储位置 | 是否离开你的设备 |
|---|---|---|---|---|
| 模型 API Key | 是（可选） | 直连您选择的供应商 | `chrome.storage.sync` | 仅发往您选择的供应商 |
| 图片 / 视频帧 / 区域截图 | 是 | 作为视觉模型输入 | 内存临时 | 仅发往您配置的供应商 |
| 提示词与历史 | 是 | 展示与版本回溯 | `chrome.storage.local` | 否 |
| 偏好设置 | 是 | 体验持久化 | `chrome.storage.sync` | 仅同 Google 账号浏览器间同步 |
| 遥测 / 埋点 | **否** | — | — | — |

### 三、数据流向

```
你的浏览器 → HTTPS 直连 → 你在设置中选择的模型供应商
```

扩展开发者**收不到** Key、图片或提示词。

### 四、联系我们

xiaotao666.1@gmail.com 或 GitHub Issues。

---

## English

Open-source BYOK build only. API keys and media are sent **directly** to the vision provider you configure. No developer-operated proxy. Contact: xiaotao666.1@gmail.com
