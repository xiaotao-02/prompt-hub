import type { Ref } from 'react';
import ModelPicker, { type ModelPickerHandle } from './ModelPicker';
import type { ModelVisionSupport } from '@/lib/modelVision';
import { cx } from '@/components/ui';

export interface ModelSelectorFieldProps {
  id?: string;
  containerRef?: Ref<HTMLDivElement>;
  value: string;
  onChange: (model: string) => void;
  onBlur?: () => void;
  discovered: string[];
  discoveredVision?: Record<string, ModelVisionSupport>;
  discoveredAt?: number;
  fetching: boolean;
  fetchError?: string | null;
  defaultModel?: string;
  groupByUpstream?: boolean;
  modelPickerRef?: Ref<ModelPickerHandle>;
  emptyHint?: string;
  mono?: boolean;
  className?: string;
}

export function ModelSelectorField({
  id,
  containerRef,
  value,
  onChange,
  onBlur,
  discovered,
  discoveredVision,
  discoveredAt,
  fetching,
  fetchError,
  defaultModel,
  groupByUpstream = false,
  modelPickerRef,
  emptyHint,
  mono = false,
  className,
}: ModelSelectorFieldProps) {
  const primaryInputClass = cx('input text-sm', mono && 'font-mono');
  const fallbackInputClass = cx('input text-xs', mono && 'font-mono');

  return (
    <div id={id} ref={containerRef} className={cx('min-w-0 space-y-1.5', className)}>
      {discovered.length > 0 ? (
        <ModelPicker
          ref={modelPickerRef}
          models={discovered}
          visionById={discoveredVision}
          value={value}
          onChange={onChange}
          discoveredAt={discoveredAt}
          fetching={fetching}
          groupByUpstream={groupByUpstream}
        />
      ) : (
        <input
          className={primaryInputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={defaultModel}
          disabled={fetching}
        />
      )}
      {discovered.length > 0 && !discovered.includes(value) && (
        <input
          className={fallbackInputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="不在列表中可手动输入"
        />
      )}
      {fetchError && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 leading-snug">{fetchError}</p>
      )}
      {emptyHint && discovered.length === 0 && !fetching && (
        <p className="text-[11px] text-zinc-400 leading-snug">{emptyHint}</p>
      )}
    </div>
  );
}
