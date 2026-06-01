import { Check, Copy } from 'lucide-react';
import { UI_ACTION } from '@/lib/uiCopy';

type CopyFeedbackLabelProps = {
  active: boolean;
  idleIcon?: React.ReactNode;
  idleLabel?: string;
};

/** 复制按钮 idle / 已复制 双态文案与图标（popup / library 列表共用） */
export function CopyFeedbackLabel({
  active,
  idleIcon = <Copy className="w-3 h-3" aria-hidden />,
  idleLabel = UI_ACTION.copy,
}: CopyFeedbackLabelProps) {
  if (active) {
    return (
      <>
        <Check className="w-3 h-3 text-emerald-500" aria-hidden />
        <span className="text-emerald-500">{UI_ACTION.copied}</span>
      </>
    );
  }
  return (
    <>
      {idleIcon}
      {idleLabel}
    </>
  );
}
