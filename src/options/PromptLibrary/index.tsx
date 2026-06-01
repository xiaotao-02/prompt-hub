import type { LibraryDockIntent } from './types';
import { usePromptLibrary } from './hooks/usePromptLibrary';
import { PromptLibraryView } from './PromptLibraryView';

/**
 * 提示词管理后台。
 *
 * 功能概览：
 * - 列表 / 网格双视图展示所有图片的提示词
 * - 顶部统计卡片 + 大搜索框 + chip 化筛选与排序
 * - 点击条目在 Options 页内打开定制浮动面板编辑；可跳转到原图页面继续用网页 Content panel
 * - 多选时底部出现批量操作浮条，支持批量删除 / 导出 / 复制
 * - 与 popup / background 共享同一套 IndexedDB + `library_rev` 变更戳；写入走 storage 层。
 */
interface PromptLibraryProps {
  focusId?: string | null;
  onConsumeFocus?: () => void;
  /** Popup / hash 深链：定位条目后一次性打开浮动面板并展开对应区域 */
  dockIntent?: LibraryDockIntent;
  onConsumeDockIntent?: () => void;
}

export default function PromptLibrary({
  focusId,
  onConsumeFocus,
  dockIntent,
  onConsumeDockIntent,
}: PromptLibraryProps) {
  const vm = usePromptLibrary({ focusId, onConsumeFocus, dockIntent, onConsumeDockIntent });
  return <PromptLibraryView vm={vm} />;
}
