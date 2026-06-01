import { RefreshCw } from 'lucide-react';
import { PROVIDER_LIST_EXTENDED, PROVIDER_LIST_FEATURED } from '@/lib/providers';
import type { ProviderId } from '@/lib/types';

interface Props {
  value: ProviderId;
  onChange: (id: ProviderId) => void;
  fetchingIds?: Set<ProviderId>;
  id?: string;
  className?: string;
}

/**
 * 模型供应商下拉：常用 / 更多 optgroup，替代设置页卡片网格。
 */
export default function ProviderSelect({
  value,
  onChange,
  fetchingIds,
  id,
  className = '',
}: Props) {
  const isFetching = fetchingIds?.has(value);

  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <select
        id={id}
        className="input flex-1 min-w-0"
        value={value}
        onChange={(e) => onChange(e.target.value as ProviderId)}
      >
        <optgroup label="常用">
          {PROVIDER_LIST_FEATURED.map((p) => (
            <option key={p.id} value={p.id} title={p.description}>
              {p.label}
            </option>
          ))}
        </optgroup>
        {PROVIDER_LIST_EXTENDED.length > 0 && (
          <optgroup label="更多">
            {PROVIDER_LIST_EXTENDED.map((p) => (
              <option key={p.id} value={p.id} title={p.description}>
                {p.label}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      {isFetching && (
        <RefreshCw
          className="w-4 h-4 shrink-0 animate-spin text-violet-500"
          aria-label="正在拉取模型"
        />
      )}
    </div>
  );
}
