import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { MAX_REFERENCE_IMAGES } from '@/lib/referenceImages';
import {
  formatVideoSegmentInputSec,
  generateVideoFilmstrip,
  resolveComposeVideoPreviewSource,
  resolveViewportVideoAtIndex,
} from '@/content/videoSegmentSample';
import { currentState, setComposeVideoSegEnd, setComposeVideoSegStart } from '../state';
import { renderPanelFromState } from '../panelRenderBridge';
import { runPanelAction } from '../panelActionBridge';
import { ComposeVideoPicker } from './ComposeVideoPicker';

const MIN_SEGMENT_SPAN = 1 / 240;
const SAMPLE_TO_REFS_HINT = '按当前选区在视频内采样多帧，并加入下方「已采集参考」列表。';
const FILMSTRIP_FRAME_COUNT = 10;
const SCRUB_DRAG_THRESHOLD_PX = 3;
const SCRUB_PIXELS_PER_FULL_SPAN = 240;

export type ComposeVideoStudioProps = {
  videoIndex: number;
  segStart: number | null;
  segEnd: number | null;
  onSegStartChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSegEndChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

function clampPreviewTime(timeSec: number, dur: number): number {
  if (!Number.isFinite(timeSec)) return 0;
  if (!Number.isFinite(dur) || dur <= 0) return Math.max(0, timeSec);
  return Math.min(Math.max(0, timeSec), dur);
}

function estimateSegmentFrameCount(startSec: number, endSec: number): number {
  const span = endSec - startSec;
  if (span <= 0 || !Number.isFinite(span)) return 0;
  return Math.min(MAX_REFERENCE_IMAGES, Math.max(2, Math.ceil(span * 2)));
}

function formatSegmentSpan(startSec: number, endSec: number): string {
  const span = endSec - startSec;
  if (!Number.isFinite(span) || span <= 0) return '0s';
  return `${span.toFixed(2).replace(/\.?0+$/, '')}s`;
}

function clientXToTime(clientX: number, trackEl: HTMLElement | null, dur: number): number {
  if (!trackEl || !dur) return 0;
  const rect = trackEl.getBoundingClientRect();
  const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  return pct * dur;
}

function formatClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const totalSec = Math.floor(sec);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ComposeVideoStudio({
  videoIndex,
  segStart,
  segEnd,
  onSegStartChange,
  onSegEndChange,
}: ComposeVideoStudioProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const dragKindRef = useRef<'start' | 'end' | null>(null);

  const [loadFailed, setLoadFailed] = useState(false);
  const [debouncedStartSec, setDebouncedStartSec] = useState(segStart ?? 0);
  const [playheadSec, setPlayheadSec] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [filmstripFrames, setFilmstripFrames] = useState<string[]>([]);
  const [filmstripLoading, setFilmstripLoading] = useState(false);
  const [dragPreview, setDragPreview] = useState<{ start: number; end: number } | null>(null);
  const [scrubbingInput, setScrubbingInput] = useState<'start' | 'end' | null>(null);

  const pageVideo = resolveViewportVideoAtIndex(videoIndex);
  const previewSource = pageVideo ? resolveComposeVideoPreviewSource(pageVideo, videoIndex) : null;

  const effectiveStart = dragPreview?.start ?? segStart ?? 0;
  const effectiveEnd = dragPreview?.end ?? segEnd ?? (duration > 0 ? duration : 0);

  const commitSegment = useCallback((start: number, end: number) => {
    setComposeVideoSegStart(start);
    setComposeVideoSegEnd(end);
    const st = currentState;
    if (st?.status === 'compose') renderPanelFromState(st);
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedStartSec(segStart ?? 0);
    }, 200);
    return () => window.clearTimeout(handle);
  }, [segStart]);

  useEffect(() => {
    setLoadFailed(false);
  }, [previewSource?.src, videoIndex]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !previewSource?.src) return;

    const onMeta = () => {
      const dur = el.duration;
      if (Number.isFinite(dur) && dur > 0) setDuration(dur);
    };

    const onTimeUpdate = () => {
      setPlayheadSec(el.currentTime);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('durationchange', onMeta);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    if (el.readyState >= HTMLMediaElement.HAVE_METADATA) onMeta();
    setIsPlaying(!el.paused);

    return () => {
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('durationchange', onMeta);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [previewSource?.src, videoIndex]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !previewSource?.src) return;

    const seekToStart = () => {
      try {
        el.currentTime = clampPreviewTime(debouncedStartSec, el.duration);
      } catch {
        /* ignore seek errors on unloaded media */
      }
    };

    if (el.readyState >= HTMLMediaElement.HAVE_METADATA) {
      seekToStart();
      return;
    }

    el.addEventListener('loadedmetadata', seekToStart, { once: true });
    return () => el.removeEventListener('loadedmetadata', seekToStart);
  }, [previewSource?.src, debouncedStartSec, videoIndex]);

  useEffect(() => {
    let cancelled = false;
    const video = resolveViewportVideoAtIndex(videoIndex);
    if (!video) {
      setFilmstripFrames([]);
      setFilmstripLoading(false);
      return;
    }

    setFilmstripLoading(true);
    void generateVideoFilmstrip(video, FILMSTRIP_FRAME_COUNT).then((frames) => {
      if (cancelled) return;
      setFilmstripFrames(frames);
      setFilmstripLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [videoIndex]);

  const percentToTime = useCallback(
    (clientX: number): number => clientXToTime(clientX, trackRef.current, duration),
    [duration],
  );

  const seekFromClientX = useCallback(
    (clientX: number, trackEl: HTMLElement | null) => {
      if (!duration || !videoRef.current) return;
      const t = clampPreviewTime(clientXToTime(clientX, trackEl, duration), duration);
      try {
        videoRef.current.currentTime = t;
        setPlayheadSec(t);
      } catch {
        /* ignore */
      }
    },
    [duration],
  );

  const timeToPercent = useCallback(
    (t: number): number => {
      if (!duration || duration <= 0) return 0;
      return Math.min(100, Math.max(0, (t / duration) * 100));
    },
    [duration],
  );

  const finishDrag = useCallback(
    (start: number, end: number) => {
      dragKindRef.current = null;
      setDragPreview(null);
      if (end - start >= MIN_SEGMENT_SPAN) {
        commitSegment(start, end);
      }
    },
    [commitSegment],
  );

  const handleHandlePointerDown =
    (kind: 'start' | 'end') => (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      dragKindRef.current = kind;
      setDragPreview({ start: effectiveStart, end: effectiveEnd });

      const onMove = (ev: PointerEvent) => {
        if (!dragKindRef.current || !duration) return;
        const t = clampPreviewTime(percentToTime(ev.clientX), duration);
        setDragPreview((prev) => {
          const base = prev ?? { start: effectiveStart, end: effectiveEnd };
          if (dragKindRef.current === 'start') {
            const newStart = Math.min(t, base.end - MIN_SEGMENT_SPAN);
            return { start: Math.max(0, newStart), end: base.end };
          }
          const newEnd = Math.max(t, base.start + MIN_SEGMENT_SPAN);
          return { start: base.start, end: Math.min(duration, newEnd) };
        });
      };

      const onUp = (ev: PointerEvent) => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        const t = clampPreviewTime(percentToTime(ev.clientX), duration);
        const baseStart = effectiveStart;
        const baseEnd = effectiveEnd;
        if (dragKindRef.current === 'start') {
          const newStart = Math.min(t, baseEnd - MIN_SEGMENT_SPAN);
          finishDrag(Math.max(0, newStart), baseEnd);
        } else {
          const newEnd = Math.max(t, baseStart + MIN_SEGMENT_SPAN);
          finishDrag(baseStart, Math.min(duration, newEnd));
        }
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp, { once: true });
    };

  const handleTrackPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('.compose-seg-handle')) return;
    seekFromClientX(e.clientX, trackRef.current);
  };

  const handleScrubberPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    seekFromClientX(e.clientX, scrubberRef.current);
  };

  const handleSegInputPointerDown =
    (kind: 'start' | 'end') => (e: ReactPointerEvent<HTMLInputElement>) => {
      const inputEl = e.currentTarget;
      const baseStart = effectiveStart;
      const baseEnd = effectiveEnd;
      const baseValue = kind === 'start' ? baseStart : baseEnd;
      const startClientX = e.clientX;
      let active = false;
      const secPerPx = (duration > 0 ? duration : 10) / SCRUB_PIXELS_PER_FULL_SPAN;

      const onMove = (ev: PointerEvent) => {
        const deltaX = ev.clientX - startClientX;
        if (!active) {
          if (Math.abs(deltaX) < SCRUB_DRAG_THRESHOLD_PX) return;
          active = true;
          ev.preventDefault();
          inputEl.blur();
          setScrubbingInput(kind);
        }
        const next = baseValue + deltaX * secPerPx;
        if (kind === 'start') {
          const newStart = Math.min(next, baseEnd - MIN_SEGMENT_SPAN);
          commitSegment(Math.max(0, newStart), baseEnd);
        } else {
          const newEnd = Math.max(next, baseStart + MIN_SEGMENT_SPAN);
          const maxEnd = duration > 0 ? duration : newEnd;
          commitSegment(baseStart, Math.min(maxEnd, newEnd));
        }
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        setScrubbingInput(null);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp, { once: true });
    };

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  };

  if (!previewSource) {
    return (
      <div className="compose-video-studio">
        <section className="compose-section compose-video-source" aria-label="视频源">
          <ComposeVideoPicker selectedIndex={videoIndex} />
        </section>
        <div className="compose-card compose-preview-card">
          <div className="compose-video-preview-empty" role="status">
            无法加载预览（无有效地址或跨域限制）
          </div>
        </div>
      </div>
    );
  }

  const startPct = timeToPercent(effectiveStart);
  const endPct = timeToPercent(effectiveEnd);
  const playheadPct = timeToPercent(playheadSec);
  const frameEstimate = estimateSegmentFrameCount(effectiveStart, effectiveEnd);
  const filmstripFailed = !filmstripLoading && filmstripFrames.length === 0;
  const filmstripClass = [
    'compose-filmstrip',
    filmstripLoading ? 'is-loading' : '',
    filmstripFailed ? 'is-fallback is-failed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const segReadout =
    frameEstimate > 0
      ? `选区 ${formatSegmentSpan(effectiveStart, effectiveEnd)} · 约 ${frameEstimate} 帧`
      : `选区 ${formatSegmentSpan(effectiveStart, effectiveEnd)}`;

  return (
    <div className="compose-video-studio">
      <section className="compose-section compose-video-source" aria-label="视频源">
        <ComposeVideoPicker selectedIndex={videoIndex} />
      </section>

      <div className="compose-card compose-preview-card">
        {loadFailed ? (
          <div className="compose-video-preview-empty" role="status">
            无法加载预览（无有效地址或跨域限制）
          </div>
        ) : (
          <>
            <div className="compose-preview-frame">
              <video
                ref={videoRef}
                className="compose-video-preview-player"
                src={previewSource.src}
                poster={previewSource.poster}
                muted
                playsInline
                preload="metadata"
                aria-label={`预览：${previewSource.title}`}
                onError={() => setLoadFailed(true)}
              />
            </div>
            <div className="compose-video-controls">
              <button
                type="button"
                className="compose-video-play-btn"
                onClick={togglePlay}
                aria-label={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <div
                ref={scrubberRef}
                className="compose-scrubber"
                role="slider"
                aria-label="播放进度"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={playheadSec}
                onPointerDown={handleScrubberPointerDown}
              >
                <div className="compose-scrubber-track" aria-hidden />
                <div
                  className="compose-scrubber-region"
                  style={{ left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%` }}
                  aria-hidden
                />
                <div
                  className="compose-scrubber-playhead"
                  style={{ left: `${playheadPct}%` }}
                  aria-hidden
                />
              </div>
              <span className="compose-scrubber-time">
                {formatClock(playheadSec)} / {formatClock(duration)}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="compose-card compose-region-card">
        <div className="compose-card-head">
          <span className="compose-section-title">片段选区</span>
          <span className="compose-seg-readout-pill">{segReadout}</span>
        </div>
        <div className="compose-card-body compose-region-body">
          <div
            ref={trackRef}
            className={filmstripClass}
            role="slider"
            aria-label="视频片段时间轴"
            aria-valuemin={0}
            aria-valuemax={duration}
            onPointerDown={handleTrackPointerDown}
          >
            <div className="compose-filmstrip-track">
              {filmstripFrames.length > 0
                ? filmstripFrames.map((src, i) => (
                    <img
                      key={`${videoIndex}-${i}`}
                      className="compose-filmstrip-thumb"
                      src={src}
                      alt=""
                    />
                  ))
                : null}
            </div>
            {filmstripLoading ? (
              <span className="compose-filmstrip-status" aria-live="polite">
                正在生成预览帧…
              </span>
            ) : null}
            {filmstripFailed ? (
              <span
                className="compose-filmstrip-status compose-filmstrip-status-failed"
                role="status"
              >
                无法生成预览帧
              </span>
            ) : null}

            <div
              className="compose-seg-mask compose-seg-mask-left"
              style={{ width: `${startPct}%` }}
            />
            <div
              className="compose-seg-mask compose-seg-mask-right"
              style={{ width: `${100 - endPct}%` }}
            />
            <div
              className="compose-seg-selection"
              style={{ left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%` }}
            />

            <div className="compose-playhead" style={{ left: `${playheadPct}%` }} aria-hidden />

            <button
              type="button"
              className="compose-seg-handle compose-seg-handle-start"
              style={{ left: `${startPct}%` }}
              aria-label="片段起点"
              onPointerDown={handleHandlePointerDown('start')}
            />
            <button
              type="button"
              className="compose-seg-handle compose-seg-handle-end"
              style={{ left: `${endPct}%` }}
              aria-label="片段终点"
              onPointerDown={handleHandlePointerDown('end')}
            />
          </div>

          <div className="compose-seg-controls">
            <div className="compose-inout-row">
              <div className="compose-seg-inputs">
                <input
                  type="number"
                  className={`compose-video-time-input${scrubbingInput === 'start' ? ' is-scrubbing' : ''}`}
                  data-role="video-seg-start"
                  step="any"
                  inputMode="decimal"
                  placeholder="起始"
                  aria-label="片段起始秒"
                  value={
                    dragPreview != null || segStart != null
                      ? formatVideoSegmentInputSec(effectiveStart)
                      : ''
                  }
                  onChange={onSegStartChange}
                  onPointerDown={handleSegInputPointerDown('start')}
                />
                <span className="compose-video-seg-tilde">～</span>
                <input
                  type="number"
                  className={`compose-video-time-input${scrubbingInput === 'end' ? ' is-scrubbing' : ''}`}
                  data-role="video-seg-end"
                  step="any"
                  inputMode="decimal"
                  placeholder="结束"
                  aria-label="片段结束秒"
                  value={
                    dragPreview != null || segEnd != null
                      ? formatVideoSegmentInputSec(effectiveEnd)
                      : ''
                  }
                  onChange={onSegEndChange}
                  onPointerDown={handleSegInputPointerDown('end')}
                />
              </div>
              <div className="compose-inout-actions">
                <button
                  type="button"
                  className="btn ghost sm"
                  title={SAMPLE_TO_REFS_HINT}
                  data-action="sample-video-segment-to-refs"
                  onClick={(e) =>
                    runPanelAction('sample-video-segment-to-refs', e.currentTarget, e.nativeEvent)
                  }
                >
                  采样到参考
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
