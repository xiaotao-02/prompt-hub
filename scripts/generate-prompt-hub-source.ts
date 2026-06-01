#!/usr/bin/env tsx
/** 生成 Prompt Hub 品牌源图：中心节点 + 多供应商辐条 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'public', 'icons-src', 'source.png');
const size = 512;

function svg(): string {
  const bg = '#0f0a1a';
  const accent = '#8b5cf6';
  const accentLight = '#c4b5fd';
  const hub = { cx: 256, cy: 256, r: 44 };
  const nodes = [
    { cx: 256, cy: 96 },
    { cx: 396, cy: 176 },
    { cx: 396, cy: 336 },
    { cx: 256, cy: 416 },
    { cx: 116, cy: 336 },
    { cx: 116, cy: 176 },
  ];
  const spokes = nodes
    .map(
      (n) =>
        `<line x1="${hub.cx}" y1="${hub.cy}" x2="${n.cx}" y2="${n.cy}" stroke="${accentLight}" stroke-width="10" stroke-linecap="round" opacity="0.85"/>`,
    )
    .join('');
  const nodeDots = nodes
    .map(
      (n) =>
        `<circle cx="${n.cx}" cy="${n.cy}" r="28" fill="${accent}" stroke="${accentLight}" stroke-width="6"/>`,
    )
    .join('');

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e1033"/>
      <stop offset="100%" stop-color="${bg}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="112" fill="url(#bg)"/>
  ${spokes}
  ${nodeDots}
  <circle cx="${hub.cx}" cy="${hub.cy}" r="${hub.r}" fill="#ffffff" stroke="${accentLight}" stroke-width="8"/>
  <circle cx="${hub.cx}" cy="${hub.cy}" r="18" fill="${accent}"/>
</svg>`;
}

async function main(): Promise<void> {
  mkdirSync(dirname(out), { recursive: true });
  await sharp(Buffer.from(svg())).png().toFile(out);
  console.log(`[prompt-hub-icon] wrote ${out}`);
}

void main();
