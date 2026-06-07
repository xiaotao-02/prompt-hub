import { useEffect, type ChangeEvent } from 'react';
import { appendReferenceUrl, MAX_REFERENCE_IMAGES } from '@/lib/referenceImages';
import { listViewportVideos } from '@/content/videoSegmentSample';
import type { PanelState } from '../state';
import {
  getComposeCollectMode,
  clampComposeSelectedVideoIndex,
  panelReferenceUrls,
  currentState,
  setComposeCollectMode,
  getComposeVideoSegStart,
  getComposeVideoSegEnd,
  setComposeVideoSegStart,
  setComposeVideoSegEnd,
  applyDefaultComposeVideoSegment,
} from '../state';
import { renderPanelFromState } from '../panelRenderBridge';
import { runPanelAction } from '../panelActionBridge';
import { PanelHeader } from './PanelHeader';
import { ReferenceStrip } from './ReferenceStrip';
import { StrategyDropdown } from './StrategyDropdown';
import { OutputStyleDropdown } from './OutputStyleDropdown';
import { ComposeVideoStudio } from './ComposeVideoStudio';

export type ComposePanelProps = {
  state: PanelState;
};

function ComposeRefDropzoneEmpty() {
  return (
    <div className="compose-dropzone" role="status">
      <span className="compose-dropzone-icon" aria-hidden>
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
          <path d="M3 16l5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="compose-dropzone-title">暂无参考图</span>
      <span className="compose-dropzone-hint">粘贴 URL、选择本地图片，或页内右键「添加参考」</span>
    </div>
  );
}

export function ComposePanel({ state }: ComposePanelProps) {
  const urls = panelReferenceUrls(state);
  const canRun = urls.length > 0;
  const atCap = urls.length >= MAX_REFERENCE_IMAGES;
  const viewportVideos = listViewportVideos();
  const composeHasVideos = viewportVideos.length > 0;
  const collectMode = getComposeCollectMode();
  const effectiveMode = composeHasVideos ? collectMode : 'image';
  const imageModeActive = effectiveMode === 'image';
  const videoModeActive = effectiveMode === 'video';
  const videoIndex = clampComposeSelectedVideoIndex(viewportVideos.length);
  const segStart = getComposeVideoSegStart();
  const segEnd = getComposeVideoSegEnd();

  useEffect(() => {
    if (!composeHasVideos) {
      if (getComposeCollectMode() === 'video') {
        setComposeCollectMode('image');
      }
      return;
    }
    if (effectiveMode !== 'video') return;
    const before = getComposeVideoSegStart();
    applyDefaultComposeVideoSegment(videoIndex);
    if (before !== getComposeVideoSegStart() && currentState?.status === 'compose') {
      renderPanelFromState(currentState);
    }
  }, [composeHasVideos, effectiveMode, videoIndex]);

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

  const handleSegStartChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setComposeVideoSegStart(null);
      return;
    }
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n)) setComposeVideoSegStart(n);
  };

  const handleSegEndChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setComposeVideoSegEnd(null);
      return;
    }
    const n = Number.parseFloat(raw);
    if (Number.isFinite(n)) setComposeVideoSegEnd(n);
  };

  const outputSectionTitle = videoModeActive ? '输出设置 · 作用于已采集参考' : '输出设置';

  return (
    <>
      <PanelHeader
        dotClass="success"
        title="收集参考图"
        headerExtra={
          composeHasVideos ? (
            <div className="compose-header-tabs" role="tablist" aria-label="参考收集方式">
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
          ) : undefined
        }
      />
      <div className="body compose-body">
        <div className="compose-pane compose-pane-image" role="tabpanel" hidden={!imageModeActive}>
          <div className="compose-card compose-collect-card">
            <div className="compose-card-head">
              <span className="compose-section-title">参考图</span>
              <span className="compose-count-pill">
                {urls.length} / {MAX_REFERENCE_IMAGES}
              </span>
            </div>
            <div className="compose-card-body">
              {urls.length === 0 ? <ComposeRefDropzoneEmpty /> : null}
              <ReferenceStrip state={state} removable />
            </div>
            <div className="compose-card-foot">
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
            </div>
          </div>
          <p className="compose-caption">
            粘贴 URL
            或选择本地图片；页内图片右键「添加参考」可继续收集。下方可生成提示词，或提取材质 /
            提取风格。
          </p>
        </div>

        {composeHasVideos ? (
          <div
            className="compose-pane compose-pane-video"
            role="tabpanel"
            hidden={!videoModeActive}
          >
            <ComposeVideoStudio
              videoIndex={videoIndex}
              segStart={segStart}
              segEnd={segEnd}
              onSegStartChange={handleSegStartChange}
              onSegEndChange={handleSegEndChange}
            />
          </div>
        ) : null}

        {videoModeActive ? (
          <section className="compose-section compose-refs-section" aria-label="已采集参考">
            <div className="compose-section-head">
              <span className="compose-section-title">已采集参考</span>
              <span className="compose-count-pill">
                {urls.length} / {MAX_REFERENCE_IMAGES}
              </span>
            </div>
            <ReferenceStrip state={state} removable compact />
          </section>
        ) : null}

        <section className="compose-section compose-output" aria-label="输出设置">
          <p className="compose-section-title compose-output-title">{outputSectionTitle}</p>
          <div className="compose-output-row">
            <StrategyDropdown currentStrategy={state.strategy} />
            <OutputStyleDropdown currentStyle={state.outputStyle} />
          </div>
        </section>

        <div className="actions compose-actions">
          <div className="actions-cluster actions-cluster-secondary">
            <button
              type="button"
              className="btn ghost sm"
              data-action="run-extract-material"
              disabled={!canRun}
              onClick={(e) =>
                runPanelAction('run-extract-material', e.currentTarget, e.nativeEvent)
              }
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
          </div>
          <div className="actions-cluster actions-cluster-primary">
            <button
              type="button"
              className="btn primary compose-primary-cta"
              data-action="run-extract"
              disabled={!canRun}
              onClick={(e) => runPanelAction('run-extract', e.currentTarget, e.nativeEvent)}
            >
              生成提示词
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
