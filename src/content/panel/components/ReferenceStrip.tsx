import type { PanelState } from '../state';
import { panelReferenceUrls } from '../state';
import { runPanelAction } from '../panelActionBridge';

export type ReferenceStripProps = {
  state: PanelState;
  removable: boolean;
};

export function ReferenceStrip({ state, removable }: ReferenceStripProps) {
  const urls = panelReferenceUrls(state);
  if (urls.length === 0) {
    return <div className="ref-strip ref-strip-empty" data-role="ref-strip" />;
  }
  return (
    <div className="ref-strip" data-role="ref-strip">
      {urls.map((u, i) => (
        <div className="ref-item" key={`${i}-${u.slice(0, 48)}`}>
          {removable ? (
            <button
              type="button"
              className="ref-remove"
              data-action="remove-reference"
              data-index={String(i)}
              title="移除"
              onClick={(e) => runPanelAction('remove-reference', e.currentTarget, e.nativeEvent)}
            >
              ×
            </button>
          ) : null}
          <img src={u} alt="" />
        </div>
      ))}
    </div>
  );
}
