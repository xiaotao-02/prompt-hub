---
version: alpha
name: Prompt Hub — Browser Extension
description: Compact modern SaaS visual identity for Chrome extension popup, options, and content panel (Linear/Vercel-inspired).
colors:
  primary: '#5B5BD6'
  primary-hover: '#4F4FC4'
  primary-soft: '#EEF0FB'
  on-primary: '#FFFFFF'
  background: '#FFFFFF'
  background-elevated: '#FFFFFF'
  background-muted: '#F4F4F5'
  border: '#E4E4E7'
  border-strong: '#D4D4D8'
  text: '#18181B'
  text-muted: '#52525B'
  text-subtle: '#71717A'
  error: '#E5484D'
  success: '#30A46C'
  warning: '#F5A623'
  dark-background: '#09090B'
  dark-background-elevated: '#18181B'
  dark-background-muted: '#27272A'
  dark-border: '#27272A'
  dark-border-strong: '#3F3F46'
  dark-text: '#F4F4F5'
  dark-text-muted: '#D4D4D8'
  dark-text-subtle: '#A1A1AA'
  dark-primary: '#7C7CF0'
  dark-primary-hover: '#9B9BF5'
  dark-primary-soft: 'rgba(91, 91, 214, 0.16)'
typography:
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.3
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.2
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.2
  mono-sm:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: 6px
  md: 8px
  lg: 10px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  popup-width: 360px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.md}'
    padding: 8px
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.md}'
    padding: 8px
  button-secondary:
    backgroundColor: '{colors.background-elevated}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: 8px
  button-ghost:
    backgroundColor: transparent
    textColor: '{colors.text-muted}'
    rounded: '{rounded.sm}'
    padding: 6px
  button-icon:
    backgroundColor: transparent
    textColor: '{colors.text-muted}'
    rounded: '{rounded.sm}'
    padding: 6px
    size: 32px
  field-input:
    backgroundColor: '{colors.background-elevated}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: 10px
  field-label:
    typography: '{typography.label-md}'
    textColor: '{colors.text-muted}'
  card:
    backgroundColor: '{colors.background-elevated}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: 12px
  segmented-control:
    backgroundColor: '{colors.background-muted}'
    textColor: '{colors.text-muted}'
    rounded: '{rounded.md}'
    padding: 4px
  segmented-control-active:
    backgroundColor: '{colors.background-elevated}'
    textColor: '{colors.text}'
    rounded: '{rounded.sm}'
    padding: 6px
  dropdown-menu:
    backgroundColor: '{colors.background-elevated}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: 4px
  chip:
    backgroundColor: '{colors.background-muted}'
    textColor: '{colors.text-muted}'
    rounded: '{rounded.sm}'
    padding: 4px
  toolbar:
    backgroundColor: '{colors.background-elevated}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: 8px
  panel-select:
    backgroundColor: '{colors.background-elevated}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: 8px
  anchored-menu:
    backgroundColor: '{colors.background-elevated}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: 4px
  input-prompt:
    backgroundColor: '{colors.background-elevated}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: 12px
  banner-warning:
    backgroundColor: '{colors.background-muted}'
    textColor: '{colors.warning}'
    rounded: '{rounded.md}'
    padding: 8px
  banner-danger:
    backgroundColor: '{colors.background-muted}'
    textColor: '{colors.error}'
    rounded: '{rounded.md}'
    padding: 8px
  progress-bar:
    backgroundColor: '{colors.background-muted}'
    textColor: '{colors.primary}'
    rounded: '{rounded.sm}'
    padding: 2px
---

## Overview

Prompt Hub **Chrome 扩展**包含三个 UI 表面，共用本 DESIGN.md，但实现技术不同：

- **Popup**（~360px 宽工具栏弹窗）：历史、快捷操作、版本预览。
- **Options**（全页设置与提示词库）：多 Tab、表单密集、列表与折叠面板。
- **Content Panel**（注入页面的 Shadow DOM 浮动面板）：反推/洗稿主战场，窄侧栏式布局，与宿主页面并存。

视觉方向与官网一致：**现代极简 SaaS**（Linear/Vercel）——亮色默认、zinc 中性灰、单一靛蓝 `#5B5BD6` 作强调。扩展场景更强调**紧凑、低噪声、功能优先**：小字号、紧间距、少装饰动画。系统跟随 `prefers-color-scheme` 提供暗色变体（见 Colors 深色对照）。

面板（Shadow DOM）无法直接使用 Tailwind 组件，但色值、圆角、字号须与本文件令牌语义对齐。

## Colors

**亮色（默认）**

- **Primary (#5B5BD6)**：主操作（反推、保存、确认）——每视图一个主 CTA。
- **Primary hover (#4F4FC4)**：按钮悬停。
- **Primary soft (#EEF0FB)**：选中 chip、轻量高亮条。
- **Background / Elevated**：页面底与卡片/输入白底均为 `#FFFFFF`；muted 区 `#F4F4F5`。
- **Border / Border strong**：`#E4E4E7` / `#D4D4D8`。
- **Text / Muted / Subtle**：`#18181B` / `#52525B` / `#71717A`。

**暗色（`prefers-color-scheme: dark`）**

- 背景 `#09090B`，抬升表面 `#18181B`，muted `#27272A`
- 边框 `#27272A` / `#3F3F46`
- 正文 `#F4F4F5`，次要 `#D4D4D8`，辅助 `#A1A1AA`
- 强调 `#7C7CF0`，hover `#9B9BF5`，soft `rgba(91,91,214,0.16)`
- **禁止**紫色脉冲光晕、霓虹描边或大面积渐变底

状态色 error/success/warning 与官网一致，仅用于 toast、badge、校验提示。

## Typography

扩展 UI 字号整体比官网**小一档**，保证 popup 与窄面板可读。

- **Headline md/sm**：Options 页区块标题、面板区块名（18px / 15px）。
- **Body md (13px)**：主编辑区提示词、列表正文；行高 1.6，**非等宽**（提示词用 sans）。
- **Body sm (12px)**：辅助说明、元数据。
- **Label md/sm**：表单标签、筛选 caption（11–12px，medium）。
- **Mono sm**：API 端点、模型 ID、技术 token；仅必要时使用。

字重：单屏最多 **Regular + Semibold** 两档；避免 Bold 堆叠。

## Layout

- **Popup**：宽约 360px；区块间距 12–16px；列表项高度约 40–44px；顶栏 logo + 操作图标一行。
- **Options**：最大内容宽可 fluid；Tab 下表单字段垂直间距 12px；卡片 padding 16px；sticky 顶栏保留 `scrollbar-gutter: stable` 防抖动。
- **Content Panel**：浮动卡片 max-width 适中；工具栏横排图标；主编辑区 padding 12–14px；策略/模型下拉锚定面板内，不溢出视口。
- **间距**：以 4/8/12/16 为主；避免 24px 以上大块留白（扩展屏高度有限）。

## Elevation & Depth

扩展内层级极简：

- 默认：1px border，阴影 `0 1px 2px rgba(15,23,42,0.05)` 或无色。
- 浮层（下拉、AnchoredMenu）：elevated 白底 + border + 轻阴影 `0 12px 34px -18px rgba(15,23,42,0.35)`（暗色等价加深）。
- 不用玻璃大模糊导航；面板 toolbar 可用 95% 不透明底 + 1px 边。
- 折叠动画：约 220ms，`cubic-bezier(0.2, 0.9, 0.3, 1.2)`；尊重 `prefers-reduced-motion`。

## Shapes

- 主圆角 **8px (md)**：按钮、输入、卡片、toolbar。
- 小控件 **6px (sm)**：chip、图标按钮、分段选中项。
- 下拉与面板容器 **8–10px**；全圆仅用于 avatar/状态点。
- 线性图标 16/20px；触控目标最小约 32×32px（图标按钮）。

## Components

### Buttons

- **Primary**：靛蓝底白字，紧凑 padding（约 8px 12px）；面板主操作「反推」「应用」。
- **Secondary**：白底 + border；「取消」「导出」等。
- **Ghost / Icon**：工具栏、列表行内；hover 时 background-muted。
- 禁用：不降低对比到不可读；用 opacity + 禁止 pointer。

### Field（标签 + 输入壳）

- Label：label-md，text-muted，间距底 6px。
- Input：13px body，border，focus ring 靛蓝 40% 透明度；与 `.input-prompt` 主编辑区一致。
- 错误：border-error + body-sm 说明。

### Segmented Control

- 轨道：background-muted，圆角 md，内 padding 4px。
- 选中项：elevated 白底（暗色 `#18181B`），text 色，圆角 sm；无滑动渐变动画。

### Dropdown / Anchored Menu

- 菜单：elevated 底、border、max-height 滚动；项高约 36px；hover background-muted。
- 细滚动条（6px thumb），暗色 track/thumb 与 zinc 一致。

### Chips

- 来源标签、策略标签：muted 底 + muted 字；选中可加 primary-soft 底。

### Cards & Toolbar

- Card：border + sm 阴影，padding 12–16px。
- Toolbar：单行图标 + 可选 segmented；与卡片分离，不叠双层边框。

### Content Panel 特例

- 主提示词编辑区：sans 13px/1.6，非 monospace。
- 版本列表、参考图缩略图：紧凑列表，hover 细边框加深。
- 不使用旧 violet-500 环焦点；统一 primary 色系 focus。

## Do's and Don'ts

- Do 为三表面生成**同一靛蓝强调逻辑**；亮色为默认，暗色跟随系统。
- Do 保持 popup/options 信息密度紧凑；优先列表与表单，少 Hero 式大标题。
- Do 面板内主 CTA 每屏一个；次要操作用 ghost/icon。
- Do 提示词编辑区用 sans 正文字体；mono 仅用于模型 ID 等技术字段。
- Do 尊重 `prefers-reduced-motion`：关闭脉冲、扫光、长过渡。
- Don't 使用 legacy 品牌紫 `#8b5cf6` / `#6d28d9` 或 indigo-violet Tailwind 默认环。
- Don't 在 popup 使用全屏渐变背景或大字号营销排版。
- Don't 混用多种圆角（如 4px 按钮 + 16px 卡片同屏）。
- Don't 给每个按钮都做成 primary；不要堆叠两个以上 filled 按钮。
- Don't 在 Shadow 面板引入与宿主页面冲突的亮色大块；面板应克制、可半透明边栏化。
