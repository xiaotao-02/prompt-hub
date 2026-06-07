import type { MouseEvent } from 'react';
import type { PromptVersion } from '@/lib/types';
import { STRATEGY_LABELS, type StrategyId } from '@/lib/strategies-meta';
import { providerModelChipLabel, strategyChipLabel } from '@/lib/versionChipLabels';
import { getVersionOrdinalLabel } from '@/lib/versionLabel';
import { formatTime } from '@/lib/format/time';
import { getCachedVersionsListDensity, previewMaxLen } from '@/lib/versionsListDensity';
import { versionListPreviewText, versionListReferencePrompt } from '@/lib/versionPreview';
import {
  extractStreamSentinelForJob,
  refineStreamSentinelForJob,
} from '@/lib/streamVersionSentinels';
import type { PanelState, PanelRefineJob } from '../state';
import { panelExtractJobs, panelRefineJobs } from '../state';
import { runPanelAction } from '../panelActionBridge';
import { IconHtml } from './IconHtml';
import { ICON_COPY, ICON_RESTORE, ICON_TRASH } from '../icons';

function sourceLabel(s: PromptVersion['source']): string {
  if (s === 'extracted') return '反推';
  if (s === 'edited') return '手动编辑';
  if (s === 'refined') return 'AI 调整';
  return '恢复';
}

type VersionItemProps = {
  v: PromptVersion;
  index: number;
  total: number;
  editorContent: string;
  selectedVersionId?: string;
  fallbackMeta?: {
    provider?: string;
    model?: string;
    strategy?: StrategyId;
    previewLen?: number;
    referencePrompt?: string;
  };
};

function VersionItem({
  v,
  index,
  total,
  editorContent,
  selectedVersionId,
  fallbackMeta,
}: VersionItemProps) {
  const isCurrent = index === 0;
  const time = formatTime(v.createdAt);
  const tag = sourceLabel(v.source);
  const ord = getVersionOrdinalLabel(v.versionNo, isCurrent);
  const maxLen = fallbackMeta?.previewLen ?? previewMaxLen(getCachedVersionsListDensity(), 'panel');
  const { text: preview, truncated: previewTruncated } = versionListPreviewText(
    v.prompt,
    fallbackMeta?.referencePrompt,
    maxLen,
  );
  const previewSuffix = previewTruncated ? '…' : '';
  const provider = v.meta?.provider ?? fallbackMeta?.provider;
  const model = v.meta?.model ?? fallbackMeta?.model;
  const strategy = v.meta?.strategy ?? fallbackMeta?.strategy;
  const selected =
    selectedVersionId != null && selectedVersionId !== ''
      ? v.id === selectedVersionId
      : v.prompt === editorContent;
  const compact = getCachedVersionsListDensity() === 'compact';
  const modelChip = provider && model ? providerModelChipLabel(provider, model) : undefined;

  const handleSelect = (e: MouseEvent<HTMLLIElement>) => {
    runPanelAction('select-version', e.currentTarget, e.nativeEvent);
  };

  const stopAndRun = (action: string) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    runPanelAction(action, e.currentTarget, e.nativeEvent);
  };

  if (compact) {
    const deleteBtn =
      total > 1 ? (
        <button
          type="button"
          className="link-btn danger delete-btn"
          data-action="delete-version"
          data-version-id={v.id}
          title={isCurrent ? '删除当前版本（下一条版本将顶替为当前）' : '删除此版本'}
          onClick={stopAndRun('delete-version')}
        >
          <IconHtml html={ICON_TRASH} />
        </button>
      ) : null;
    return (
      <li
        className={`version-item version-item--rail version-item--compact${isCurrent ? ' current' : ''}${selected ? ' selected' : ''}`}
        data-action="select-version"
        data-version-id={v.id}
        data-source={v.source}
        role="button"
        tabIndex={0}
        title="点击切换到此版本"
        onClick={handleSelect}
      >
        <div className="version-compact-row">
          <span className={`version-ord ${ord.kind}`}>{ord.label}</span>
          <span className="version-preview">
            {preview}
            {previewSuffix}
          </span>
          <div className="version-actions">
            <button
              type="button"
              className="link-btn"
              data-action="copy-version"
              data-version-id={v.id}
              onClick={stopAndRun('copy-version')}
            >
              <IconHtml html={ICON_COPY} />
              <span>复制</span>
            </button>
            {deleteBtn}
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`version-item version-item--rail${isCurrent ? ' current' : ''}${selected ? ' selected' : ''}`}
      data-action="select-version"
      data-version-id={v.id}
      data-source={v.source}
      role="button"
      tabIndex={0}
      title="点击切换到此版本"
      onClick={handleSelect}
    >
      <div className="version-head">
        <span className={`version-ord ${ord.kind}`}>{ord.label}</span>
        <span className={`version-tag ${v.source}`}>{tag}</span>
        {strategy ? (
          <span className="version-strategy" title={STRATEGY_LABELS[strategy] ?? strategy}>
            {strategyChipLabel(strategy)}
          </span>
        ) : null}
        {modelChip ? (
          <span className="version-meta" title={modelChip.full}>
            {modelChip.short}
          </span>
        ) : null}
        <span className="version-time">{time}</span>
      </div>
      <div className="version-preview">
        {preview}
        {previewSuffix}
      </div>
      <div className="version-actions">
        <button
          type="button"
          className="link-btn"
          data-action="copy-version"
          data-version-id={v.id}
          onClick={stopAndRun('copy-version')}
        >
          <IconHtml html={ICON_COPY} />
          <span>复制</span>
        </button>
        {!isCurrent ? (
          <button
            type="button"
            className="link-btn restore-btn"
            data-action="restore-version"
            data-version-id={v.id}
            title="恢复此版本"
            onClick={stopAndRun('restore-version')}
          >
            <IconHtml html={ICON_RESTORE} />
            <span>恢复</span>
          </button>
        ) : null}
        {total > 1 ? (
          <button
            type="button"
            className="link-btn danger delete-btn"
            data-action="delete-version"
            data-version-id={v.id}
            title={isCurrent ? '删除当前版本（下一条版本将顶替为当前）' : '删除此版本'}
            onClick={stopAndRun('delete-version')}
          >
            <IconHtml html={ICON_TRASH} />
          </button>
        ) : null}
      </div>
    </li>
  );
}

function ExtractPendingVersionRow({
  streamRequestId,
  state,
}: {
  streamRequestId: string;
  state: PanelState;
}) {
  const sentinel = extractStreamSentinelForJob(streamRequestId);
  const selected = state.selectedVersionId === sentinel;
  const compact = getCachedVersionsListDensity() === 'compact';
  const hint = '正在重新生成提示词，可切换到其它行预览历史版本…';

  const handleSelect = (e: MouseEvent<HTMLLIElement>) => {
    runPanelAction('select-version', e.currentTarget, e.nativeEvent);
  };

  if (compact) {
    return (
      <li
        className={`version-item version-item--rail version-item--compact refine-pending${selected ? ' selected' : ''}`}
        data-action="select-version"
        data-version-id={sentinel}
        data-source="pending"
        role="button"
        tabIndex={0}
        title="点击查看本次重新生成中的提示词"
        onClick={handleSelect}
      >
        <div className="version-compact-row">
          <span className="version-ord middle">生成中</span>
          <span className="version-preview">{hint}</span>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`version-item version-item--rail refine-pending${selected ? ' selected' : ''}`}
      data-action="select-version"
      data-version-id={sentinel}
      data-source="pending"
      role="button"
      tabIndex={0}
      title="点击查看本次重新生成中的提示词"
      onClick={handleSelect}
    >
      <div className="version-head">
        <span className="version-ord middle">生成中</span>
        <span className="version-tag extracted">反推</span>
        <span className="version-time">进行中</span>
      </div>
      <div className="version-preview">{hint}</div>
    </li>
  );
}

function RefinePendingVersionRow({ job, state }: { job: PanelRefineJob; state: PanelState }) {
  const sentinel = refineStreamSentinelForJob(job.jobId);
  const selected = state.selectedVersionId === sentinel;
  const compact = getCachedVersionsListDensity() === 'compact';
  const preview =
    job.kind === 'oneClick'
      ? '正在生成随机风格变体，可切换到其它行预览历史正文…'
      : '正在根据你的要求生成新版本，可切换到其它行预览历史正文…';

  const handleSelect = (e: MouseEvent<HTMLLIElement>) => {
    runPanelAction('select-version', e.currentTarget, e.nativeEvent);
  };

  if (compact) {
    return (
      <li
        className={`version-item version-item--rail version-item--compact refine-pending${selected ? ' selected' : ''}`}
        data-action="select-version"
        data-version-id={sentinel}
        data-source="pending"
        role="button"
        tabIndex={0}
        title="点击查看生成中的提示词"
        onClick={handleSelect}
      >
        <div className="version-compact-row">
          <span className="version-ord middle">生成中</span>
          <span className="version-preview">{preview}</span>
        </div>
      </li>
    );
  }

  const tagLabel = job.kind === 'oneClick' ? '随机风格' : 'AI 调整';
  return (
    <li
      className={`version-item version-item--rail refine-pending${selected ? ' selected' : ''}`}
      data-action="select-version"
      data-version-id={sentinel}
      data-source="pending"
      role="button"
      tabIndex={0}
      title="点击查看生成中的提示词"
      onClick={handleSelect}
    >
      <div className="version-head">
        <span className="version-ord middle">生成中</span>
        <span className="version-tag refined">{tagLabel}</span>
        <span className="version-time">进行中</span>
      </div>
      <div className="version-preview">{preview}</div>
    </li>
  );
}

export type VersionListItemsProps = {
  state: PanelState;
};

/** Builds the full versions `<ul>` children from panel state (pending slots + saved versions). */
export function VersionListItems({ state }: VersionListItemsProps) {
  const versions = state.versions || [];
  const editorContent = state.draft ?? state.prompt ?? '';
  const extractSlots =
    state.status === 'success' || (state.status === 'loading' && versions.length > 0)
      ? panelExtractJobs(state).map((j) => (
          <ExtractPendingVersionRow
            key={j.streamRequestId}
            streamRequestId={j.streamRequestId}
            state={state}
          />
        ))
      : [];
  const refineSlots = panelRefineJobs(state).map((j) => (
    <RefinePendingVersionRow key={j.jobId} job={j} state={state} />
  ));
  const previewLen = previewMaxLen(getCachedVersionsListDensity(), 'panel');
  const versionItems = versions.map((v, i) => (
    <VersionItem
      key={v.id}
      v={v}
      index={i}
      total={versions.length}
      editorContent={editorContent}
      selectedVersionId={state.selectedVersionId}
      fallbackMeta={{
        provider: state.provider,
        model: state.model,
        strategy: state.strategy,
        previewLen,
        referencePrompt: versionListReferencePrompt(versions, i),
      }}
    />
  ));

  return (
    <>
      {refineSlots}
      {extractSlots}
      {versionItems}
    </>
  );
}
