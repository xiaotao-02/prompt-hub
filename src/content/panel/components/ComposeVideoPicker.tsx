import { useCallback, useState, type MouseEvent } from 'react';
import {
  formatVideoPickerTriggerLabel,
  listViewportVideoMetas,
} from '@/content/videoSegmentSample';
import {
  applyDefaultComposeVideoSegment,
  currentState,
  setComposeSelectedVideoIndex,
} from '../state';
import { renderPanelFromState } from '../panelRenderBridge';

export type ComposeVideoPickerProps = {
  selectedIndex: number;
  disabled?: boolean;
};

function formatVideoMetaLine(
  index: number,
  width: number,
  height: number,
  durationLabel: string,
): string {
  return `${index + 1} · ${width}×${height} · ${durationLabel}`;
}

export function ComposeVideoPicker({ selectedIndex, disabled }: ComposeVideoPickerProps) {
  const [open, setOpen] = useState(false);
  const metas = listViewportVideoMetas();
  const hasVideos = metas.length > 0;
  const clampedIndex = hasVideos ? Math.min(Math.max(0, selectedIndex), metas.length - 1) : 0;
  const current = metas[clampedIndex];

  const handleSelect = useCallback(
    (index: number) => {
      if (disabled || !hasVideos || index === clampedIndex) {
        setOpen(false);
        return;
      }
      setComposeSelectedVideoIndex(index);
      applyDefaultComposeVideoSegment(index, { force: true });
      const st = currentState;
      if (st?.status === 'compose') {
        renderPanelFromState(st);
      }
      setOpen(false);
    },
    [clampedIndex, disabled, hasVideos],
  );

  const handleTriggerClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (disabled || !hasVideos) return;
    setOpen((v) => !v);
  };

  const handleItemClick = (e: MouseEvent<HTMLLIElement>, index: number) => {
    e.stopPropagation();
    handleSelect(index);
  };

  if (!hasVideos) {
    return (
      <div
        className="strategy-dropdown compose-video-dropdown is-disabled"
        data-role="video-seg-picker-dropdown"
        aria-label="选择页面视频"
      >
        <input type="hidden" data-role="video-seg-picker-value" value="" disabled />
        <button className="sd-trigger" type="button" disabled>
          <span className="sd-label">无页面内视频</span>
          <svg className="sd-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path
              d="M1 1l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <ul className="sd-menu" />
      </div>
    );
  }

  return (
    <div
      className={`strategy-dropdown compose-video-dropdown${open ? ' open' : ''}`}
      data-role="video-seg-picker-dropdown"
      aria-label="选择页面视频"
    >
      <input type="hidden" data-role="video-seg-picker-value" value={clampedIndex} />
      <button
        className="sd-trigger"
        type="button"
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={handleTriggerClick}
      >
        <span className="sd-label">
          {current ? formatVideoPickerTriggerLabel(current) : '无页面内视频'}
        </span>
        <svg className="sd-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path
            d="M1 1l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <ul className="sd-menu" role="listbox">
        {metas.map((m) => (
          <li
            key={m.index}
            className={`sd-item${m.index === clampedIndex ? ' active' : ''}`}
            data-video-index={m.index}
            role="option"
            onClick={(e) => handleItemClick(e, m.index)}
          >
            <span className="sd-item-title">{m.title}</span>
            <span className="sd-item-meta">
              {formatVideoMetaLine(m.index, m.width, m.height, m.durationLabel)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
