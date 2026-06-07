import { normalizeOneClickRefineRandomness } from '@/lib/oneClickRefine';
import type { OneClickRefineRandomness } from '@/lib/types';
import { runPanelAction } from '../panelActionBridge';
import { IconHtml } from './IconHtml';
import { ICON_COPY, ICON_SAVE, ICON_SPARK } from '../icons';
import { OneClickRefineRandomnessDropdown } from './OneClickRefineRandomnessDropdown';

export type ActionsBarProps = {
  dirty: boolean;
  loading?: boolean;
  canCopy?: boolean;
  oneClickRefineRandomness?: OneClickRefineRandomness;
  oneClickRefineControlsDisabled?: boolean;
  refining?: boolean;
  runRefineDisabled?: boolean;
  runRefineIdleLabel?: string;
};

export function ActionsBar({
  dirty,
  loading,
  canCopy,
  oneClickRefineRandomness,
  oneClickRefineControlsDisabled,
  refining,
  runRefineDisabled,
  runRefineIdleLabel,
}: ActionsBarProps) {
  const isLoading = !!loading;
  const isRefining = !!refining;
  const copyEnabled = canCopy ?? !isLoading;
  const rr = normalizeOneClickRefineRandomness(oneClickRefineRandomness);
  const oneClickRefineDisabled = isLoading || !!oneClickRefineControlsDisabled;
  const showSave = !isLoading && dirty;
  const runRefineBtnDisabled = isRefining || !!runRefineDisabled;
  const runRefineLabel = isRefining ? '调整中…' : (runRefineIdleLabel ?? '让 AI 调整');

  const oneClickRefineBtn = (
    <button
      type="button"
      className={`btn ghost one-click-refine-btn${oneClickRefineDisabled ? ' disabled' : ''}`}
      data-action="one-click-refine"
      disabled={oneClickRefineDisabled}
      onClick={(e) => runPanelAction('one-click-refine', e.currentTarget, e.nativeEvent)}
    >
      <span>随机风格</span>
    </button>
  );

  const oneClickRefineControl = isLoading ? (
    oneClickRefineBtn
  ) : (
    <div className="one-click-refine-control-group">
      <OneClickRefineRandomnessDropdown level={rr} disabled={oneClickRefineDisabled} />
      {oneClickRefineBtn}
    </div>
  );

  return (
    <div className="actions">
      <div className="actions-cluster actions-cluster-secondary">
        {oneClickRefineControl}
        {showSave ? (
          <button
            type="button"
            className="btn ghost actions-save-btn"
            data-action="save"
            onClick={(e) => runPanelAction('save', e.currentTarget, e.nativeEvent)}
          >
            <IconHtml html={ICON_SAVE} />
            <span>保存为新版本</span>
          </button>
        ) : null}
      </div>
      <div className="actions-cluster actions-cluster-primary">
        <button
          type="button"
          className="btn secondary"
          data-action="run-refine"
          disabled={runRefineBtnDisabled}
          onClick={(e) => runPanelAction('run-refine', e.currentTarget, e.nativeEvent)}
        >
          {isRefining ? (
            <>
              <span className="spinner" />
              <span>{runRefineLabel}</span>
            </>
          ) : (
            <>
              <IconHtml html={ICON_SPARK} />
              <span>{runRefineLabel}</span>
            </>
          )}
        </button>
        <button
          type="button"
          className={`btn primary${copyEnabled ? '' : ' disabled'}`}
          data-action="copy"
          data-role="copy-button"
          disabled={!copyEnabled}
          onClick={(e) => runPanelAction('copy', e.currentTarget, e.nativeEvent)}
        >
          <IconHtml html={ICON_COPY} />
          <span>复制</span>
        </button>
      </div>
    </div>
  );
}
