import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { cx } from '@/components/ui';

export interface EmptyGuideStep {
  icon: LucideIcon;
  text: string;
}

export interface EmptyGuideProps {
  title: string;
  description: string;
  steps?: readonly EmptyGuideStep[];
  /** 是否带边框卡片外壳（筛选无结果等场景） */
  bordered?: boolean;
  /** 替换默认 Sparkles 图标 */
  icon?: LucideIcon;
  /** guide：violet 渐变；plain：灰色边框 */
  iconVariant?: 'guide' | 'plain';
  /** 标题/描述下方的额外内容（如清除筛选按钮） */
  action?: ReactNode;
  /** bordered 模式下使用较小垂直内边距 */
  compact?: boolean;
  /** list：纵向编号列表；flow：横向流程（提示词库空状态） */
  stepsLayout?: 'list' | 'flow';
  /** content：限制内容宽度，避免 bordered 撑满整行 */
  align?: 'center' | 'content';
  /** 是否显示顶部主图标（默认 true） */
  showIcon?: boolean;
  /** compact：窄面板（popup）更紧的内边距与步骤密度 */
  density?: 'default' | 'compact';
}

export function EmptyGuide({
  title,
  description,
  steps,
  bordered = false,
  icon: IconComponent = Sparkles,
  iconVariant = 'guide',
  action,
  compact = false,
  stepsLayout = 'list',
  align = 'center',
  showIcon = true,
  density = 'default',
}: EmptyGuideProps) {
  const hasSteps = steps != null && steps.length > 0;
  const isFlow = stepsLayout === 'flow' && hasSteps;
  const isCompact = density === 'compact';

  return (
    <div
      className={cx(
        'text-center',
        isCompact ? 'px-4' : 'px-6',
        align === 'content' ? 'max-w-xl mx-auto w-full' : 'max-w-md mx-auto',
        isFlow && align === 'content' && 'max-w-lg',
        bordered
          ? cx(
              'rounded-xl border border-zinc-200/70 dark:border-zinc-800/80',
              'bg-zinc-50/40 dark:bg-zinc-900/35',
              'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]',
              compact ? 'py-12' : 'py-14 sm:py-16',
            )
          : isFlow
            ? undefined
            : isCompact
              ? 'py-7 sm:py-8'
              : 'py-9 sm:py-10',
      )}
    >
      {showIcon ? (
        <div
          className={cx(
            'relative mx-auto flex items-center justify-center',
            isCompact ? 'mb-4' : 'mb-5',
            iconVariant === 'guide'
              ? isCompact
                ? 'w-[3.75rem] h-[3.75rem]'
                : 'w-[4.5rem] h-[4.5rem]'
              : 'w-14 h-14',
          )}
          aria-hidden
        >
          {iconVariant === 'guide' && (
            <span
              className={cx(
                'absolute inset-0 rounded-2xl',
                'bg-violet-500/[0.07] dark:bg-violet-400/[0.12]',
                'ring-1 ring-violet-500/10 dark:ring-violet-400/15',
                'blur-[0.5px]',
              )}
            />
          )}
          <div
            className={cx(
              'relative flex items-center justify-center rounded-2xl',
              iconVariant === 'guide'
                ? cx(
                    'bg-white/90 dark:bg-zinc-900/90 border border-violet-200/50 dark:border-violet-500/20 shadow-sm',
                    isCompact ? 'w-10 h-10' : 'w-12 h-12',
                  )
                : 'w-14 h-14 border border-zinc-200 dark:border-zinc-700 text-zinc-400',
            )}
          >
            <IconComponent
              className={cx(
                iconVariant === 'guide'
                  ? cx(
                      'text-violet-600/90 dark:text-violet-400',
                      isCompact ? 'w-[1.125rem] h-[1.125rem]' : 'w-5 h-5',
                    )
                  : 'w-6 h-6',
              )}
              strokeWidth={iconVariant === 'guide' ? 1.75 : 2}
              aria-hidden
            />
          </div>
        </div>
      ) : null}

      <h3
        className={cx(
          'font-semibold tracking-tight text-zinc-800 dark:text-zinc-100',
          isCompact ? 'text-[14px] mb-1' : 'text-[15px] mb-1.5',
          !showIcon && (isCompact ? 'mb-1.5' : 'mb-2'),
        )}
      >
        {title}
      </h3>
      <p
        className={cx(
          'leading-relaxed text-zinc-500 dark:text-zinc-400 mx-auto',
          isCompact ? 'text-[12px] max-w-[min(100%,18rem)]' : 'text-[13px]',
          isFlow && !isCompact && 'max-w-[320px]',
          !isFlow && !isCompact && 'max-w-[280px]',
          isFlow && isCompact && 'max-w-[min(100%,18rem)]',
          hasSteps || action ? (isCompact ? 'mb-5' : 'mb-6') : undefined,
        )}
      >
        {description}
      </p>

      {hasSteps && stepsLayout === 'flow' ? (
        <ol className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 w-full max-w-[520px] mx-auto">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isLast = index === steps.length - 1;
            return (
              <li key={step.text} className="flex sm:contents items-center gap-3 sm:gap-0 min-w-0">
                <div className="flex sm:flex-1 sm:flex-col sm:items-center sm:gap-2 gap-3 min-w-0 flex-1 text-left sm:text-center">
                  <span
                    className={cx(
                      'shrink-0 flex items-center justify-center rounded-lg',
                      'w-8 h-8 border border-zinc-200/80 dark:border-zinc-700/80',
                      'bg-white/60 dark:bg-zinc-900/60',
                    )}
                  >
                    <StepIcon
                      className="w-4 h-4 text-zinc-500 dark:text-zinc-400"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </span>
                  <span className="text-[12px] sm:text-[11px] leading-snug text-zinc-600 dark:text-zinc-300 min-w-0">
                    {step.text}
                  </span>
                </div>
                {!isLast && (
                  <ChevronRight
                    className="hidden sm:block w-4 h-4 shrink-0 mx-1 text-zinc-300 dark:text-zinc-600"
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>
      ) : null}

      {hasSteps && stepsLayout === 'list' ? (
        <ol
          className={cx(
            'mx-auto w-full text-left',
            isCompact ? 'max-w-[min(100%,20rem)] space-y-2.5' : 'max-w-[300px] space-y-2',
          )}
        >
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <li
                key={step.text}
                className={cx(
                  'grid grid-cols-[1.125rem_1rem_minmax(0,1fr)] items-start gap-x-2.5',
                  isCompact
                    ? 'text-[12px] leading-[1.45] text-zinc-600 dark:text-zinc-300'
                    : 'text-[13px] leading-snug text-zinc-600 dark:text-zinc-300',
                )}
              >
                <span
                  className={cx(
                    'row-span-1 self-start mt-px shrink-0 w-[1.125rem] h-[1.125rem] rounded-full',
                    'text-[10px] font-medium tabular-nums',
                    'flex items-center justify-center',
                    'bg-zinc-200/80 text-zinc-600',
                    'dark:bg-zinc-700/80 dark:text-zinc-300',
                  )}
                >
                  {index + 1}
                </span>
                <StepIcon
                  className="row-span-1 self-start mt-px w-4 h-4 shrink-0 text-zinc-400/90 dark:text-zinc-500"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="min-w-0 col-start-3">{step.text}</span>
              </li>
            );
          })}
        </ol>
      ) : null}

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
