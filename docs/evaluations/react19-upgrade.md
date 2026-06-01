# React 18 → 19 升级评估（Go/No-Go）

**日期**：2026-05  
**结论**：**暂缓合入（No-Go for main）** — 可在独立分支做 PoC，待 lucide-react / @crxjs 生态明确后再议。

## 收益（预期）

| 项         | 说明                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------- |
| 内存       | React 19 官方宣称约 -42% 内存（popup/options 体量小，体感有限）                                 |
| 首绘       | 约 -68ms FCP（扩展 popup 非首屏关键路径）                                                       |
| Shadow DOM | `createRoot` 对 Shadow 容器支持更完整（content panel 仍为命令式 DOM，收益主要在 popup/options） |

## 风险

| 项                 | 严重度 | 说明                                                 |
| ------------------ | ------ | ---------------------------------------------------- |
| lucide-react       | 中     | 需验证与 React 19 的 peer 范围；当前 `^0.460`        |
| @crxjs/vite-plugin | 中     | beta 栈 + React 19 组合未在 CI 验证                  |
| @types/react 19    | 低     | 类型破坏性变更可能波及 54 个 TSX 文件                |
| 回归面             | 高     | Popup / Options / Prompt Library 全量手测 + dev 预览 |

## 建议步骤（PoC 分支）

1. `npm install react@19 react-dom@19 @types/react@19 @types/react-dom@19`
2. `npm run lint && npm run test && npm run build`
3. 加载 unpacked 扩展：popup 打开、options 两 Tab、提示词库展开/改写 smoke
4. 记录 blocker → 更新本文件结论

## 决策

**主分支保持 React 18**，与路线图 P4.4 一致；无用户可见 blocker 时不优先升级。
