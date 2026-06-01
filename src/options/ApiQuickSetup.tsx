import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCopy, ClipboardCheck, Sparkles, KeyRound } from 'lucide-react';
import { PROVIDERS } from '@/lib/providers';
import { importFromText } from '@/lib/configImport';
import type { AppSettings, ProviderId } from '@/lib/types';
import { resolveEffectiveRefineModel, resolveEffectiveRefineProvider } from '@/lib/providerRoles';
import { Button, Collapsible } from '@/components/ui';
import { UI_ACTION } from '@/lib/uiCopy';
import { UI_COPY_FEEDBACK_MS } from '@/lib/uiFeedback';

export type ProviderSetupRole = 'extract' | 'refine';

interface Props {
  settings: AppSettings;
  applyConfig: (next: AppSettings) => Promise<void>;
  /** 当前配置的是首选（识图）还是次选（AI 调整） */
  role?: ProviderSetupRole;
  /** 拉取模型列表后的 Provider 推断提示（由 SettingsView 传入） */
  providerInferenceHint?: string | null;
  onDismissInferenceHint?: () => void;
  /** 点击「换模型」：打开 ModelPicker 或聚焦手动输入框 */
  onFocusModelField?: () => void;
}

/**
 * API 快速配置：紧凑导入卡片 + 已配置摘要。
 */
export default function ApiQuickSetup({
  settings,
  applyConfig,
  role = 'extract',
  providerInferenceHint,
  onDismissInferenceHint,
  onFocusModelField,
}: Props) {
  const roleProviderId: ProviderId =
    role === 'extract' ? settings.activeProvider : resolveEffectiveRefineProvider(settings);
  const activeCfg = settings.providers[roleProviderId];
  const effectiveHasKey = Boolean(activeCfg?.apiKey && activeCfg.apiKey.trim().length > 0);

  const activeMeta = PROVIDERS[roleProviderId];
  const effectiveModel =
    role === 'refine' ? resolveEffectiveRefineModel(settings) : activeCfg.model;
  const roleLabel = role === 'extract' ? '首选' : '次选';

  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importHint, setImportHint] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(!effectiveHasKey);

  useEffect(() => {
    if (effectiveHasKey) setEditOpen(false);
  }, [effectiveHasKey, roleProviderId]);

  const exportSnippet = useMemo(() => {
    const snippet = {
      role,
      provider: roleProviderId,
      apiKey: activeCfg.apiKey,
      baseUrl: activeCfg.baseUrl,
      model: effectiveModel,
    };
    return JSON.stringify(snippet, null, 2);
  }, [role, roleProviderId, activeCfg, effectiveModel]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), UI_COPY_FEEDBACK_MS);
    } catch {
      window.prompt('复制下方文本到剪贴板：', exportSnippet);
    }
  };

  const onImport = async () => {
    setImportError(null);
    setImportHint(null);
    const result = importFromText(settings, importText);
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    setImporting(true);
    try {
      const importedPid = result.settings.activeProvider;
      const imported = result.settings.providers[importedPid];
      let next: AppSettings = {
        ...settings,
        providers: {
          ...settings.providers,
          [importedPid]: {
            ...settings.providers[importedPid],
            ...imported,
          },
        },
      };
      if (role === 'extract') {
        next = { ...result.settings, ...next, activeProvider: importedPid };
      } else {
        const importedModel = imported.model?.trim();
        if (importedPid === settings.activeProvider) {
          next = {
            ...next,
            refineProvider: undefined,
            refineModel: importedModel || undefined,
          };
        } else {
          next = {
            ...next,
            refineProvider: importedPid,
            refineModel: importedModel || undefined,
          };
        }
      }
      await applyConfig(next);
      const hint =
        imported?.apiKey?.trim() && imported?.baseUrl?.trim()
          ? `${result.hint} · 正在拉取可用模型…`
          : result.hint;
      setImportHint(`${roleLabel} API：${hint}`);
      setImportText('');
      setEditOpen(false);
    } catch (e) {
      setImportError(`保存失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setImporting(false);
    }
  };

  const displayHint = providerInferenceHint ?? importHint;
  const showImportRow = !effectiveHasKey || editOpen;

  return (
    <div className="space-y-3">
      {effectiveHasKey && !editOpen && activeCfg && activeMeta && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200/80 dark:border-emerald-500/25 bg-emerald-50/50 dark:bg-emerald-500/5 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300 shrink-0" />
            <div className="min-w-0 text-sm text-zinc-800 dark:text-zinc-100 truncate">
              <span className="text-[10px] font-normal text-zinc-500 mr-1">{roleLabel}</span>
              {activeMeta.label}
              <span className="text-zinc-400 font-normal mx-1">·</span>
              <span className="font-mono text-xs text-zinc-600 dark:text-zinc-300">
                {role === 'refine'
                  ? effectiveModel || activeMeta.defaultModel
                  : activeCfg.model || activeMeta.defaultModel}
              </span>
            </div>
            {displayHint && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-300 truncate hidden sm:inline">
                {displayHint}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => onFocusModelField?.()}
            >
              换模型
            </Button>
            <Button
              type="button"
              variant="primary"
              size="xs"
              className="shadow-sm"
              onClick={() => setEditOpen(true)}
            >
              一键导入api
            </Button>
          </div>
        </div>
      )}

      {showImportRow && (
        <div className="rounded-xl border border-violet-200 dark:border-violet-500/30 bg-gradient-to-b from-violet-50/70 to-white dark:from-violet-500/10 dark:to-zinc-900/40 p-4 space-y-3">
          <p className="text-xs inline-flex flex-wrap items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <span className="font-semibold text-violet-700 dark:text-violet-300">一键导入 API</span>
            <span className="text-zinc-500 dark:text-zinc-400">
              ，粘贴 Key、curl 或 JSON，自动填入上方字段
            </span>
          </p>

          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <textarea
                rows={1}
                className="input h-10 min-h-0 max-h-24 flex-1 resize-y font-mono text-[12px] leading-[1.5]"
                placeholder='sk-... 或 {"provider":"zhipu","apiKey":"..."}'
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError(null);
                  setImportHint(null);
                }}
              />
              <Button
                type="button"
                variant="primary"
                className="shrink-0 h-10 px-4"
                onClick={() => void onImport()}
                disabled={importing || !importText.trim()}
              >
                {importing ? '导入中…' : '一键导入'}
              </Button>
            </div>

            {displayHint && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-300 inline-flex flex-wrap items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{displayHint}</span>
                {providerInferenceHint && onDismissInferenceHint && (
                  <button
                    type="button"
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline"
                    onClick={onDismissInferenceHint}
                  >
                    关闭
                  </button>
                )}
              </p>
            )}

            {importError && (
              <div className="text-[11px] leading-snug px-2.5 py-1.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 whitespace-pre-wrap break-words">
                {importError}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setHelpOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 py-2 text-left text-xs font-medium text-zinc-600 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              aria-expanded={helpOpen}
            >
              <span>需要帮助？</span>
              <span className="text-zinc-400">{helpOpen ? '−' : '+'}</span>
            </button>
            <Collapsible open={helpOpen}>
              <div className="space-y-2 border-t border-zinc-200 py-3 dark:border-zinc-800">
                <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-violet-500" />
                  三步配置
                </h3>
                <ol className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed list-decimal list-inside">
                  <li>选择供应商并申请 API Key</li>
                  <li>粘贴 Key 或 curl / JSON，点「一键导入」</li>
                  <li>
                    {role === 'extract'
                      ? '导入成功即已保存，可在任意网页右键图片试用'
                      : '配置完成后可在面板或提示词库中使用 AI 调整'}
                  </li>
                </ol>
                {role === 'extract' && (
                  <p className="text-[11px] text-zinc-500 leading-snug">
                    MiniMax 识图请选 VL 多模态模型，勿用 M2 纯文本。
                    <a
                      className="text-violet-600 dark:text-violet-300 underline ml-1"
                      href="https://github.com/xiaotao-02/prompt-hub#readme"
                      target="_blank"
                      rel="noreferrer"
                    >
                      说明
                    </a>
                  </p>
                )}
                {role === 'refine' && (
                  <p className="text-[11px] text-zinc-500 leading-snug">
                    次选 API 默认与首选相同；仅用于文本改写，可单独指定便宜、响应快的模型。
                  </p>
                )}
              </div>
            </Collapsible>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 py-2 text-left text-xs font-medium text-zinc-600 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              aria-expanded={advancedOpen}
            >
              <span>高级 · 备份与导入</span>
              <span className="text-zinc-400">{advancedOpen ? '−' : '+'}</span>
            </button>
            <Collapsible open={advancedOpen}>
              <div className="space-y-2 border-t border-zinc-200 py-3 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                    备份当前{roleLabel}配置
                  </span>
                  <button
                    type="button"
                    onClick={() => void onCopy()}
                    className="text-[11px] inline-flex items-center gap-1 text-violet-600 dark:text-violet-300 hover:underline disabled:opacity-50"
                    disabled={!effectiveHasKey}
                  >
                    {copied ? (
                      <>
                        <ClipboardCheck className="w-3.5 h-3.5" /> {UI_ACTION.copied}
                      </>
                    ) : (
                      <>
                        <ClipboardCopy className="w-3.5 h-3.5" /> 复制 JSON
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 leading-snug">
                  导入会立即保存；仅粘贴 Key 时可自动识别厂商。复制内容含 Key，请勿随意分享。
                </p>
              </div>
            </Collapsible>
          </div>
        </div>
      )}
    </div>
  );
}
