import { normalizeOneClickRefineRandomness } from '@/lib/oneClickRefine';
import type { OneClickRefineRandomness } from '@/lib/types';
import { runPanelAction } from '../panelActionBridge';
import { IconHtml } from './IconHtml';
import { ICON_COPY, ICON_REFRESH, ICON_SAVE } from '../icons';
import { OneClickRefineRandomnessDropdown } from './OneClickRefineRandomnessDropdown';

export type ActionsBarProps = {
  dirty: boolean;
  loading?: boolean;
  canCopy?: boolean;
  oneClickRefineRandomness?: OneClickRefineRandomness;
  oneClickRefineControlsDisabled?: boolean;
  /** 提示词库页内面板不展示「重新生成」 */
  hideRetry?: boolean;
};

export function ActionsBar({
  dirty,
  loading,
  canCopy,
  oneClickRefineRandomness,
  oneClickRefineControlsDisabled,
  hideRetry,
}: ActionsBarProps) {
  const isLoading = !!loading;
  const copyEnabled = canCopy ?? !isLoading;
  const rr = normalizeOneClickRefineRandomness(oneClickRefineRandomness);
  const oneClickRefineDisabled = isLoading || !!oneClickRefineControlsDisabled;

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
      {!hideRetry ? (
        <button
          type="button"
          className="btn ghost"
          data-action="retry"
          onClick={(e) => runPanelAction('retry', e.currentTarget, e.nativeEvent)}
        >
          <IconHtml html={ICON_REFRESH} />
          <span>重新生成</span>
        </button>
      ) : null}
      {oneClickRefineControl}
      <button
        type="button"
        className={`btn ${!isLoading && dirty ? 'primary' : 'ghost disabled'}`}
        data-action="save"
        disabled={isLoading || !dirty}
        onClick={(e) => runPanelAction('save', e.currentTarget, e.nativeEvent)}
      >
        <IconHtml html={ICON_SAVE} />
        <span>保存为新版本</span>
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
  );
}
