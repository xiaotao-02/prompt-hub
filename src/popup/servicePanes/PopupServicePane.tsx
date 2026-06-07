import ServiceBody from './ServiceBody';
import type { PopupServiceState } from './usePopupService';

export type PopupServicePaneProps = PopupServiceState & {
  onSaved?: () => void;
};

/**
 * Popup 内服务配置区统一入口：未配置卡片与已配置下拉菜单共用同一实现，避免双份业务 UI。
 */
export default function PopupServicePane(props: PopupServicePaneProps) {
  return <ServiceBody {...props} />;
}
