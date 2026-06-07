import PopupServicePane from './servicePanes/PopupServicePane';
import type { PopupServiceState } from './servicePanes/usePopupService';
import { POPUP_SERVICE_CARD_SCROLL_CLASS } from './popupShell';

type Props = PopupServiceState & {
  onSaved?: () => void;
};

export default function PopupServiceCard({ onSaved, ...props }: Props) {
  const { settings, summary } = props;

  if (!settings) return null;

  return (
    <div className="border-b border-zinc-200/90 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40">
      <div className="px-3 pt-2.5 pb-1">
        <p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/90 dark:bg-amber-400/90"
            aria-hidden
          />
          <span className="min-w-0 truncate">{summary}</span>
        </p>
        <p className="mt-0.5 pl-3.5 text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug">
          完成下方配置后即可在顶部管理账户与 API
        </p>
      </div>
      <div className={POPUP_SERVICE_CARD_SCROLL_CLASS}>
        <div className="card !p-3.5 shadow-sm">
          <PopupServicePane {...props} onSaved={onSaved} />
        </div>
      </div>
    </div>
  );
}
