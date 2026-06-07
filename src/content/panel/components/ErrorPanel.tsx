import type { PanelState } from '../state';
import { runPanelAction } from '../panelActionBridge';
import { PanelHeader } from './PanelHeader';
import { ReferenceStrip } from './ReferenceStrip';

export type ErrorPanelProps = {
  state: PanelState;
};

export function ErrorPanel({ state }: ErrorPanelProps) {
  return (
    <>
      <PanelHeader dotClass="error" title="提取失败" />
      <div className="body">
        <div className="thumb ref-thumb-wrap">
          <ReferenceStrip state={state} removable />
        </div>
        <div className="error-msg">{state.error || '未知错误'}</div>
        <div className="actions">
          <div className="actions-cluster actions-cluster-secondary">
            <button
              type="button"
              className="btn ghost"
              data-action="open-options"
              onClick={(e) => runPanelAction('open-options', e.currentTarget, e.nativeEvent)}
            >
              打开设置
            </button>
          </div>
          <div className="actions-cluster actions-cluster-primary">
            <button
              type="button"
              className="btn primary"
              data-action="retry"
              onClick={(e) => runPanelAction('retry', e.currentTarget, e.nativeEvent)}
            >
              重试
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
