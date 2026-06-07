import { ImageIcon, MousePointerClick, Sparkles } from 'lucide-react';
import { EmptyGuide } from '@/components/EmptyGuide';

const STEPS = [
  { icon: ImageIcon, text: '在任意网页上右键图片' },
  { icon: MousePointerClick, text: '选择「提取图片提示词」' },
  { icon: Sparkles, text: '提取结果会出现在这里' },
] as const;

export function EmptyState() {
  return (
    <div className="flex min-h-[min(360px,42vh)] items-center justify-center px-4 py-8">
      <EmptyGuide
        title="还没有提示词"
        description="在网页上提取后，会集中保存在这里"
        steps={STEPS}
        stepsLayout="flow"
        align="content"
        showIcon={false}
      />
    </div>
  );
}
