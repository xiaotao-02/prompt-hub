import { DEFAULT_STRATEGY_ID, STRATEGY_LABELS, type StrategyId } from '@/lib/strategies-meta';
import { resolveStrategySelectTriggerLabel } from '@/lib/strategySelectDisplay';
import { getUserStrategyPresets, findMatchingUserPreset } from '@/lib/storage/userStrategyPresets';
import { getSettings } from '@/lib/storage/settings';

/** 将策略 id 解析为可在 UI 展示的已知档位（未知/已下线 id 回退默认档）。 */
export function resolveStrategyDisplayId(id: StrategyId | undefined): StrategyId {
  if (id && STRATEGY_LABELS[id]) return id;
  return DEFAULT_STRATEGY_ID;
}

/** 下拉 trigger / 列表项使用的展示 label；`undefined` 时回退默认档。 */
export function strategyDisplayLabel(id: StrategyId | undefined): string {
  return STRATEGY_LABELS[resolveStrategyDisplayId(id)];
}

export type StrategyDropdownPatchOptions = {
  triggerLabel?: string;
  activePresetId?: string;
};

/** loading header badge：优先匹配预设名，否则内置档位 label。 */
export async function resolveStrategyHeaderLabelAsync(
  strategy: StrategyId | undefined,
): Promise<string> {
  if (!strategy) return '';
  const displayId = resolveStrategyDisplayId(strategy);
  try {
    const [settings, presets] = await Promise.all([getSettings(), getUserStrategyPresets()]);
    return resolveStrategySelectTriggerLabel(settings, displayId, presets, strategyDisplayLabel);
  } catch {
    return strategyDisplayLabel(strategy);
  }
}

/** 轻量刷新策略下拉 trigger 文案与菜单 active 态，不重渲整板。 */
export function patchStrategyDropdownSelection(
  root: HTMLElement,
  strategy: StrategyId | undefined,
  options?: StrategyDropdownPatchOptions,
): void {
  const dropdown = root.querySelector<HTMLElement>('[data-role="strategy-dropdown"]');
  if (!dropdown) return;
  const displayId = resolveStrategyDisplayId(strategy);
  const labelEl = dropdown.querySelector<HTMLElement>('.sd-label');
  if (labelEl) {
    labelEl.textContent = options?.triggerLabel ?? strategyDisplayLabel(strategy);
  }
  dropdown.querySelectorAll<HTMLElement>('.sd-item').forEach((li) => {
    if (li.dataset.presetId) {
      li.classList.toggle('active', li.dataset.presetId === options?.activePresetId);
      return;
    }
    if (li.dataset.strategy) {
      const builtinActive = !options?.activePresetId && li.dataset.strategy === displayId;
      li.classList.toggle('active', builtinActive);
    }
  });
}

/** loading 阶段异步解析 trigger / active 并 patch 下拉（与 React 下拉逻辑一致）。 */
export async function patchStrategyDropdownFromSettings(
  root: HTMLElement,
  strategy: StrategyId | undefined,
): Promise<{ headerLabel: string }> {
  const displayId = resolveStrategyDisplayId(strategy);
  try {
    const [settings, presets] = await Promise.all([getSettings(), getUserStrategyPresets()]);
    const triggerLabel = resolveStrategySelectTriggerLabel(
      settings,
      displayId,
      presets,
      strategyDisplayLabel,
    );
    const match = findMatchingUserPreset(settings, presets);
    patchStrategyDropdownSelection(root, strategy, {
      triggerLabel,
      activePresetId: match?.id,
    });
    return { headerLabel: triggerLabel };
  } catch {
    patchStrategyDropdownSelection(root, strategy);
    return { headerLabel: strategyDisplayLabel(strategy) };
  }
}

/** @deprecated 同步兜底；loading 请用 {@link patchStrategyDropdownFromSettings} */
export function strategyHeaderLabel(id: StrategyId | undefined): string {
  if (!id) return '';
  return strategyDisplayLabel(id);
}
