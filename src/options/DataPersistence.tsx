import { DataPersistenceView } from './dataPersistence/DataPersistenceView';
import type { DataPersistenceProps } from './dataPersistence/types';
import { useDataPersistence } from './dataPersistence/useDataPersistence';

export type { DataPersistenceProps } from './dataPersistence/types';

/**
 * 「数据持久化」卡片。
 *
 * 解决的核心问题：Chrome 出于隐私安全，扩展被移除时会清空 chrome.storage 和 IndexedDB。
 * 为了让用户「卸载/重装/换设备」后仍能拿回 settings + 历史记录，这里提供两条通道：
 *
 * 1) **数据目录（推荐）**：通过 File System Access API 让用户挑选一个本地目录，
 *    数据双写到该目录里的 prompt-hub-data.json。重装后再选回同一目录即可全量还原。
 *    – 自动同步由后台 service worker 监听 storage 变化并 debounced 写盘
 *    – 立即同步、立即从盘恢复
 *    – 旧浏览器（不支持 FSA）自动降级到下面的导入/导出按钮
 *
 * 2) **手动导入 / 导出 JSON**：兜底方案，所有浏览器都可用。
 *
 * 数据安全设计要点（吃过亏后加固，不要随意删）：
 * - 选回已有备份的旧目录时**绝不**自动 syncToDirectory；恢复 / 保持不动 / 覆盖三选一由用户自己点
 * - syncToDirectory 默认带 `shrink-blocked` 守门；UI 收到 shrink-blocked 弹二次确认
 * - 「未配置数据目录」状态用橙色警告横幅，专门提醒重装用户**先选回旧目录再去填 API**
 */
export default function DataPersistence(props: DataPersistenceProps) {
  const ctrl = useDataPersistence(props);
  return <DataPersistenceView {...props} ctrl={ctrl} />;
}
