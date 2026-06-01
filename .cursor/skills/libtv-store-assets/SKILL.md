---
name: libtv-store-assets
description: >-
  用 LibTV CLI（lib-image-2）为本仓库生成 Chrome Web Store 宣传图与截图（5 截图 + 2 宣传图）。
  当用户提到重新生成商店素材、LibTV 商店图、store:libtv、换商店风格、更新截图/宣传图时使用。
  与 Playwright 精确方案（store:assets / store:screenshots）并存；换 logo 后需同步 logo-ref。
---

# LibTV Chrome Web Store 商店素材

## 快速命令

```powershell
# 全部 7 张（并行 pipeline，出图即落盘）
npm run store:libtv

# 仅重生成指定节点
npm run store:libtv -- --only promo-marquee,shot-2-reference

# 仅验收尺寸（不调用 LibTV）
npm run store:libtv:validate

# 只下载 LibTV 画布已有图（不重新 --run）
$env:STORE_LIBTV_SKIP_RUN = "1"
$env:STORE_LIBTV_REQUIRE_FRESH = "0"
npm run store:libtv
```

## 何时用本 Skill

| 场景                           | 方案                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------- |
| 项目功能更新，换一版 AI 视觉稿 | **本 Skill** → 改 prompt → `store:libtv`                                        |
| 换 logo / 品牌色               | 先 [`logo-replacement.mdc`](../../rules/logo-replacement.mdc)，再 `store:libtv` |
| 中文小字必须精确、1:1 UI       | `npm run store:assets` + `store:screenshots`（Playwright）                      |
| 单张不满意                     | 改对应 prompt + `--only <node>`                                                 |

## 新版功能 → 新素材：标准工作流

```
1. 调研功能  → 2. 更新 brand + prompts  → 3. 生成  → 4. 验收  → 5. 上传 CHECKLIST
```

### Step 1：调研（Agent 必读）

1. `store-listing/summary.zh.txt`、`description.zh.md` — 官方卖点文案
2. `README.md` — 最新特性
3. 关键 UI：`src/popup/`、`src/options/`、`src/content/panel/` — 截图 mock 依据
4. `public/icons/icon-128.png` — logo-ref 来源（换 logo 规则见 `.cursor/rules/logo-replacement.mdc`）

### Step 2：更新配置

| 文件                                                                       | 作用                                                                |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`store-assets/libtv/brand.json`](../../store-assets/libtv/brand.json)     | 品牌色、视觉风格、safe-area、tone                                   |
| [`store-assets/libtv/prompts.json`](../../store-assets/libtv/prompts.json) | 7 条 task：`node` / `ratio` / `out` / `width` / `height` / `prompt` |
| [prompt-guide.md](prompt-guide.md)                                         | Prompt 模板、七张分工、风格变体                                     |

**改写 prompt 原则：**

- 保持 `node`、`out`、像素、`ratio` 不变
- 每条 prompt 末尾含 safe-area 句（见 `brand.json`）
- 视觉优先、少文字（`promptTone`）
- 7 张风格统一

### Step 3：生成

**前置：** `libtv account info` 成功；否则 `libtv login web`（安装见 [libtv-cli/SKILL.md](../libtv-cli/SKILL.md)）。

```powershell
npm run store:libtv
```

**Pipeline 行为（[`scripts/generate-store-assets-libtv.ts`](../../scripts/generate-store-assets-libtv.ts)）：**

1. **Setup** — 登录 / 项目绑定 / `group unuse` / logo-ref
2. **Upsert** — 更新 7 个 LibTV 节点（`node-keys.json` 持久化 UUID）
3. **Parallel pipeline** — 每路独立：`--run` → 等待 → 下载 → sharp 缩放 → **立即输出 PNG**
4. **Validate** — 自动跑尺寸验收

**超时策略（单任务）：**

- 3 分钟无返图 → 停止等待，重新 `--run`（最多 2 次尝试）
- 仍无返图 → **跳过该节点**，继续其余任务（不阻塞整体）
- 可调：`STORE_LIBTV_TASK_TIMEOUT_MS`（默认 180000）、`STORE_LIBTV_TASK_MAX_ATTEMPTS`（默认 2）

### Step 4：验收

```powershell
npm run store:libtv:validate
```

| 检查项       | 路径                                               | Git      |
| ------------ | -------------------------------------------------- | -------- |
| 原图（完整） | `store-assets/libtv/raw/<node>/`                   | 不入仓   |
| LibTV 配置   | `store-assets/libtv/prompts.json`、`brand.json`    | **入仓** |
| 商店稿       | `store-assets/promo/`、`store-assets/screenshots/` | **入仓** |
| 本地绑定     | `store-assets/libtv/.libtv/`                       | 不入仓   |

确认：尺寸精确、文字可读、风格一致、contain 模式下无关键内容丢失（允许黑边）。

### Step 5：上传

按 [`store-listing/CHECKLIST.md`](../../store-listing/CHECKLIST.md) §4.1 顺序上传。Icon 128×128 用 `dist/icons/icon-128.png`，不走 LibTV。

## README 配图（仓库文档）

| 节点                  | 输出                                  | 说明                                                       |
| --------------------- | ------------------------------------- | ---------------------------------------------------------- |
| `readme-context-menu` | `docs/images/readme/context-menu.png` | README 右键菜单示意（`storeAsset: false`，不参与商店验收） |

```powershell
npm run store:libtv -- --only readme-context-menu
npm run docs:readme-images
```

`docs:readme-images` 从 `store-assets/promo`、`screenshots` 与上述节点生成 `docs/images/readme/` 内 README 用图。

## 输出规格

| 类型         | 文件                                  | 像素     | LibTV ratio |
| ------------ | ------------------------------------- | -------- | ----------- |
| 小型宣传图块 | `promo/small-promo-440x280.png`       | 440×280  | `3:2`       |
| 顶部宣传图块 | `promo/marquee-1400x560.png`          | 1400×560 | `21:9`      |
| 截图 1–5     | `screenshots/screenshot-{1..5}-*.png` | 1280×800 | `16:9`      |

后处理：sharp `fit: contain` + 黑底（`STORE_LIBTV_CROP=cover` 可改居中裁切）。

## 环境变量

| 变量                            | 默认                             | 说明                   |
| ------------------------------- | -------------------------------- | ---------------------- |
| `STORE_LIBTV_TASK_TIMEOUT_MS`   | `180000`                         | 单次等待返图（3 分钟） |
| `STORE_LIBTV_TASK_MAX_ATTEMPTS` | `2`                              | 超时重试次数           |
| `STORE_LIBTV_CROP`              | `contain`                        | `cover` = 居中裁切     |
| `STORE_LIBTV_SKIP_RUN`          | —                                | `1` = 跳过 `--run`     |
| `STORE_LIBTV_REQUIRE_FRESH`     | `1`                              | `0` = 有旧图即下载     |
| `LIBTV_EXE`                     | `%USERPROFILE%\.libtv\libtv.exe` | 自定义 CLI 路径        |

## LibTV 画布约定

- 工作目录：`store-assets/libtv/`（project scope，`group unuse`）
- 项目名：`PromptHubStore`（无空格）
- 绑定：`.libtv/project.json`、`.libtv/node-keys.json`（不入 git）
- 参考图：`logo-ref` ← `public/icons/icon-128.png`
- **不要用** `libtv group --run`（串行，非并行）

## Agent 执行清单

换版重生商店素材时，按序打勾：

```
- [ ] 读 summary/description/README + 关键 UI 代码
- [ ] 更新 brand.json（若换风格/配色）
- [ ] 更新 prompts.json 全部 7 条（或 --only 指定节点）
- [ ] 确认 logo 为最新（若刚换图标）
- [ ] libtv account info 已登录
- [ ] npm run store:libtv
- [ ] npm run store:libtv:validate 通过
- [ ] 目视检查 raw/ vs 输出，中文可读
- [ ] 告知用户 CHECKLIST §4.1 上传路径
```

## 延伸阅读

- Prompt 模板与风格变体：[prompt-guide.md](prompt-guide.md)
- LibTV CLI 安装/登录：[libtv-cli/SKILL.md](../libtv-cli/SKILL.md)
- Playwright 精确 UI 方案：README §商店素材
