/** Panel CSS section: references */
export const referencesCss = `
.body {
  /* success 状态下 .body 和 .versions-side 并排成为 .panel-row 的两个 flex
     子项。sidebar 收起时宽度为 0，body 占满整个 panel-row；sidebar 展开时
     宽度过渡到 280px，body 通过 flex:1 1 auto + min-width:0 自动收窄，**不再
     被覆盖**，缩略图 / 编辑器 / 按钮全部保留可见与可点击。
     loading/error 状态下 .body 是 panel 的直接子元素，column flex 主轴
     是纵向，flex:1 1 auto 同样让它撑满 panel 剩余高度，行为一致。 */
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  padding: 16px; display: flex; flex-direction: column; gap: 12px;
  overflow-y: auto;
}
/* 仅单列布局（surface 直接子节点 .body：compose/error）。勿用后代选择器命中
   .panel-row > .body，否则横向 flex 下 flex-grow:0 会让主栏宽度收缩、右侧留白。 */
.panel:not(.panel-locked-height) [data-role='panel-surface'] > .body {
  flex: 0 1 auto;
}
.thumb {
  width: 100%; height: 220px; border-radius: var(--pe-radius-lg); overflow: hidden;
  background: var(--pe-bg-muted); display: flex; align-items: center; justify-content: center;
  flex: none;
}
.thumb img { width: 100%; height: 100%; object-fit: contain; }
.ref-thumb-wrap {
  /* 自适应高度：参考图换行时容器随内容增高，超出视口由 .body 纵向滚动 */
  height: auto;
  min-height: 160px;
  padding: 8px;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  overflow: visible;
}
.ref-strip {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  height: auto;
  max-height: none;
  justify-content: center;
  align-items: center;
}
.ref-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 144px;
  height: 144px;
  border-radius: var(--pe-radius);
  overflow: hidden;
  flex: none;
  background: rgba(0,0,0,0.06);
}
.ref-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.ref-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 1;
  width: 22px;
  height: 22px;
  padding: 0;
  line-height: 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: rgba(0,0,0,0.55);
  color: #fff;
  font-size: 15px;
}
.ref-remove:hover {
  background: rgba(220,38,38,0.92);
}
`;
