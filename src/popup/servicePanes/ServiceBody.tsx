import { Settings } from 'lucide-react';
import { Button } from '@/components/ui';
import { sendOpenOptions } from '@/lib/messaging/openSurfaces';
import CustomApiPane from './CustomApiPane';
import type { PopupServiceState } from './usePopupService';

type ServiceBodyProps = Pick<
  PopupServiceState,
  | 'settings'
  | 'customProviderId'
  | 'onCustomProviderChange'
  | 'patchProvider'
  | 'saveProviderFromRef'
  | 'persistSettings'
> & {
  onSaved?: () => void;
};

export default function ServiceBody({
  settings,
  customProviderId,
  onCustomProviderChange,
  patchProvider,
  saveProviderFromRef,
  persistSettings,
  onSaved,
}: ServiceBodyProps) {
  if (!settings) return null;

  return (
    <div className="space-y-3">
      <CustomApiPane
        settings={settings}
        providerId={customProviderId}
        onProviderChange={onCustomProviderChange}
        onPatchProvider={patchProvider}
        onSaveProvider={saveProviderFromRef}
        onPersistSettings={persistSettings}
        onSaved={onSaved}
      />

      <div className="pt-1 border-t border-zinc-200/80 dark:border-zinc-800">
        <Button
          type="button"
          variant="quiet"
          size="xs"
          className="text-[11px] text-zinc-500"
          onClick={() => sendOpenOptions({ tab: 'settings' }, () => void chrome.runtime.lastError)}
        >
          <Settings className="w-3 h-3" aria-hidden />
          更多设置
        </Button>
      </div>
    </div>
  );
}
