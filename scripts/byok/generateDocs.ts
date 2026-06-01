import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OPEN_REPO_HOMEPAGE } from './config.js';

export function writeOpenRepoDocs(destRoot: string, srcRoot: string): void {
  const pkg = JSON.parse(readFileSync(join(destRoot, 'package.json'), 'utf-8')) as {
    version?: string;
  };
  const version = pkg.version ?? '0.0.0';

  writeFileSync(join(destRoot, 'README.open.snippet.md'), buildReadmeSnippet(version), 'utf-8');
  writeFileSync(join(destRoot, 'PRIVACY.md'), buildByokPrivacy(), 'utf-8');
  writeFileSync(join(destRoot, 'SECURITY.md'), buildByokSecurity(), 'utf-8');
  writeFileSync(
    join(destRoot, 'docs/OPEN_SOURCE_SECURITY.zh.md'),
    buildOpenSourceSecurity(),
    'utf-8',
  );
  writeFileSync(join(destRoot, 'docs/GITHUB_MIGRATION.zh.md'), buildGithubMigration(), 'utf-8');

  // 若根 README 仍描述平台模式，追加开源版说明
  const readmePath = join(destRoot, 'README.md');
  try {
    let readme = readFileSync(readmePath, 'utf-8');
    if (!readme.includes('## 开源 BYOK 版说明')) {
      readme = `${readme}\n\n${buildReadmeSnippet(version)}\n`;
      writeFileSync(readmePath, readme, 'utf-8');
    }
  } catch {
    writeFileSync(readmePath, `# Prompt Hub\n\n${buildReadmeSnippet(version)}\n`, 'utf-8');
  }

  // 私有仓 MAINTAINER 不覆盖；公开仓写精简版
  writeFileSync(join(destRoot, 'docs/MAINTAINER.zh.md'), buildMaintainerOpen(srcRoot), 'utf-8');
}

function buildReadmeSnippet(version: string): string {
  return `## 开源 BYOK 版说明

本仓库为 **自备 API Key（BYOK）** 开源构建，不含平台代调用、官网登录或充值功能。请在扩展「设置 → 模型与连接」中填写您自己的视觉模型 API Key。

- 安装：从 [GitHub Releases](${OPEN_REPO_HOMEPAGE}/releases) 下载 \`prompt-hub-v${version}.zip\`，在 \`chrome://extensions\` 开启开发者模式后「加载已解压的扩展程序」
- Chrome Web Store 上的官方版本可能包含额外商业化能力，**与 GitHub 开源构建不同**
- 隐私政策：见 [PRIVACY.md](PRIVACY.md)`;
}

function buildByokPrivacy(): string {
  return `# Privacy Policy / 隐私政策

> 适用产品 / Applies to: **Prompt Hub** Chrome 浏览器扩展（GitHub 开源 BYOK 构建）
> 联系方式 / Contact: xiaotao666.1@gmail.com

---

## 中文版

### 一、我们是谁

Prompt Hub 是一款开源 Chrome 浏览器扩展（BYOK 构建），源代码发布在
[GitHub](${OPEN_REPO_HOMEPAGE})。
本构建**不包含**开发者运营的平台代调用网关；您需自备视觉模型 API Key。

### 二、我们处理哪些数据

| 数据类别 | 是否收集 | 处理目的 | 存储位置 | 是否离开你的设备 |
|---|---|---|---|---|
| 模型 API Key | 是（可选） | 直连您选择的供应商 | \`chrome.storage.sync\` | 仅发往您选择的供应商 |
| 图片 / 视频帧 / 区域截图 | 是 | 作为视觉模型输入 | 内存临时 | 仅发往您配置的供应商 |
| 提示词与历史 | 是 | 展示与版本回溯 | \`chrome.storage.local\` | 否 |
| 偏好设置 | 是 | 体验持久化 | \`chrome.storage.sync\` | 仅同 Google 账号浏览器间同步 |
| 遥测 / 埋点 | **否** | — | — | — |

### 三、数据流向

\`\`\`
你的浏览器 → HTTPS 直连 → 你在设置中选择的模型供应商
\`\`\`

扩展开发者**收不到** Key、图片或提示词。

### 四、联系我们

xiaotao666.1@gmail.com 或 GitHub Issues。

---

## English

Open-source BYOK build only. API keys and media are sent **directly** to the vision provider you configure. No developer-operated proxy. Contact: xiaotao666.1@gmail.com
`;
}

function buildByokSecurity(): string {
  return `# Security Policy

Report vulnerabilities privately to **xiaotao666.1@gmail.com**.

**Do not** paste API keys in public issues.

This open-source repository contains the **BYOK extension only** (no platform API secrets).

See [docs/OPEN_SOURCE_SECURITY.zh.md](docs/OPEN_SOURCE_SECURITY.zh.md).
`;
}

function buildOpenSourceSecurity(): string {
  return `# 开源扩展安全指南（BYOK 构建）

本仓库**仅含 Chrome 扩展**，不含 \`services/api\` 或 \`website\`。

## 勿提交

- 个人 \`.env\`（本扩展通常不需要服务端 env）
- 真实 API Key、JWT、支付私钥

## 与商业版关系

| 构建 | 来源 | 能力 |
|------|------|------|
| **GitHub 开源 BYOK** | 本公开仓 | 仅自备 API Key |
| **Chrome Web Store 官方版** | 私有 monorepo | 可含平台代调用 / 官网登录 |

维护者在私有仓运行 \`npm run export:byok\` 生成本公开仓内容；**请勿在公开仓直接改扩展逻辑**，应改私有仓后重新 export。

## CI

- \`ci.yml\` — lint / test / build / knip
- \`gitleaks.yml\` — 密钥扫描
- \`auto-release.yml\` — GitHub Release zip

不含 \`publish-chrome-store.yml\`（商店发版在私有仓）。
`;
}

function buildGithubMigration(): string {
  return `# GitHub 双仓迁移指南（维护者）

## 目标

| 仓库 | 可见性 | 内容 |
|------|--------|------|
| \`prompt-hub-commercial\`（原仓改名） | **Private** | 扩展 + platform + \`services/api\` + \`website\` + CWS CI |
| \`prompt-hub\` | **Public** | \`npm run export:byok\` 输出的 BYOK 扩展 |

## 步骤

1. 在私有仓开发并合并到 \`main\`
2. 运行 \`npm run export:byok -- --out ../prompt-hub-open\`
3. 在输出目录 \`npm ci && npm run lint && npm run test && npm run build\`
4. GitHub Settings → 当前仓 **Rename** 为 \`prompt-hub-commercial\` → **Private**
5. 新建公开仓 \`prompt-hub\`，push export 结果
6. 确认私有仓 \`.github/workflows/publish-chrome-store.yml\` 仍可发商店版

## 注意

- 公开 fork 在私有化后会失效；在公开仓 README 说明迁移
- 商店隐私 URL 可继续指向官网（商业版含平台披露）；开源 BYOK 用本仓 \`PRIVACY.md\`
`;
}

function buildMaintainerOpen(_srcRoot: string): string {
  return `# 维护者指南（开源 BYOK 仓）

## 发版

\`\`\`bash
npm run lint && npm run test && npm run build
npm run zip
# GitHub Actions auto-release 会在 push main 时打 tag 并上传 zip
\`\`\`

## 同步源码

本仓由私有 monorepo **export 生成**，请勿在此直接开发 platform 相关功能。

私有仓命令：

\`\`\`bash
npm run export:byok -- --out ../prompt-hub-open
\`\`\`

详见 [GITHUB_MIGRATION.zh.md](GITHUB_MIGRATION.zh.md)。
`;
}
