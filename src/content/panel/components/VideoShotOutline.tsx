import { useCallback, useState, type MouseEvent } from 'react';
import { formatVideoSegmentInputSec } from '@/content/videoSegmentSample';
import type { PanelState } from '../state';
import { parseVideoShots, type VideoShot } from '../videoShots';

export type VideoShotOutlineProps = {
  state: PanelState;
};

function formatShotOrdinal(n: number): string {
  return `分镜${String(n).padStart(2, '0')}`;
}

function scrollTextareaToRange(ta: HTMLTextAreaElement, start: number): void {
  const textBefore = ta.value.slice(0, start);
  const linesBefore = textBefore.split('\n').length - 1;
  const style = getComputedStyle(ta);
  const lineHeight =
    Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.6 || 20;
  ta.scrollTop = Math.max(0, linesBefore * lineHeight - ta.clientHeight / 3);
}

function resolveEditorTextarea(fromEl: HTMLElement): HTMLTextAreaElement | null {
  const root = fromEl.getRootNode();
  if (root instanceof ShadowRoot || root instanceof Document) {
    return root.querySelector<HTMLTextAreaElement>('[data-role="editor"]');
  }
  return document.querySelector<HTMLTextAreaElement>('[data-role="editor"]');
}

function focusShotInEditor(fromEl: HTMLElement, shot: VideoShot): void {
  const ta = resolveEditorTextarea(fromEl);
  if (!ta) return;
  ta.focus();
  ta.setSelectionRange(shot.charStart, shot.charEnd);
  scrollTextareaToRange(ta, shot.charStart);
}

export function VideoShotOutline({ state }: VideoShotOutlineProps) {
  const segment = state.videoSegment;
  const promptText = state.draft ?? state.prompt ?? '';
  const shots = parseVideoShots(promptText);
  const [activeOrdinal, setActiveOrdinal] = useState<number | null>(null);

  const handleChipClick = useCallback((e: MouseEvent<HTMLButtonElement>, shot: VideoShot) => {
    focusShotInEditor(e.currentTarget, shot);
    setActiveOrdinal(shot.ordinal);
  }, []);

  if (!segment || shots.length < 2) return null;

  const startLabel = formatVideoSegmentInputSec(segment.startSec);
  const endLabel = formatVideoSegmentInputSec(segment.endSec);

  return (
    <div className="video-shot-outline" data-role="video-shot-outline">
      <div className="video-shot-outline-head">
        <span className="video-shot-outline-label">视频分镜</span>
        <span className="video-shot-outline-meta">
          片段 {startLabel}–{endLabel}s · {shots.length} 分镜
        </span>
      </div>
      <div className="video-shot-outline-chips" role="list" aria-label="分镜导航">
        {shots.map((shot) => {
          const chipLabel = shot.timeLabel
            ? `${formatShotOrdinal(shot.ordinal)} · ${shot.timeLabel}`
            : formatShotOrdinal(shot.ordinal);
          const active = activeOrdinal === shot.ordinal;
          return (
            <button
              key={`${shot.ordinal}-${shot.charStart}`}
              type="button"
              role="listitem"
              className={`video-shot-chip${active ? ' is-active' : ''}`}
              aria-label={`定位到${chipLabel}`}
              onClick={(e) => handleChipClick(e, shot)}
            >
              {chipLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
