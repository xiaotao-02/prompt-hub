import type { PanelState } from '../state';
import { PanelSuccessBody } from './PanelSuccessBody';

export type SuccessPanelProps = {
  state: PanelState;
};

export function SuccessPanel({ state }: SuccessPanelProps) {
  return <PanelSuccessBody state={state} title="提示词已生成" referenceRemovable />;
}
