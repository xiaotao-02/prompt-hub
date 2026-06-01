import { parseExtractJobSentinel } from '@/lib/streamVersionSentinels';
import type { PanelState } from '../state';
import { panelExtractJobs, panelHasActiveRefine, panelRefineJobs } from '../state';
import { successEditorDisplayedText } from '../editorText';
import { PanelHeader } from './PanelHeader';
import { ReferenceStrip } from './ReferenceStrip';
import { PromptEditor } from './PromptEditor';
import { MetaRow, type MetaRowJumpToOriginal } from './MetaRow';
import { RefineBlock } from './RefineBlock';
import { ActionsBar } from './ActionsBar';
import { VersionListItems } from './VersionList';
import { VersionsSidebar, versionsRowChrome } from './VersionsSidebar';

export type PanelSuccessBodyProps = {
  state: PanelState;
  /** header 标题：网页浮窗「提示词已生成」/ 库浮窗「提示词库编辑」 */
  title: string;
  /** 库浮窗提供关闭回调；网页浮窗不传（无 header 关闭按钮） */
  onClose?: () => void;
  /** 参考图是否可删：网页浮窗 true，库浮窗 false */
  referenceRemovable?: boolean;
  /** 隐藏「重新生成」：库浮窗 true */
  hideRetry?: boolean;
  /** 库浮窗专属：MetaRow 末尾渲染「跳转原图」而非「提示词库」 */
  jumpToOriginal?: MetaRowJumpToOriginal;
};

/**
 * 成功态正文：网页浮窗 SuccessPanel 与提示词库浮窗共用的单一实现。
 * 差异全部通过 props 注入，UI 改一处两边同步更新。
 */
export function PanelSuccessBody({
  state,
  title,
  onClose,
  referenceRemovable,
  hideRetry,
  jumpToOriginal,
}: PanelSuccessBodyProps) {
  const versions = state.versions || [];
  const versionCount = versions.length;
  const refining = panelHasActiveRefine(state);
  const streamingExtract = panelExtractJobs(state).length > 0;
  const extractStreamingUi =
    streamingExtract && parseExtractJobSentinel(state.selectedVersionId ?? undefined) != null;
  const editorLocked = refining || extractStreamingUi;
  const versionsDisplayCount =
    versionCount + panelRefineJobs(state).length + panelExtractJobs(state).length;
  const draft = state.draft ?? state.prompt ?? '';
  const dirty = refining ? false : draft !== (state.prompt ?? '');
  const editorContent = state.draft ?? state.prompt ?? '';
  const successEditorBody = successEditorDisplayedText(state);
  const { openClassSuffix } = versionsRowChrome(state, versions);

  const providerBadge = state.provider || '';
  const modelSuffix = state.model ? ` · ${state.model}` : '';

  let editorPlaceholder = '可在此修改提示词…';
  if (refining) editorPlaceholder = '正在接收 AI 调整后的提示词…';
  else if (extractStreamingUi) editorPlaceholder = '正在接收模型回复…';

  return (
    <>
      <PanelHeader
        dotClass="success"
        title={title}
        badges={
          <span className="badge">
            {providerBadge}
            {modelSuffix}
          </span>
        }
        onClose={onClose}
      />
      <div className={`panel-row${openClassSuffix}`}>
        <VersionsSidebar
          state={state}
          versions={versions}
          listContent={<VersionListItems state={state} />}
        />
        <div className="body">
          <div className="thumb ref-thumb-wrap">
            <ReferenceStrip state={state} removable={!!referenceRemovable} />
          </div>
          <PromptEditor
            state={state}
            displayedText={successEditorBody}
            readonly={editorLocked}
            placeholder={editorPlaceholder}
          />
          <MetaRow
            state={state}
            versionCount={versionsDisplayCount}
            dirty={dirty}
            disableHistory={versionCount === 0 && !refining && !streamingExtract}
            jumpToOriginal={jumpToOriginal}
          />
          <RefineBlock state={state} />
          <ActionsBar
            dirty={dirty}
            oneClickRefineRandomness={state.oneClickRefineRandomness}
            oneClickRefineControlsDisabled={refining || editorContent.trim().length === 0}
            hideRetry={hideRetry}
          />
        </div>
      </div>
    </>
  );
}
