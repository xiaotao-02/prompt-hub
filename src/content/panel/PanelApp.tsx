import type { PanelState } from './state';
import { PanelAnnounce, usePanelEffects } from './hooks/usePanelEffects';
import { ComposePanel, ErrorPanel, LoadingPanel, SuccessPanel } from './components';

export type PanelAppProps = {
  state: PanelState;
  prevStatus?: PanelState['status'] | null;
};

export function PanelApp({ state, prevStatus = null }: PanelAppProps) {
  usePanelEffects(state, prevStatus);

  let content;
  if (state.status === 'loading') content = <LoadingPanel state={state} />;
  else if (state.status === 'error') content = <ErrorPanel state={state} />;
  else if (state.status === 'compose') content = <ComposePanel state={state} />;
  else content = <SuccessPanel state={state} />;

  return (
    <>
      <PanelAnnounce state={state} prevStatus={prevStatus} />
      <div key={state.status} className="panel-content-enter">
        {content}
      </div>
    </>
  );
}
