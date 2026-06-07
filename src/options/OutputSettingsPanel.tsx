import type { AppSettings } from '@/lib/types';
import { OUTPUT_STYLE_LABELS, OUTPUT_STYLE_ORDER } from '@/lib/strategies-meta';
import { ChoiceCard } from '@/components/ui';
import StrategySettingsPanel from './StrategySettingsPanel';
import { SettingsSection } from './settings/parts/SettingsSection';
import { HelpDisclosure } from './settings/parts/HelpDisclosure';
import type { CommitSettings } from './settings/types';

const STYLE_OPTIONS = OUTPUT_STYLE_ORDER.map((value) => ({
  value,
  label: OUTPUT_STYLE_LABELS[value],
}));

const STRATEGY_HELP_ROWS: { label: string; detail: string }[] = [
  { label: 'v0.3.6 通用高还原', detail: '默认档；主体/构图/光线/色彩成套，少脑补，图·多图·视频' },
  { label: 'v0.3.5 策略', detail: 'v0.3.0 采样拼接；中文按图 3–8 段，只出提示词正文' },
  { label: 'v0.3.0 策略', detail: 'GPT Image / Nano Banana；8 维度分句 + 摄影参数' },
  { label: 'v0.2.2 策略', detail: 'v0.1.0 增强；10 维度 + 三禁，自定义前置' },
  { label: '经典策略', detail: 'v0.1.x 语感；temp 0.4 · 1024 token · 尾部追加' },
  { label: '原生识别', detail: '极简直出；输出风格四档不参与反推' },
  { label: '自定义组合', detail: '温度 / Token / 替换指令；可保存「我的预设」' },
];

interface Props {
  settings: AppSettings;
  commitSettings: CommitSettings;
}

/**
 * 输出设置（含策略版本）：改动经 commitSettings 自动落盘。
 */
export default function OutputSettingsPanel({ settings, commitSettings }: Props) {
  return (
    <div className="space-y-6">
      <SettingsSection title="输出风格">
        <div className="grid grid-cols-4 gap-2 text-xs">
          {STYLE_OPTIONS.map((s) => {
            const active = settings.outputStyle === s.value;
            return (
              <ChoiceCard
                key={s.value}
                compact
                className="min-w-0"
                onClick={() =>
                  commitSettings({ ...settings, outputStyle: s.value }, { immediate: true })
                }
                active={active}
                titleText={s.label}
              />
            );
          })}
        </div>
      </SettingsSection>

      <StrategySettingsPanel settings={settings} commitSettings={commitSettings} />

      <HelpDisclosure>
        <p>决定生成的提示词使用什么语言和格式。</p>
        {settings.promptStrategy === 'native' && (
          <p className="text-violet-600 dark:text-violet-400">
            当前策略为「原生识别」：反推固定按<strong>自然中文段落</strong>
            调用模型，上方「输出风格」四档不会改变本次结果；切换到其他策略后仍会使用你在此处选中的档位。
          </p>
        )}
        <p>
          <strong>替换系统指令</strong>
          ：在「策略版本 → 当前档参数」中为每一档单独配置（原生识别除外）；留空则使用该档默认指令。
        </p>
        <p>
          内置档位 = <strong>指令集 / 采样 / 拼接</strong> 三个组件各自挑一个版本号的组合；
          <strong>自定义组合</strong>
          则通过上方温度、Token、替换指令调节，切换策略后各档参数互不影响。
        </p>
        <ul className="space-y-1">
          {STRATEGY_HELP_ROWS.map((row) => (
            <li key={row.label}>
              <span className="font-medium text-zinc-600 dark:text-zinc-300">{row.label}</span>
              <span className="mx-1 text-zinc-400">—</span>
              {row.detail}
            </li>
          ))}
        </ul>
      </HelpDisclosure>
    </div>
  );
}
