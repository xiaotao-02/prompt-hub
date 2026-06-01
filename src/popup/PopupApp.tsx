import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Settings,
  Sparkles,
  Trash2,
  Pencil,
  X,
  Wand2,
  PanelTopOpen,
  ChevronDown,
  ChevronRight,
  Crop,
  ExternalLink,
} from 'lucide-react';
import { LIBRARY_REV_KEY, listRecentHistory, removeHistory, getSettings } from '@/lib/storage';
import { SETTINGS_KEY } from '@/lib/storage/keys';
import type { HistoryItem } from '@/lib/types';
import { formatTime } from '@/lib/format/time';
import { sendOpenInPanel, sendOpenOptions } from '@/lib/messaging/openSurfaces';
import { UI_ACTION, UI_EMPTY, UI_NAV } from '@/lib/uiCopy';
import { Button, Collapsible, CopyFeedbackLabel, StatusBanner, cx } from '@/components/ui';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';
import { PopupVersionsInline } from './PopupVersionsInline';
import { usePopupVersionsDetail } from './usePopupVersionsDetail';
import ProviderQuotaBadge from '@/components/ProviderQuotaBadge';
import type { ProviderId } from '@/lib/types';

type OpenLibraryDock = 'refine' | 'versions';

type ToolbarPromptMode = 'edit' | 'refine';

function openLibraryItem(itemId: string, dock?: OpenLibraryDock) {
  sendOpenOptions(
    {
      tab: 'library',
      focusId: itemId,
      ...(dock ? { dock } : {}),
    },
    () => void chrome.runtime.lastError,
  );
}

function sendRecallToPanel(
  item: HistoryItem,
  setTip: (s: string | null) => void,
  dock?: OpenLibraryDock,
) {
  setTip(null);
  sendOpenInPanel(item.id, {
    dock,
    onResponse: (resp, lastErr) => {
      if (lastErr || !resp) {
        setTip(lastErr || '后台未响应');
        return;
      }
      if (!resp.ok) {
        setTip(resp.error || '召回失败');
        return;
      }
      setTimeout(() => window.close(), 60);
    },
  });
}

export default function PopupApp() {
  const [list, setList] = useState<HistoryItem[]>([]);
  const [toolbarPromptTarget, setToolbarPromptTarget] = useState<'library' | 'panel'>('library');
  const [recallTip, setRecallTip] = useState<string | null>(null);
  /** 区域截图入口错误提示（成功时直接关 popup） */
  const [regionSnipTip, setRegionSnipTip] = useState<string | null>(null);
  const { copiedKey, onCopy } = useCopyFeedback();
  const [activeProviderId, setActiveProviderId] = useState<ProviderId>('openai');
  const load = useCallback(() => listRecentHistory(80).then(setList), []);
  const {
    versionsExpandedId,
    versionsDetailItem,
    toggleVersionsPanel,
    refreshVersionsDetailAfterMutation,
    collapseVersionsForItem,
  } = usePopupVersionsDetail(load);
  const cardRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  useEffect(() => {
    if (!versionsExpandedId) return;
    const el = cardRefs.current.get(versionsExpandedId);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [versionsExpandedId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void getSettings().then((s) => {
      setToolbarPromptTarget(s.popupToolbarPromptAction ?? 'library');
      setActiveProviderId(s.activeProvider);
    });  }, []);

  useEffect(() => {
    const onStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: chrome.storage.AreaName,
    ) => {
      if (area === 'local' && LIBRARY_REV_KEY in changes) load();      if (area === 'sync' && SETTINGS_KEY in changes) {
        void getSettings().then((s) => {
          setToolbarPromptTarget(s.popupToolbarPromptAction ?? 'library');
          setActiveProviderId(s.activeProvider);
        });
      }
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => chrome.storage.onChanged.removeListener(onStorage);
  }, [load]);

  const runToolbarPromptMode = (item: HistoryItem, mode: ToolbarPromptMode) => {
    if (toolbarPromptTarget === 'panel') {
      const dock = mode === 'refine' ? 'refine' : undefined;
      sendRecallToPanel(item, setRecallTip, dock);
    } else {
      if (mode === 'edit') openLibraryItem(item.id);
      else openLibraryItem(item.id, 'refine');
    }
  };

  const onDelete = async (item: HistoryItem) => {
    collapseVersionsForItem(item.id);
    await removeHistory(item.id);
    load();
  };

  const openLibrary = () => {
    sendOpenOptions({ tab: 'library' }, () => void chrome.runtime.lastError);
  };

  const openOptionsSettingsTab = () => {
    sendOpenOptions({ tab: 'settings' }, () => void chrome.runtime.lastError);
  };

  const recallToPanel = (item: HistoryItem) => sendRecallToPanel(item, setRecallTip);

  const requestRegionCapture = () => {
    setRegionSnipTip(null);
    chrome.runtime.sendMessage(
      { type: 'REQUEST_REGION_CAPTURE' as const, payload: {} },
      (resp?: { ok?: boolean; error?: string }) => {
        if (chrome.runtime.lastError) {
          setRegionSnipTip(chrome.runtime.lastError.message || '后台错误');
          return;
        }
        if (!resp?.ok) {
          setRegionSnipTip(resp?.error || '无法在当前页面启动截取');
          return;
        }
        setTimeout(() => window.close(), 40);
      },
    );
  };

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-zinc-200/90 dark:border-zinc-800 bg-white/85 dark:bg-zinc-950/60 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={chrome.runtime.getURL('icons/icon-48.png')}
            alt="Prompt Hub"
            className="w-8 h-8 rounded-lg object-cover flex-none ring-1 ring-zinc-200/80 dark:ring-zinc-700"
          />
          <div className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
            Prompt Hub
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-none justify-end">
          <ProviderQuotaBadge providerId={activeProviderId} compact className="mr-0.5" />
          <Button
            onClick={requestRegionCapture}
            title={UI_NAV.regionCaptureTitle}
            aria-label={UI_NAV.regionCapture}
            variant="secondary"
            size="xs"
          >
            <Crop className="w-3.5 h-3.5 opacity-90" aria-hidden />
            {UI_NAV.regionCapture}
          </Button>
          <a
            href="https://github.com/xiaotao-02/prompt-hub"
            target="_blank"
            rel="noreferrer"
            title="GitHub 开源仓库"
            aria-label="GitHub 开源仓库"
            className="inline-flex shrink-0 items-center justify-center gap-1 h-7 px-2 text-[11px] rounded-lg border font-medium transition border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            GitHub
            <ExternalLink className="w-3 h-3 opacity-90" aria-hidden />
          </a>
          <Button
            onClick={openLibrary}
            title={UI_NAV.openLibraryTitle}
            aria-label={UI_NAV.openLibraryAria}
            variant="primary"
            size="xs"
          >
            {UI_NAV.openLibrary}
            <ChevronRight className="w-3.5 h-3.5 opacity-90" aria-hidden />
          </Button>
        </div>
      </header>

      {recallTip && (
        <StatusBanner tone="danger" className="rounded-none border-x-0 border-t-0 px-3 py-2">
          <div className="flex items-start gap-2">
            <span className="flex-1">{recallTip}</span>
            <button
              onClick={() => setRecallTip(null)}
              className="p-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-500/20"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </StatusBanner>
      )}

      {regionSnipTip && (
        <StatusBanner tone="warning" className="rounded-none border-x-0 border-t-0 px-3 py-2">
          <div className="flex items-start gap-2">
            <span className="flex-1">{regionSnipTip}</span>
            <button
              type="button"
              onClick={() => setRegionSnipTip(null)}
              className="p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-500/20"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </StatusBanner>
      )}

      <div className="bg-zinc-50/50 dark:bg-zinc-950/35">
        {list.length === 0 ? (
          <EmptyState onOpenLibrary={openLibrary} onOpenSettingsTab={openOptionsSettingsTab} />
        ) : (
          <ul className="px-2 py-2 space-y-2">
            {list.map((item) => {
              const versionCount = item.versions?.length || 0;
              const canToggleVersions = versionCount > 1;
              const isVersionsExpanded = versionsExpandedId === item.id;
              const versionsPanelId = `popup-versions-${item.id}`;
              return (
                <li
                  key={item.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(item.id, el);
                    else cardRefs.current.delete(item.id);
                  }}
                  className="rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/60 p-3 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                >
                  <div
                    className={cx(
                      'flex gap-3 items-start w-full rounded-lg outline-none transition-colors',
                      canToggleVersions &&
                        'cursor-pointer -m-1 p-1 hover:bg-zinc-50/90 focus-visible:ring-2 focus-visible:ring-violet-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:bg-zinc-800/35 dark:focus-visible:ring-offset-zinc-950',
                      canToggleVersions &&
                        isVersionsExpanded &&
                        'bg-violet-50/60 ring-1 ring-violet-500/30 dark:bg-violet-500/10 dark:ring-violet-400/25',
                    )}
                    role={canToggleVersions ? 'button' : undefined}
                    tabIndex={canToggleVersions ? 0 : undefined}
                    aria-expanded={canToggleVersions ? isVersionsExpanded : undefined}
                    aria-controls={canToggleVersions ? versionsPanelId : undefined}
                    aria-label={canToggleVersions ? '展开或收起历史版本' : undefined}
                    title={canToggleVersions ? '点击展开或收起历史版本' : undefined}
                    onClick={canToggleVersions ? () => toggleVersionsPanel(item) : undefined}
                    onKeyDown={
                      canToggleVersions
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleVersionsPanel(item);
                            }
                          }
                        : undefined
                    }
                  >
                    <img
                      src={item.thumbnail}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 flex-none"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-zinc-500 mb-1 flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-px rounded bg-zinc-100 dark:bg-zinc-800">
                          {item.provider}
                        </span>
                        <span className="truncate min-w-0 max-w-[220px]">{item.model}</span>
                        <span>·</span>
                        <span>{formatTime(item.updatedAt || item.createdAt)}</span>
                        {canToggleVersions && (
                          <>
                            <span
                              aria-hidden="true"
                              className={cx(
                                'inline-flex h-5 items-center rounded px-1.5 text-[11px] font-medium transition',
                                isVersionsExpanded
                                  ? 'bg-violet-600 text-white dark:bg-violet-500 dark:text-white'
                                  : 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
                              )}
                            >
                              v{versionCount}
                            </span>
                            <ChevronDown
                              aria-hidden="true"
                              className={cx(
                                'w-3.5 h-3.5 flex-none text-violet-500 dark:text-violet-400 ui-chevron-spring',
                                isVersionsExpanded && 'rotate-180',
                              )}
                            />
                          </>
                        )}
                      </div>

                      <p className="text-[13px] leading-[1.6] text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words line-clamp-3">
                        {item.prompt}
                      </p>
                    </div>
                  </div>

                  <div
                    className="mt-2 flex gap-3 items-center min-w-0"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <div className="w-14 flex-shrink-0 pointer-events-none" aria-hidden />
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                      <div className="grid flex-1 min-w-0 grid-cols-4 gap-1">
                        <button
                          type="button"
                          onClick={() => onCopy(item.prompt, item.id)}
                          className="inline-flex h-7 min-w-0 items-center justify-center gap-1 rounded-md px-2 text-[11px] whitespace-nowrap text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <CopyFeedbackLabel active={copiedKey === item.id} />
                        </button>
                        <button
                          type="button"
                          onClick={() => runToolbarPromptMode(item, 'edit')}
                          title={UI_ACTION.editTitle}
                          className="inline-flex h-7 min-w-0 items-center justify-center gap-1 rounded-md px-2 text-[11px] whitespace-nowrap text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <Pencil className="w-3 h-3" /> {UI_ACTION.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => runToolbarPromptMode(item, 'refine')}
                          title={UI_ACTION.refineTitle}
                          className="inline-flex h-7 min-w-0 items-center justify-center gap-1 rounded-md px-2 text-[11px] whitespace-nowrap text-violet-600 transition hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10"
                        >
                          <Wand2 className="w-3 h-3" /> {UI_ACTION.refine}
                        </button>
                        <button
                          type="button"
                          onClick={() => recallToPanel(item)}
                          className="inline-flex h-7 min-w-0 items-center justify-center gap-1 rounded-md px-2 text-[11px] whitespace-nowrap text-violet-600 transition hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-500/10"
                          title={UI_ACTION.recallToPanelTitle}
                        >
                          <PanelTopOpen className="w-3 h-3" /> {UI_ACTION.recallToPanel}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="inline-flex flex-none items-center gap-1 px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 text-[11px]"
                        title="删除此条"
                        aria-label="删除此条记录"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <Collapsible
                    open={versionsExpandedId === item.id}
                    id={versionsPanelId}
                    className="w-full min-w-0"
                  >
                    {versionsDetailItem && versionsDetailItem.id === item.id ? (
                      <PopupVersionsInline
                        item={versionsDetailItem}
                        copiedKey={copiedKey}
                        onCopy={onCopy}
                        onAfterMutation={refreshVersionsDetailAfterMutation}
                      />
                    ) : null}
                  </Collapsible>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  onOpenLibrary,
  onOpenSettingsTab,
}: {
  onOpenLibrary: () => void;
  onOpenSettingsTab: () => void;
}) {
  return (
    <div className="px-6 py-10 text-center">
      <div className="w-14 h-14 mx-auto rounded-xl bg-violet-50 dark:bg-violet-500/15 flex items-center justify-center mb-4 ring-1 ring-zinc-200/60 dark:ring-zinc-700/60">
        <Sparkles className="w-6 h-6 text-violet-500" />
      </div>
      <h3 className="text-sm font-semibold mb-1 text-zinc-900 dark:text-zinc-100">
        {UI_EMPTY.noHistoryTitle}
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-5">
        在任意网页上 <b>右键点击图片</b>，
        <br />
        选择"🎨 提取图片提示词"开始使用
      </p>
      <div className="flex flex-col gap-2 max-w-[280px] mx-auto">
        <Button
          onClick={onOpenLibrary}
          title={UI_EMPTY.openLibraryCtaTitle}
          aria-label={UI_EMPTY.openLibraryCtaTitle}
          variant="primary"
          size="sm"
          className="w-full"
        >
          {UI_EMPTY.openLibraryCta}
          <ChevronRight className="w-3.5 h-3.5 opacity-90" aria-hidden />
        </Button>
        <Button
          onClick={onOpenSettingsTab}
          title={UI_ACTION.configureApiKeyTitle}
          aria-label={UI_ACTION.configureApiKeyTitle}
          variant="secondary"
          size="sm"
          className="w-full"
        >
          <Settings className="w-3.5 h-3.5" aria-hidden />
          {UI_ACTION.configureApiKey}
        </Button>
      </div>
    </div>
  );
}
