#!/usr/bin/env node
/**
 * 生成 Chrome Web Store 上架要的"宣传图 / Promo tiles"。
 *
 * Chrome Web Store 当前的 4 类宣传素材：
 *   - 小宣传图 (Small promo tile):   440 × 280   PNG / JPEG  必填
 *   - 大宣传图 (Marquee promo tile): 1400 × 560  PNG / JPEG  推荐
 *   - 商店截图 (Screenshot):         1280 × 800  PNG / JPEG  至少 1 张
 *
 * 这里负责前 2 类（"营销视觉"）。截图归 make-store-screenshots.ts。
 *
 * 视觉：黑蜂巢品牌（与 public/icons 一致），cyan/amber 点缀。
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureDir,
  htmlShell,
  honeycombBg,
  logoBase64,
  renderHtmlToPng,
  STORE_BRAND,
  storeChip,
} from './_store-utils.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const iconsDir = join(root, 'public', 'icons');
const outDir = join(root, 'store-assets', 'promo');

ensureDir(outDir);

const LOGO = logoBase64(iconsDir);
const B = STORE_BRAND;

/**
 * 440 × 280 小宣传图：紧凑、商标感强。
 */
const smallPromo = htmlShell({
  title: 'Small Promo',
  body: `
  <div style="
    ${honeycombBg()}
    width: 440px; height: 280px;
    display: flex; align-items: center; padding: 28px 30px;
    color: ${B.text};
    position: relative; overflow: hidden;
  ">
    <img src="${LOGO}" style="width: 96px; height: 96px; flex: 0 0 96px; border-radius: 22px;
      box-shadow: 0 18px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08);
    " />

    <div style="margin-left: 22px; position: relative; z-index: 1;">
      <div style="font-size: 28px; font-weight: 800; line-height: 1.1; letter-spacing: -0.01em;">
        Prompt Hub
      </div>
      <div style="font-size: 13px; font-weight: 500; color: ${B.textSoft}; margin-top: 6px; line-height: 1.45;">
        右键 / 框选加入参考面板
      </div>
      <div style="font-size: 13px; font-weight: 500; color: ${B.textSoft}; line-height: 1.45;">
        多图合成 · 反推 AI 绘画提示词
      </div>
      <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px;">
        ${storeChip('GPT-4o · Claude · Gemini')}
        ${storeChip('GLM · Qwen · DeepSeek', { accent: true })}
      </div>
    </div>
  </div>
  `,
});

/**
 * 1400 × 560 大宣传图（Marquee）：放在商店首页的 hero 位置。
 */
const marqueePromo = htmlShell({
  title: 'Marquee Promo',
  body: `
  <div style="
    ${honeycombBg()}
    width: 1400px; height: 560px;
    display: flex; align-items: center; padding: 70px 100px;
    color: ${B.text};
    position: relative; overflow: hidden;
  ">
    <img src="${LOGO}" style="position: absolute; right: 80px; top: 50%; transform: translateY(-50%);
      width: 320px; height: 320px; opacity: 0.08; pointer-events: none;
    " />

    <img src="${LOGO}" style="width: 200px; height: 200px; flex: 0 0 200px; border-radius: 44px;
      box-shadow: 0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.10);
      position: relative; z-index: 1;
    " />

    <div style="margin-left: 64px; max-width: 900px; position: relative; z-index: 1;">
      <div style="font-size: 15px; font-weight: 700; letter-spacing: 0.16em;
        text-transform: uppercase; color: ${B.textSoft};
      ">
        Prompt Hub · Chrome Extension
      </div>
      <div style="font-size: 60px; font-weight: 900; line-height: 1.05; letter-spacing: -0.02em;
        margin-top: 14px;
      ">
        右键图片，<span style="color: ${B.accentAmber};">获得</span> AI 提示词
      </div>
      <div style="font-size: 21px; font-weight: 500; line-height: 1.45; margin-top: 20px; color: ${B.textSoft};">
        参考面板 · 多图合成 · 四种输出风格 · 策略档位 · 对话改写与版本回溯
      </div>

      <div style="margin-top: 26px; display: flex; gap: 10px; flex-wrap: wrap;">
        ${storeChip('12+ 视觉模型')}
        ${storeChip('OpenAI 兼容自定义端点', { accent: true })}
        ${storeChip('Ctrl+Shift+E 框选')}
        ${storeChip('本地存储 · 无后端')}
      </div>
    </div>
  </div>
  `,
});

await renderHtmlToPng({
  html: smallPromo,
  width: 440,
  height: 280,
  outPath: join(outDir, 'small-promo-440x280.png'),
});

await renderHtmlToPng({
  html: marqueePromo,
  width: 1400,
  height: 560,
  outPath: join(outDir, 'marquee-1400x560.png'),
});

console.log(`\n[store] 宣传图已生成于 ${outDir}`);
console.log(`[store] 上传到 Chrome Web Store 时：`);
console.log(`        Store listing → Small promo tile      ⇒ small-promo-440x280.png`);
console.log(`        Store listing → Marquee promo tile    ⇒ marquee-1400x560.png`);
