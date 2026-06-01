---
name: React 19 接管 Shadow DOM
overview: 将 content panel 从命令式 `innerHTML` 模板渲染切换为 React 19 + Shadow DOM `createRoot`，同时升级 React 版本。外部 API（`renderPanel`、`closePanel` 等）签名不变，变化全部内聚在 `src/content/panel/` 内。
todos:
  - id: phase0-react19
    content: Phase 0：npm 升级 react/react-dom/@types/react 到 v19，修复类型破坏，lint/test/build 全绿
    status: completed
  - id: phase1-root
    content: Phase 1：index.ts 改用 createRoot，新建 PanelApp.tsx（dangerouslySetInnerHTML 过渡），验证 dev preview 无回归
    status: completed
  - id: phase2-jsx
    content: Phase 2：templates/panelHtml/*.ts → JSX 组件（ComposePanel/LoadingPanel/SuccessPanel/ErrorPanel），事件以 onAction prop 传入
    status: completed
  - id: phase3-events
    content: Phase 3：onClick/onChange 替换 data-action 委托，删除 delegatedClicks.ts 和 delegatedInput.ts
    status: completed
  - id: phase4-effects
    content: Phase 4：ticker/watchdog/autofocus/dirtyChrome/quota → useEffect，删除相关命令式调用
    status: completed
  - id: phase5-cleanup
    content: Phase 5：删除 templates/ 和旧命令式文件，events.ts 缩减到 drag/resize，全量 smoke 验收
    status: completed
isProject: false
---

# React 19 接管 Content Panel Shadow DOM

## 边界约定

React 只接管 `[data-role="panel-surface"]` 容器（当前 `innerHTML` 写入点）。
`.panel` shell、resize handles、`<style>` 标签继续命令式创建，React 树不感知它们。

```
shadow
 └── <style>  (STYLE 字符串，命令式注入，不变)
 └── <div.panel>
      ├── <div[data-role="panel-surface"]>  ← createRoot 挂载点，React 接管
      └── resize-handle × 8  (命令式，不变)
```

## 状态流设计

保留 `renderPanel(state: PanelState)` 外部 API，内部改为：
```ts
// index.ts
reactRoot.render(<PanelApp state={state} />)
```

不在 React 内部 `useReducer` 管状态——状态由外部 `commitPanelEvent + renderPanel` 驱动，React 是纯视图层。
Textarea 等高频输入用 React 本地 state 暂存（避免每次按键重驱 `renderPanel`），失焦/提交时同步到外部。

## 分阶段计划

### Phase 0 — React 19 升级（独立 PR，~0.5 天）
- `npm install react@19 react-dom@19 @types/react@19 @types/react-dom@19`
- 修复 `@types/react` 19.x 的类型 breaking change（主要在 `children: ReactNode` 默认值）
- 验收：`npm run lint && npm run test && npm run build`，popup/options UI smoke 无回归

### Phase 1 — React Root 接入（~1 天）
- **修改** [`src/content/panel/index.ts`](src/content/panel/index.ts)
  - `ensureHost()` 返回后，在 `surface` 上调用 `createRoot(surface)` 并存入模块变量 `reactRoot`
  - `setPanelSurfaceHtml` 改为 `reactRoot.render(<PanelApp state={state} />)`
  - 此时 `PanelApp` 只是一个转发层，内部依然 `dangerouslySetInnerHTML={{ __html: panelHtml(state) }}`（保留现有行为，先跑通 React 接入）
- **新建** `src/content/panel/PanelApp.tsx`（占位组件）
- 关键副作用（autofocus、ticker、quota）先继续命令式调用
- 验收：功能无回归，可通过 dev preview 快速验证

### Phase 2 — Templates → JSX 组件（~3 天）
将 `templates/panelHtml/*.ts` 的 HTML 字符串转为真正的 React 组件：
- `src/content/panel/components/ComposePanel.tsx` ← `compose.ts`
- `src/content/panel/components/LoadingPanel.tsx` ← `loading.ts`
- `src/content/panel/components/SuccessPanel.tsx` ← `success.ts`
- `src/content/panel/components/ErrorPanel.tsx` ← `error.ts`

`PanelApp.tsx` 按 `state.status` 分发渲染：
```tsx
function PanelApp({ state }: { state: PanelState }) {
  if (state.status === 'loading') return <LoadingPanel state={state} />;
  if (state.status === 'error')   return <ErrorPanel state={state} />;
  if (state.status === 'compose') return <ComposePanel state={state} />;
  return <SuccessPanel state={state} />;
}
```

事件处理器此阶段先作为 prop 传入（`onAction: (event: PanelEvent) => void`），内部调 `applyPanelStateAfterEvent`。

### Phase 3 — 事件委托 → React Handlers（~1.5 天）
- JSX 内联 `onClick`、`onChange`，直接调用 `actions/*.ts` 里的业务函数
- 删除 `delegatedClicks.ts`、`delegatedInput.ts`（data-action 字符串路由变得多余）
- Textarea 本地 state：`const [draft, setDraft] = useState(state.draft ?? '')`，`onBlur` 时调 `commitPanelEvent({ type: 'ui.setDraft', draft })`
- `bindEvents` 缩减为只绑 drag/resize（`bindHeaderDrag`、`bindEdgeResize`），通过 `useEffect` + 容器 ref 挂载

### Phase 4 — 副作用 → useEffect（~1 天）
| 原始位置 | 迁移目标 |
|---------|---------|
| `loading.ts` `setInterval` ticker | `useEffect` in `LoadingPanel` |
| `loading.ts` 熔断 watchdog | `useEffect` in `LoadingPanel` |
| `refineSession.ts` refine ticker | `useEffect` in `SuccessPanel` |
| `dirtyChrome.ts` `updateDirtyChromeImmediate` | `useEffect` in `SuccessPanel` |
| `focusPolicy.ts` autofocus `requestAnimationFrame` | `useEffect` in `PanelApp` |
| `quotaBadge.ts` `refreshPanelQuotaBadge` | `useEffect` in `PanelApp` |

### Phase 5 — 清理（~0.5 天）
- 删除 `src/content/panel/templates/`（被 JSX 组件取代）
- 删除 `dirtyChrome.ts`、`loading.ts` 中的 timer 函数（已迁入 useEffect）
- 删除 `delegatedClicks.ts`、`delegatedInput.ts`
- `events.ts` 缩减为纯 drag/resize 绑定（～15 行）
- `npm run lint && npm run test && npm run build`，dev preview + smoke 验收

## 保持不变的文件

- [`src/content/panel/state.ts`](src/content/panel/state.ts) — `PanelState` 类型，JSX props 直接复用
- [`src/content/panel/reducer.ts`](src/content/panel/reducer.ts) — `panelReducer` 逻辑不动
- [`src/content/panel/dispatchPanel.ts`](src/content/panel/dispatchPanel.ts) — `commitPanelEvent`
- [`src/content/panel/actions/`](src/content/panel/actions/) — 业务函数被 JSX handler 直接 import
- [`src/content/panel/styles.ts`](src/content/panel/styles.ts) + `styleSections/` — CSS 字符串，仍命令式注入 Shadow DOM
- [`src/content/panel/geometry.ts`](src/content/panel/geometry.ts), `panelDragResize.ts` — 命令式拖拽，`useEffect` 挂载
- [`src/content/panel/extractStream.ts`](src/content/panel/extractStream.ts), `versionsSync.ts` 等 — 不动

## 外部 API 对比

| 调用点 | Phase 0 前 | Phase 5 后 |
|--------|-----------|-----------|
| `renderPanel(state)` | `innerHTML = panelHtml(state)` | `root.render(<PanelApp state={state} />)` |
| `closePanel()` | `panel.remove()` | 同上（`root.unmount()` + `panel.remove()`） |
| `patchRefineProgress(...)` | DOM patch | `commitPanelEvent + renderPanel`（已是此路径） |
| `content/index.ts` 消费方 | 无变化 | 无变化 |

## 主要风险

- **CSS 类名迁移**：HTML 模板里有大量 `.versions-list`、`.refine-area` 等类，转 JSX 时类名需逐一核对，不能漏
- **`dangerouslySetInnerHTML` 过渡期**：Phase 1 用 dangerouslySetInnerHTML 作为跳板，需在 Phase 2 完成后确认全部清零
- **CSS 注入顺序**：React 渲染是异步的，首帧可能有样式闪烁——解决方案：在 `ensureHost` 时同步注入 `<style>`（已有此逻辑），React 不动 Shadow root 外层
- **模板覆盖率**：`styles/` 目录（有 11 个与 `styleSections/` 同名但未接线的文件）属于遗留副本，Phase 5 清理时一并删除

## 预计总工作量

~1 周（5 个工作日），建议 5 个独立 PR（每 Phase 一个），逐步合并。
