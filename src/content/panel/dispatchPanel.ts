import { currentState, setCurrentState } from './state';
import { panelReducer, type PanelEvent, type PanelStateTransition } from './panelReducer';

export function dispatchPanelEvent(event: PanelEvent): PanelStateTransition {
  return panelReducer(currentState, event);
}

/** 应用 reducer 结果并写入单例；返回新状态，未变更时返回 null。 */
export function commitPanelEvent(event: PanelEvent): PanelStateTransition['state'] | null {
  const transition = dispatchPanelEvent(event);
  if (!transition.changed) return null;
  setCurrentState(transition.state);
  return transition.state;
}
