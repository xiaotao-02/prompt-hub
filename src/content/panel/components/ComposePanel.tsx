import type { ChangeEvent } from 'react';
import { appendReferenceUrl, MAX_REFERENCE_IMAGES } from '@/lib/referenceImages';
import { composeVideoPickerHtml, listViewportVideos } from '@/content/videoSegmentSample';
import type { PanelState } from '../state';
import {
  getComposeCollectMode,
  clampComposeSelectedVideoIndex,
  panelReferenceUrls,
  currentState,
} from '../state';
import { renderPanelFromState } from '../panelRenderBridge';
import { runPanelAction } from '../panelActionBridge';
import { PanelHeader } from './PanelHeader';
import { ReferenceStrip } from './ReferenceStrip';
import { StrategyDropdown } from './StrategyDropdown';

export type ComposePanelProps = {
  state: PanelState;
};

export function ComposePanel({ state }: ComposePanelProps) {
  const urls = panelReferenceUrls(state);
  const canRun = urls.length > 0;
  const atCap = urls.length >= MAX_REFERENCE_IMAGES;
  const composeHasVideos = listViewportVideos().length > 0;
  const collectMode = getComposeCollectMode();
  const imageModeActive = collectMode === 'image';
  const videoModeActive = collectMode === 'video';
  const videoPickerHtml = composeVideoPickerHtml(
    clampComposeSelectedVideoIndex(listViewportVideos().length),
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inp = e.target;
    const file = inp.files?.[0];
    inp.value = '';
    const st = currentState;
    if (!file || !st || st.status !== 'compose') return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const cur = currentState;
      if (!dataUrl || !cur || cur.status !== 'compose') return;
      const prev = panelReferenceUrls(cur);
      if (prev.length >= MAX_REFERENCE_IMAGES) return;
      const next = appendReferenceUrl(prev, dataUrl);
      if (next.length === prev.length) return;
      renderPanelFromState({ ...cur, imageUrls: next, imageUrl: next[0] || cur.imageUrl });
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <PanelHeader dotClass="success" title="收集参考图" />
      <div className="body compose-body">
        <ReferenceStrip state={state} removable />
        <div className="compose-mode-tabs" role="tablist" aria-label="参考收集方式">
          <button
            type="button"
            role="tab"
            className="compose-mode-tab"
            data-action="compose-set-mode"
            data-mode="image"
            aria-selected={imageModeActive}
            onClick={(e) => runPanelAction('compose-set-mode', e.currentTarget, e.nativeEvent)}
          >
            收集图片
          </button>
          <button
            type="button"
            role="tab"
            className="compose-mode-tab"
            data-action="compose-set-mode"
            data-mode="video"
            aria-selected={videoModeActive}
            onClick={(e) => runPanelAction('compose-set-mode', e.currentTarget, e.nativeEvent)}
          >
            采集视频帧
          </button>
        </div>
        <p className="compose-ref-count">
          当前 {urls.length} / {MAX_REFERENCE_IMAGES} 张
        </p>
        <div className="compose-pane compose-pane-image" role="tabpanel" hidden={!imageModeActive}>
          <div className="compose-toolbar">
            <input
              type="text"
              className="ref-url-input"
              data-role="ref-url-input"
              placeholder="粘贴图片 URL 后点击添加"
              disabled={atCap}
            />
            <div className="compose-toolbar-actions">
              <button
                type="button"
                className="btn ghost sm"
                data-action="add-ref-url"
                disabled={atCap}
                onClick={(e) => runPanelAction('add-ref-url', e.currentTarget, e.nativeEvent)}
              >
                添加
              </button>
              <button
                type="button"
                className="btn ghost sm"
                data-action="pick-ref-file"
                disabled={atCap}
                onClick={(e) => runPanelAction('pick-ref-file', e.currentTarget, e.nativeEvent)}
              >
                本地图片
              </button>
              <input
                type="file"
                className="ref-file-input-hidden"
                data-role="ref-file-input"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>
          <p className="compose-hint">
            粘贴 URL
            或选择本地图片；页内图片右键「添加参考」可继续收集。下方可生成提示词，或提取材质 /
            提取风格。
          </p>
        </div>
        <div className="compose-pane compose-pane-video" role="tabpanel" hidden={!videoModeActive}>
          <div className="compose-video-segment">
            <div className="compose-video-row">
              <span className="compose-video-segment-label">视频片段（秒）</span>
              <input
                type="number"
                className="compose-video-time-input"
                data-role="video-seg-start"
                step="any"
                inputMode="decimal"
                placeholder="起始 x"
                aria-label="片段起始秒"
              />
              <span className="compose-video-seg-tilde">～</span>
              <input
                type="number"
                className="compose-video-time-input"
                data-role="video-seg-end"
                step="any"
                inputMode="decimal"
                placeholder="结束 y"
                aria-label="片段结束秒"
              />
            </div>
            <div className="compose-video-row">
              <div dangerouslySetInnerHTML={{ __html: videoPickerHtml }} />
            </div>
            <div className="compose-video-actions">
              <button
                type="button"
                className="btn ghost sm"
                data-action="sample-video-segment-to-refs"
                disabled={!composeHasVideos}
                onClick={(e) =>
                  runPanelAction('sample-video-segment-to-refs', e.currentTarget, e.nativeEvent)
                }
              >
                采样到参考
              </button>
              <button
                type="button"
                className="btn primary sm"
                data-action="extract-video-segment"
                disabled={!composeHasVideos}
                onClick={(e) =>
                  runPanelAction('extract-video-segment', e.currentTarget, e.nativeEvent)
                }
              >
                时间段反推
              </button>
            </div>
          </div>
          <p className="compose-hint">
            {composeHasVideos
              ? '填写起止秒并选择页面视频；「采样到参考」将帧加入上方列表，「时间段反推」按分镜输出多条提示词。'
              : '当前视口内没有可用的 HTML5 视频。请打开含视频的页面后再试，或对视频右键「添加视频参考」。'}
          </p>
        </div>
        <div className="compose-meta">
          <StrategyDropdown currentStrategy={state.strategy} />
        </div>
        <div className="actions compose-actions">
          <button
            type="button"
            className="btn ghost sm"
            data-action="run-extract-material"
            disabled={!canRun}
            onClick={(e) => runPanelAction('run-extract-material', e.currentTarget, e.nativeEvent)}
          >
            提取材质
          </button>
          <button
            type="button"
            className="btn ghost sm"
            data-action="run-extract-style"
            disabled={!canRun}
            onClick={(e) => runPanelAction('run-extract-style', e.currentTarget, e.nativeEvent)}
          >
            提取风格
          </button>
          <button
            type="button"
            className="btn primary"
            data-action="run-extract"
            disabled={!canRun}
            onClick={(e) => runPanelAction('run-extract', e.currentTarget, e.nativeEvent)}
          >
            生成提示词
          </button>
        </div>
      </div>
    </>
  );
}
