import type { PanelState } from '../state';
import { panelExtractJobs, panelRefineJobs } from '../state';
import {
  stageLabel,
  stageHint,
  stageProgress,
  formatElapsed,
  strategyLabel,
  extractStreamModeForUi,
} from '../loading';
import { loadingEditorDisplayedText } from '../editorText';
import { ModelDropdown } from './ModelDropdown';
import { PanelHeader } from './PanelHeader';
import { ReferenceStrip } from './ReferenceStrip';
import { PromptEditor } from './PromptEditor';
import { MetaRow } from './MetaRow';
import { RefineBlock } from './RefineBlock';
import { ActionsBar } from './ActionsBar';
import { VersionListItems } from './VersionList';
import { VersionsSidebar, versionsRowChrome } from './VersionsSidebar';

export type LoadingPanelProps = {
  state: PanelState;
};

export function LoadingPanel({ state }: LoadingPanelProps) {
  const versions = state.versions || [];
  const versionCount = versions.length;
  const extractSidebarCount = versionCount > 0 ? panelExtractJobs(state).length : 0;
  const versionsDisplayCount = versionCount + extractSidebarCount + panelRefineJobs(state).length;
  const anyExtractPartial = panelExtractJobs(state).some((j) => !!(j.partial ?? '').trim());
  const hasPartial =
    anyExtractPartial || !!(state.partial ?? '').trim() || !!state.extractBaselinePrompt?.trim();
  const pct = Math.round(stageProgress(state.stage, hasPartial) * 100);
  const elapsed = state.startedAt != null ? formatElapsed(Date.now() - state.startedAt) : '0.0s';
  const stratLabel = strategyLabel(state.strategy);
  const canCopyLoading = hasPartial || !!state.extractBaselinePrompt?.trim();
  const loadingEditorBody = loadingEditorDisplayedText(state);
  const { openClassSuffix } = versionsRowChrome(state, versions);

  return (
    <>
      <PanelHeader
        dotClass="loading"
        title={<span data-role="stage-label">{stageLabel(state.stage)}</span>}
        badges={
          <>
            <ModelDropdown state={state} />
            <span
              className={`badge strategy-badge${stratLabel ? '' : ' hidden'}`}
              data-role="strategy-badge"
            >
              {stratLabel ? `策略：${stratLabel}` : ''}
            </span>
          </>
        }
      />
      <div className={`panel-row${openClassSuffix}`}>
        <VersionsSidebar
          state={state}
          versions={versions}
          listContent={<VersionListItems state={state} />}
        />
        <div className="body">
          <div className="thumb ref-thumb-wrap">
            <ReferenceStrip state={state} removable={false} />
          </div>
          <div className="loader-wrap">
            <div className="bar progress">
              <span data-role="bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="hint hint-row">
              <span data-role="stage-hint">
                {stageHint(state.stage, hasPartial, extractStreamModeForUi(state))}
              </span>
              <span className="elapsed" data-role="elapsed">
                {elapsed}
              </span>
            </div>
          </div>
          <PromptEditor
            state={state}
            displayedText={loadingEditorBody}
            readonly
            placeholder="正在接收模型回复…"
          />
          <MetaRow
            state={state}
            versionCount={versionsDisplayCount}
            dirty={false}
            disableHistory={versionCount === 0}
            disableLibrary
          />
          <RefineBlock state={state} />
          <ActionsBar
            loading
            canCopy={canCopyLoading}
            dirty={false}
            refining={false}
            runRefineDisabled
            runRefineIdleLabel="生成后可调整"
          />
        </div>
      </div>
    </>
  );
}
