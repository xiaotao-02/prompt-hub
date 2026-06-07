import { DEFAULT_OUTPUT_STYLE, OUTPUT_STYLE_LABELS } from '@/lib/strategies-meta';
import type { OutputStyle } from '@/lib/types';

/** 将 outputStyle 解析为可在 UI 展示的已知格式（未知值回退默认档）。 */
export function resolveOutputStyleDisplayId(id: OutputStyle | undefined): OutputStyle {
  if (id && OUTPUT_STYLE_LABELS[id]) return id;
  return DEFAULT_OUTPUT_STYLE;
}

/** 下拉 trigger / 列表项使用的展示 label；`undefined` 时回退默认档。 */
export function outputStyleDisplayLabel(id: OutputStyle | undefined): string {
  return OUTPUT_STYLE_LABELS[resolveOutputStyleDisplayId(id)];
}

/** 轻量刷新输出格式下拉 trigger 文案与菜单 active 态，不重渲整板。 */
export function patchOutputStyleDropdownSelection(
  root: HTMLElement,
  outputStyle: OutputStyle | undefined,
): void {
  const dropdown = root.querySelector<HTMLElement>('[data-role="output-style-dropdown"]');
  if (!dropdown) return;
  const displayId = resolveOutputStyleDisplayId(outputStyle);
  const labelEl = dropdown.querySelector<HTMLElement>('.sd-label');
  if (labelEl) labelEl.textContent = outputStyleDisplayLabel(outputStyle);
  dropdown.querySelectorAll<HTMLElement>('.sd-item').forEach((li) => {
    li.classList.toggle('active', li.dataset.outputStyle === displayId);
  });
}
