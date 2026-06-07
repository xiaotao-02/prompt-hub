import { getProviderVisionDisplay } from '@/lib/modelVision';
import { getProviderVisionCatalog } from '@/lib/providerVisionCatalog';
import type { ProviderConfig, ProviderId } from '@/lib/types';
import { cx } from '@/components/ui';

function formatTimeAgo(t: number): string {
  const diff = Date.now() - t;
  if (diff < 60_000) return '刚刚';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface Props {
  providerId: ProviderId;
  cfg?: Pick<ProviderConfig, 'discoveredModels' | 'discoveredVisionById' | 'discoveredAt'>;
  expanded?: boolean;
  className?: string;
}

function ModelChipList({
  label,
  items,
  rest,
  tone,
}: {
  label: string;
  items: string[];
  rest: number;
  tone: 'vision' | 'noVision' | 'unknown';
}) {
  if (items.length === 0 && rest === 0) {
    return null;
  }
  const toneClass =
    tone === 'vision'
      ? 'text-emerald-700 dark:text-emerald-300/90'
      : tone === 'unknown'
        ? 'text-zinc-500 dark:text-zinc-400'
        : 'text-zinc-500 dark:text-zinc-400';
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-medium text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className={cx('mt-0.5 text-[9px] font-mono leading-snug break-all', toneClass)}>
        {items.join(' · ')}
        {rest > 0 && <span className="text-zinc-400"> · 等 {rest} 个</span>}
      </div>
    </div>
  );
}

export default function ProviderVisionSummary({
  providerId,
  cfg,
  expanded = false,
  className,
}: Props) {
  const catalog = getProviderVisionCatalog(providerId);
  const discovered = cfg?.discoveredModels;
  const display = getProviderVisionDisplay(
    providerId,
    discovered?.length ? discovered : undefined,
    cfg?.discoveredVisionById,
  );

  const meta =
    display.source === 'discovered' && cfg?.discoveredAt != null
      ? `识图 ${display.visionTotal} · 未确认 ${display.unknownTotal} · 其它 ${display.noVisionTotal} · ${formatTimeAgo(cfg.discoveredAt)}`
      : display.source === 'static' && catalog.notes
        ? catalog.notes
        : display.source === 'static'
          ? '示例（拉取端点后更新）'
          : null;

  const stripUpstreamPrefix = (id: string) => id;

  return (
    <div
      className={cx(
        'pointer-events-none mt-1.5 space-y-1 border-t border-zinc-100 pt-1.5 dark:border-zinc-800/80',
        expanded ? 'max-h-28 overflow-y-auto' : '',
        className,
      )}
    >
      {meta && <p className="text-[9px] leading-snug text-zinc-400 dark:text-zinc-500">{meta}</p>}
      <ModelChipList
        label="支持识图"
        items={display.visionShown.map(stripUpstreamPrefix)}
        rest={display.visionRest}
        tone="vision"
      />
      {display.unknownShown.length > 0 || display.unknownRest > 0 ? (
        <ModelChipList
          label="未确认"
          items={display.unknownShown.map(stripUpstreamPrefix)}
          rest={display.unknownRest}
          tone="unknown"
        />
      ) : null}
      <ModelChipList
        label="不支持识图"
        items={display.noVisionShown.map(stripUpstreamPrefix)}
        rest={display.noVisionRest}
        tone="noVision"
      />
    </div>
  );
}
