/**
 * 视频分镜提示词解析（前端 fallback）。
 * 将来若后端返回结构化分镜数组，可在此模块替换实现而 UI 层不变。
 */

/** 单条分镜在原文中的区间与展示元数据 */
export type VideoShot = {
  ordinal: number;
  timeLabel?: string;
  charStart: number;
  charEnd: number;
  text: string;
};

/** 分镜标题：`分镜01（约1.2s）：` / `分镜 2 (约 3s):` 等 */
const SHOT_HEADER_RE = /分镜\s*0*(\d+)(?:\s*[（(](?:约\s*)?([\d.]+)\s*s[）)])?\s*[：:]/g;

const MIN_SHOTS_FOR_OUTLINE = 2;

/**
 * 从反推结果文本中拆出分镜条目。
 * 少于 {@link MIN_SHOTS_FOR_OUTLINE} 条时返回空数组（不展示大纲）。
 */
export function parseVideoShots(text: string): VideoShot[] {
  if (!text.trim()) return [];

  const headers: { ordinal: number; timeLabel?: string; charStart: number }[] = [];
  SHOT_HEADER_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = SHOT_HEADER_RE.exec(text)) !== null) {
    const ordinal = Number.parseInt(match[1]!, 10);
    if (!Number.isFinite(ordinal)) continue;
    const timeRaw = match[2];
    headers.push({
      ordinal,
      ...(timeRaw ? { timeLabel: `约${timeRaw}s` } : {}),
      charStart: match.index,
    });
  }

  if (headers.length < MIN_SHOTS_FOR_OUTLINE) return [];

  const shots: VideoShot[] = [];
  for (let i = 0; i < headers.length; i += 1) {
    const header = headers[i]!;
    const charEnd = i + 1 < headers.length ? headers[i + 1]!.charStart : text.length;
    shots.push({
      ordinal: header.ordinal,
      timeLabel: header.timeLabel,
      charStart: header.charStart,
      charEnd,
      text: text.slice(header.charStart, charEnd).trimEnd(),
    });
  }

  return shots;
}
