import { DEFAULT_STRATEGY_ID, STRATEGY_LABELS, type StrategyId } from '@/lib/strategies-meta';

/** 将策略 id 解析为可在 UI 展示的已知档位（未知/已下线 id 回退默认档）。 */
export function resolveStrategyDisplayId(id: StrategyId | undefined): StrategyId {
  if (id && STRATEGY_LABELS[id]) return id;
  return DEFAULT_STRATEGY_ID;
}

/** 下拉 trigger / 列表项使用的展示 label；`undefined` 时回退默认档。 */
export function strategyDisplayLabel(id: StrategyId | undefined): string {
  return STRATEGY_LABELS[resolveStrategyDisplayId(id)];
}

/** loading header badge 用：`undefined` 时不显示，有值时走 display 兜底。 */
export function strategyHeaderLabel(id: StrategyId | undefined): string {
  if (!id) return '';
  return strategyDisplayLabel(id);
}

/** 轻量刷新策略下拉 trigger 文案与菜单 active 态，不重渲整板。 */
export function patchStrategyDropdownSelection(
  root: HTMLElement,
  strategy: StrategyId | undefined,
): void {
  const dropdown = root.querySelector<HTMLElement>('[data-role="strategy-dropdown"]');
  if (!dropdown) return;
  const displayId = resolveStrategyDisplayId(strategy);
  const labelEl = dropdown.querySelector<HTMLElement>('.sd-label');
  if (labelEl) labelEl.textContent = strategyDisplayLabel(strategy);
  dropdown.querySelectorAll<HTMLElement>('.sd-item').forEach((li) => {
    li.classList.toggle('active', li.dataset.strategy === displayId);
  });
}
