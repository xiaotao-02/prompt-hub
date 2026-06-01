import type { ReactNode } from 'react';
import { runPanelAction } from '../panelActionBridge';
import { IconHtml } from './IconHtml';
import { ICON_CLOSE } from '../icons';

export type PanelHeaderProps = {
  dotClass: string;
  title: ReactNode;
  badges?: ReactNode;
  onClose?: () => void;
};

export function PanelHeader({ dotClass, title, badges, onClose }: PanelHeaderProps) {
  return (
    <div className="header">
      <div className="title">
        <span className={`dot ${dotClass}`} />
        <span>{title}</span>
        {badges}
      </div>
      <button
        type="button"
        className="icon-btn"
        data-action="close"
        title="关闭"
        onClick={(e) => {
          onClose?.();
          runPanelAction('close', e.currentTarget, e.nativeEvent);
        }}
      >
        <IconHtml html={ICON_CLOSE} />
      </button>
    </div>
  );
}
