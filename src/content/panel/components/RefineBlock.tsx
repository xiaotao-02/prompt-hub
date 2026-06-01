import type { FormEvent, KeyboardEvent } from 'react';
import { isRefineProviderNotConfiguredMessage } from '@/lib/providerRoles';
import { REFINE_PRESETS } from '@/lib/refineSuggestions';
import type { PanelState } from '../state';
import { panelHasActiveRefine, primaryRefineJobForUi } from '../state';
import { commitPanelEvent } from '../dispatchPanel';
import { formatElapsed, refineStageHint, refineStageProgress } from '../loading';
import { runPanelAction } from '../panelActionBridge';
import { IconHtml } from './IconHtml';
import { ICON_CLOSE, ICON_SPARK } from '../icons';

export type RefineBlockProps = {
  state: PanelState;
  runDisabled?: boolean;
  runIdleLabel?: string;
};

export function RefineBlock({ state, runDisabled, runIdleLabel }: RefineBlockProps) {
  const refining = panelHasActiveRefine(state);
  const prim = primaryRefineJobForUi(state);
  const refineInstruction = state.refineInstruction ?? '';
  const refineHasPartial = !!prim?.partial;
  const refinePct = Math.round(refineStageProgress(prim?.stage, refineHasPartial) * 100);
  const refineElapsed =
    prim?.startedAt != null ? formatElapsed(Date.now() - prim.startedAt) : '0.0s';
  const runBtnDisabled = refining || !!runDisabled;
  const idleLabel = runIdleLabel ?? '让 AI 调整';
  const refineKey = `${state.sessionRequestId}-refine`;

  const handleRefineInput = (e: FormEvent<HTMLTextAreaElement>) => {
    commitPanelEvent({
      type: 'ui.setRefineInstruction',
      instruction: e.currentTarget.value,
    });
  };

  const handleRefineKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const root = e.currentTarget.closest('[data-role="panel-surface"]') ?? document;
      const btn = root.querySelector<HTMLButtonElement>('[data-action="run-refine"]');
      btn?.click();
    }
  };

  return (
    <div className={`refine-slot${state.refineOpen ? ' is-open' : ''}`} data-role="refine-slot">
      <div className="refine-slot-inner">
        <div className={`refine-box${refining ? ' loading' : ''}`}>
          <div className="refine-head">
            <span>
              <IconHtml html={ICON_SPARK} />
              <span>告诉我怎么调整这条提示词</span>
            </span>
            <button
              type="button"
              className="icon-btn"
              data-action="toggle-refine"
              title="收起"
              onClick={(e) => runPanelAction('toggle-refine', e.currentTarget, e.nativeEvent)}
            >
              <IconHtml html={ICON_CLOSE} />
            </button>
          </div>
          <textarea
            key={refineKey}
            className="refine-input"
            data-role="refine-input"
            defaultValue={refineInstruction}
            spellCheck={false}
            placeholder="例如：扩写提示词、优化提示词、提取材质、提取风格、改得更电影感、翻译成英文…（下方预设点击即运行）"
            disabled={refining}
            onInput={handleRefineInput}
            onKeyDown={handleRefineKeyDown}
          />
          {state.refineError ? (
            isRefineProviderNotConfiguredMessage(state.refineError) ? (
              <div className="refine-error">
                {state.refineError}{' '}
                <button
                  type="button"
                  className="link-btn primary"
                  data-action="open-refine-settings"
                  onClick={(e) =>
                    runPanelAction('open-refine-settings', e.currentTarget, e.nativeEvent)
                  }
                >
                  去配置次选 API
                </button>
              </div>
            ) : (
              <div className="refine-error">{state.refineError}</div>
            )
          ) : null}
          {!refining ? (
            <div className="refine-suggest">
              {REFINE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="chip"
                  data-action="refine-suggest"
                  data-text={p.instruction}
                  title={p.instruction.length > 24 ? '点击直接运行' : undefined}
                  onClick={(e) => runPanelAction('refine-suggest', e.currentTarget, e.nativeEvent)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          ) : null}
          {refining ? (
            <div className="refine-progress" data-role="refine-progress">
              <div className="bar progress">
                <span data-role="refine-bar-fill" style={{ width: `${refinePct}%` }} />
              </div>
              <div className="hint hint-row">
                <span data-role="refine-stage-hint">
                  {refineStageHint(prim?.stage, refineHasPartial, prim?.streamMode)}
                </span>
                <span className="elapsed" data-role="refine-elapsed">
                  {refineElapsed}
                </span>
              </div>
            </div>
          ) : null}
          <div className="refine-actions">
            <button
              type="button"
              className="btn ghost"
              data-action="toggle-refine"
              disabled={refining}
              onClick={(e) => runPanelAction('toggle-refine', e.currentTarget, e.nativeEvent)}
            >
              取消
            </button>
            <button
              type="button"
              className="btn primary"
              data-action="run-refine"
              disabled={runBtnDisabled}
              onClick={(e) => runPanelAction('run-refine', e.currentTarget, e.nativeEvent)}
            >
              {refining ? (
                <>
                  <span className="spinner" />
                  <span>调整中…</span>
                </>
              ) : (
                <>
                  <IconHtml html={ICON_SPARK} />
                  <span>{idleLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
