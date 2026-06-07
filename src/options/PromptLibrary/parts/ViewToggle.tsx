import { LayoutGrid, List as ListIcon } from 'lucide-react';
import { SegmentedControl } from '@/components/ui';
import type { ViewMode } from '../types';

export function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <SegmentedControl<ViewMode>
      value={view}
      onChange={onChange}
      ariaLabel="提示词库视图"
      className="rounded-md bg-zinc-100/80 p-0.5 dark:bg-zinc-800/50"
      options={[
        {
          value: 'list',
          label: <span className="sr-only">列表视图</span>,
          icon: <ListIcon className="w-3.5 h-3.5" />,
        },
        {
          value: 'grid',
          label: <span className="sr-only">网格视图</span>,
          icon: <LayoutGrid className="w-3.5 h-3.5" />,
        },
      ]}
    />
  );
}
