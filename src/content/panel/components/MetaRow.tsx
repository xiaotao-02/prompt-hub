import type { PanelState } from '../state';
import { panelHasActiveRefine } from '../state';
import { runPanelAction } from '../panelActionBridge';
import { IconHtml } from './IconHtml';
import { ICON_HISTORY, ICON_JUMP_ORIGINAL, ICON_LIBRARY } from '../icons';
import { StrategyDropdown } from './StrategyDropdown';
import { OutputStyleDropdown } from './OutputStyleDropdown';
import { UI_ACTION } from '@/lib/uiCopy';

/** 库浮窗专属：MetaRow 末尾渲染「跳转原图」按钮（替代网页浮窗的「提示词库」按钮）。 */
export type MetaRowJumpToOriginal = {
  pageUrl?: string;
  onJump?: () => void;
  busy?: boolean;
};

export type MetaRowProps = {
  state: PanelState;
  versionCount: number;
  dirty: boolean;
  disableHistory?: boolean;
  disableLibrary?: boolean;
  /** 提供时渲染「跳转原图」（库浮窗），否则渲染「提示词库」（网页浮窗）。 */
  jumpToOriginal?: MetaRowJumpToOriginal;
};

export function MetaRow({
  state,
  versionCount,
  dirty,
  disableHistory,
  disableLibrary,
  jumpToOriginal,
}: MetaRowProps) {
  const historyDisabled = disableHistory || versionCount === 0;
  const libraryDisabled = !!disableLibrary;
  const showDirty = !panelHasActiveRefine(state) && dirty;

  const pageUrl = jumpToOriginal?.pageUrl;
  const canJump = !!pageUrl && /^https?:/i.test(pageUrl);

  return (
    <div className="meta-row">
      <div className="meta-left">
        <div className="meta-group meta-group-nav">
          <button
            type="button"
            className={`link-btn${state.versionsOpen ? ' active' : ''}`}
            data-action="toggle-versions"
            disabled={historyDisabled}
            onClick={(e) => runPanelAction('toggle-versions', e.currentTarget, e.nativeEvent)}
          >
            <IconHtml html={ICON_HISTORY} />
            <span>历史版本 · {versionCount}</span>
          </button>
          {jumpToOriginal ? (
            <button
              type="button"
              className="link-btn"
              title={canJump ? UI_ACTION.jumpToOriginalTitle : '该记录没有可用的原图网页地址'}
              disabled={!canJump || jumpToOriginal.busy}
              onClick={() => jumpToOriginal.onJump?.()}
            >
              <IconHtml html={ICON_JUMP_ORIGINAL} />
              <span>{jumpToOriginal.busy ? '跳转中…' : UI_ACTION.jumpToOriginal}</span>
            </button>
          ) : (
            <button
              type="button"
              className="link-btn"
              data-action="open-in-library"
              title="跳转到提示词库，进行更完整的编辑、备注、版本管理"
              disabled={libraryDisabled}
              onClick={(e) => runPanelAction('open-in-library', e.currentTarget, e.nativeEvent)}
            >
              <IconHtml html={ICON_LIBRARY} />
              <span>提示词库</span>
            </button>
          )}
        </div>
        <span className="meta-divider" aria-hidden="true" />
        <div className="meta-group meta-group-settings">
          <StrategyDropdown currentStrategy={state.strategy} />
          <OutputStyleDropdown currentStyle={state.outputStyle} />
        </div>
      </div>
      <span className={`dirty-hint${showDirty ? ' show' : ''}`}>已修改，未保存</span>
    </div>
  );
}
