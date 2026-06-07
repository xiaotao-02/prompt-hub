# Stitch「以您的设计为基础」— DESIGN.md 使用说明

本仓库为 [Google Stitch](https://stitch.withgoogle.com) 的「以您的设计为基础」功能维护两份 [DESIGN.md](https://github.com/google-labs-code/design.md)（alpha）设计令牌文件，以及全量 UI 结构文档 [`docs/stitch-redesign/`](stitch-redesign/README.md)（屏幕清单、交互连线、分批 prompt）。

视觉方向（Stitch 重设计）：**现代极简 SaaS + 靛蓝 `#5B5BD6` + 亮色为主**（见两份 DESIGN.md）。运行时代码尚未切换，DESIGN.md 仅约束 Stitch 生成。

## 用哪一份？

| 你要生成的 UI                      | 粘贴/上传的文件                                  | 勿混用                     |
| ---------------------------------- | ------------------------------------------------ | -------------------------- |
| 官网营销页、`/features`、`/docs`   | [`website/DESIGN.md`](../website/DESIGN.md)      | 不要用根目录 `DESIGN.md`   |
| 运营后台 `/admin`                  | 同上 [`website/DESIGN.md`](../website/DESIGN.md) | 后台与官网共用官网 L1 令牌 |
| 扩展 popup、options、浮动面板 mock | 根目录 [`DESIGN.md`](../DESIGN.md)               | 不要用 `website/DESIGN.md` |

**一次 Stitch 会话只贴一份文件。** 插件与官网/后台是两套 L1 令牌，混贴会导致风格漂移。详见 [`docs/ui-component-system.zh.md`](ui-component-system.zh.md)。

**全量重设计流程**（所有页面、状态、Prototypes 连线）见 [`docs/stitch-redesign/README.md`](stitch-redesign/README.md)。

## 在 Stitch 中操作

1. 打开 Stitch 项目 →「以您的设计为基础」
2. 按上表选择对应 `DESIGN.md`
3. 使用「在此处粘贴 DESIGN.md」或「上传 DESIGN.md 文件」
4. 按 [`docs/stitch-redesign/03-stitch-prompts.md`](stitch-redesign/03-stitch-prompts.md) 粘贴分批 prompt，或说明表面类型（例如「生成 popup 历史列表」）
5. 用 [`02-interaction-map.md`](stitch-redesign/02-interaction-map.md) 在 Stitch Prototypes 中连线并 Play 验证

## 维护与校验

- 插件令牌源：[`src/lib/uiTokens.ts`](../src/lib/uiTokens.ts) + [`src/styles/globals.css`](../src/styles/globals.css)
- 官网令牌源：[`website/app/globals.css`](../website/app/globals.css)
- 改色后同步更新对应 `DESIGN.md`，并运行：

```powershell
npx "@google/design.md" lint website/DESIGN.md
npx "@google/design.md" lint DESIGN.md
```

修复全部 `broken-ref` 错误；按 lint 的 `contrast-ratio` 建议调整组件 `textColor`（正文不用强调色）。

## 产物范围

这两份文件**仅**约束 Stitch 生成，不自动改动扩展或官网的运行时代码。若要将新视觉落地到 `globals.css` / 组件，需另开实现 PR。
