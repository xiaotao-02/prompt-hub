import { useEffect, useState } from 'react';
import type { AppSettings } from '@/lib/types';
import { cx } from '@/components/ui';
import {
  CUSTOM_PROMPT_MODE_HINT,
  detectCustomPromptMode,
  migrateSettingsForBuiltinStrategy,
  readCustomPromptText,
  switchCustomPromptMode,
  writeCustomPromptText,
  type CustomPromptMode,
} from './customPromptEditor';

interface Props {
  settings: AppSettings;
  setSettings: (next: AppSettings) => void;
}

const MODE_OPTIONS: { value: CustomPromptMode; label: string }[] = [
  { value: 'append', label: '追加到系统指令' },
  { value: 'replace', label: '替换系统指令' },
];

export default function UnifiedCustomPromptEditor({ settings, setSettings }: Props) {
  const canReplace = settings.promptStrategy === 'custom';
  const [mode, setMode] = useState<CustomPromptMode>(() => detectCustomPromptMode(settings));

  useEffect(() => {
    setMode(detectCustomPromptMode(settings));
    // 仅在指令/模板变化时重推 mode，避免 settings 其它字段变化触发循环
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync mode from instruction fields only
  }, [settings.customInstruction, settings.customPromptTemplate]);

  useEffect(() => {
    if (settings.promptStrategy === 'custom') return;
    if (!settings.customInstruction?.trim()) return;
    setSettings(migrateSettingsForBuiltinStrategy(settings));
  }, [settings.promptStrategy, settings.customInstruction, setSettings, settings]);

  useEffect(() => {
    if (!canReplace && mode === 'replace') {
      setMode('append');
    }
  }, [canReplace, mode]);

  const text = readCustomPromptText(settings, mode);

  const handleModeChange = (next: CustomPromptMode) => {
    if (next === 'replace' && !canReplace) return;
    setSettings(switchCustomPromptMode(settings, mode, next));
    setMode(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="label mb-0">自定义提示词（可选）</label>
        <div
          role="tablist"
          aria-label="自定义提示词模式"
          className="inline-flex items-center gap-0.5 self-start rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800/70"
        >
          {MODE_OPTIONS.map((opt) => {
            const active = mode === opt.value;
            const disabled = opt.value === 'replace' && !canReplace;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={disabled}
                title={disabled ? '需先在「策略版本」中选择「自定义组合」' : undefined}
                onClick={() => handleModeChange(opt.value)}
                className={cx(
                  'inline-flex h-7 items-center justify-center rounded-md px-2.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/45',
                  active
                    ? 'bg-white text-violet-700 shadow-sm dark:bg-zinc-950 dark:text-violet-300'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white',
                  disabled &&
                    'cursor-not-allowed opacity-40 hover:text-zinc-600 dark:hover:text-zinc-300',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <textarea
        className={cx(
          'input-prompt min-h-[100px] resize-y',
          mode === 'replace' && 'font-mono text-[12px] leading-[1.6]',
        )}
        placeholder="例如：注重画面氛围与光影；或整段替换为自写反推指令。"
        value={text}
        onChange={(e) => setSettings(writeCustomPromptText(settings, mode, e.target.value))}
      />

      <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        {CUSTOM_PROMPT_MODE_HINT[mode]}
      </p>
    </div>
  );
}
