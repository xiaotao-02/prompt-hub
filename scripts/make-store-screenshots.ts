#!/usr/bin/env node
/**
 * 生成 Chrome Web Store 上架要的 5 张商品截图（1280 × 800 PNG）。
 *
 * 实现策略：**不启动扩展**，全部用纯静态 HTML 模板渲染。
 * 视觉：黑蜂巢品牌 + 白色 UI mock 卡片（与真实 popup/options 一致）。
 *
 * 5 张截图主题：
 *   1. Hero       —— 核心三步（参考面板 / 合成反推 / 复制）
 *   2. Reference  —— 浮动参考面板（多图 / 材质 / 风格 / 视频分镜）
 *   3. Popup      —— 历史记录 + 版本 + 召回面板
 *   4. Settings   —— 快速配置 + ModelPicker 示意
 *   5. Providers  —— 12+ 视觉模型供应商
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureDir,
  honeycombWatermarkHtml,
  htmlShell,
  logoBase64,
  renderHtmlToPng,
  STORE_BRAND,
  storeChip,
} from './_store-utils.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const iconsDir = join(root, 'public', 'icons');
const outDir = join(root, 'store-assets', 'screenshots');

ensureDir(outDir);

const LOGO = logoBase64(iconsDir);
const W = 1280;
const H = 800;
const B = STORE_BRAND;

function pageShell(inner) {
  return htmlShell({
    title: 'Screenshot',
    body: `
    <div style="
      width: ${W}px; height: ${H}px;
      background: ${B.bg};
      position: relative; overflow: hidden;
      padding: 56px 64px;
      color: ${B.text};
      font-family: 'Inter', 'Noto Sans SC', sans-serif;
    ">
      ${honeycombWatermarkHtml(LOGO)}
      <div style="position: relative; z-index: 1;">${inner}</div>
    </div>
    `,
  });
}

function header(eyebrow, title, subtitle) {
  return `
    <div style="font-size: 14px; font-weight: 700; letter-spacing: 0.2em;
      text-transform: uppercase; color: ${B.accentCyan};">${eyebrow}</div>
    <div style="font-size: 48px; font-weight: 900; line-height: 1.05; letter-spacing: -0.02em;
      margin-top: 10px;">${title}</div>
    <div style="font-size: 18px; font-weight: 500; line-height: 1.5; margin-top: 14px; color: ${B.textSoft};
      max-width: 920px;">${subtitle}</div>
  `;
}

function stepCard(n, title, desc) {
  return `
    <div style="background: ${B.card};
      border: 1px solid ${B.cardBorder};
      border-radius: 20px; padding: 28px 24px;">
      <div style="display: inline-flex; width: 44px; height: 44px; align-items: center; justify-content: center;
        background: ${B.accentAmber}; color: ${B.bg};
        border-radius: 12px; font-size: 22px; font-weight: 900;">${n}</div>
      <div style="font-size: 24px; font-weight: 800; margin-top: 18px;">${title}</div>
      <div style="font-size: 16px; line-height: 1.55; margin-top: 10px; color: ${B.textSoft};">${desc}</div>
    </div>`;
}

// ============================================================
// 1. Hero — 核心三步
// ============================================================
const SHOT_1 = pageShell(`
  <div style="display: flex; align-items: center; gap: 22px; margin-bottom: 8px;">
    <img src="${LOGO}" style="width: 64px; height: 64px; border-radius: 14px;
      box-shadow: 0 12px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08);" />
    <div style="font-size: 28px; font-weight: 800;">Prompt Hub</div>
  </div>
  ${header(
    '核心流程',
    '右键图片，获得 AI 提示词',
    '右键 / Ctrl+Shift+E 框选加入参考面板，或直接反推；多图合成后输出中/英 · SD · MJ 四种风格。',
  )}

  <div style="margin-top: 48px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
    ${stepCard(
      1,
      '加入参考',
      '右键 PNG / GIF / 视频 / canvas / SVG，或框选区域；最多 8 张图在浮动面板中综合理解。',
    )}
    ${stepCard(
      2,
      '合成反推',
      '「生成提示词 / 提取材质 / 提取风格」任选；视频可按播放进度采样多帧生成分镜式提示词。',
    )}
    ${stepCard(
      3,
      '复制即用',
      '右下角结果面板输出四种风格，支持策略档位、对话改写与版本回溯，一键复制。',
    )}
  </div>

  <div style="position: absolute; bottom: 36px; left: 64px; right: 64px;
    display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
    ${['Manifest V3', '本地存储', '参考面板', '策略档位', '4 种风格', '版本历史', '对话式调整']
      .map((t) => storeChip(t))
      .join('')}
  </div>
`);

// ============================================================
// 2. Reference — 浮动参考面板
// ============================================================
const REF_THUMBS = [
  { label: '角色', color: '#6366f1' },
  { label: '场景', color: '#ec4899' },
  { label: '材质', color: '#14b8a6' },
  { label: '光影', color: '#f59e0b' },
  { label: '视频帧', color: '#8b5cf6' },
];

const SHOT_2 = pageShell(`
  ${header(
    'Reference Panel',
    '参考面板，多图综合理解',
    '收集最多 8 张参考图，在浮动面板中合成反推；支持材质 / 风格提取与视频分镜采样。',
  )}

  <div style="margin-top: 32px; display: flex; justify-content: center;">
    <div style="width: 720px; background: ${B.panel}; border-radius: 18px;
      box-shadow: 0 30px 70px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06);
      overflow: hidden; color: ${B.ink};">

      <div style="display: flex; align-items: center; justify-content: space-between;
        padding: 14px 18px; border-bottom: 1px solid ${B.uiCardBorder}; background: ${B.uiCard};">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${LOGO}" style="width: 26px; height: 26px; border-radius: 6px;" />
          <div style="font-size: 14px; font-weight: 700;">参考面板 · 5 / 8</div>
        </div>
        <div style="font-size: 12px; color: ${B.inkSoft};">Ctrl+Shift+E 继续框选</div>
      </div>

      <div style="padding: 16px 18px;">
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">
          ${REF_THUMBS.map(
            (t) => `
            <div style="aspect-ratio: 1; border-radius: 10px; background: linear-gradient(135deg, ${t.color}88, ${t.color}44);
              border: 1px solid ${B.uiCardBorder}; position: relative; overflow: hidden;">
              <div style="position: absolute; bottom: 6px; left: 6px; font-size: 10px; font-weight: 700;
                background: rgba(0,0,0,0.55); color: white; padding: 2px 6px; border-radius: 4px;">${t.label}</div>
            </div>`,
          ).join('')}
          <div style="aspect-ratio: 1; border-radius: 10px; border: 2px dashed ${B.uiCardBorder};
            display: flex; align-items: center; justify-content: center; color: ${B.inkSoft}; font-size: 24px;">+</div>
        </div>

        <div style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
          ${[
            ['生成提示词', true],
            ['提取材质', false],
            ['提取风格', false],
            ['视频分镜', false],
          ]
            .map(
              ([t, on]) => `
            <div style="font-size: 13px; padding: 8px 16px; border-radius: 8px; font-weight: 600;
              ${on ? `background: ${B.violet}; color: white;` : `background: ${B.uiCard}; color: ${B.ink}; border: 1px solid ${B.uiCardBorder};`}
            ">${t}</div>`,
            )
            .join('')}
        </div>

        <div style="margin-top: 14px; padding: 12px 14px; background: ${B.uiCard};
          border: 1px solid ${B.uiCardBorder}; border-radius: 10px;">
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            ${['自然语言 · 中文', 'SD Tag', 'Midjourney']
              .map(
                (tag) => `
              <div style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
                background: ${B.violetSoft}; color: ${B.violet};">${tag}</div>`,
              )
              .join('')}
          </div>
          <div style="font-size: 13px; line-height: 1.55; color: ${B.ink};">
            赛博朋克城市夜景与霓虹反射的综合描述：湿路面、粉紫体积光、电影级景深，融合角色造型与场景氛围…
          </div>
        </div>
      </div>
    </div>
  </div>
`);

// ============================================================
// 3. Popup — 历史记录
// ============================================================
const SHOT_3 = pageShell(`
  ${header(
    'Toolbar Popup',
    '历史记录、版本管理、一键复制',
    '工具栏弹窗查看最近 100 条结果；编辑、版本回溯、召回浮动面板，popup 内也可启动区域截图。',
  )}

  <div style="margin-top: 28px; display: flex; justify-content: center;">
    <div style="width: 480px; background: ${B.panel}; border-radius: 18px;
      box-shadow: 0 30px 70px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06);
      overflow: hidden; color: ${B.ink};">

      <div style="display: flex; align-items: center; justify-content: space-between;
        padding: 14px 16px; border-bottom: 1px solid ${B.uiCardBorder};">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${LOGO}" style="width: 28px; height: 28px; border-radius: 7px;" />
          <div style="font-size: 15px; font-weight: 700;">Prompt Hub</div>
        </div>
        <div style="display: flex; gap: 10px; color: ${B.inkSoft}; font-size: 12px;">
          <div style="color: ${B.violet}; font-weight: 600;">截取区域</div>
          <div>设置</div>
        </div>
      </div>

      ${[
        {
          tag: '自然语言 · 中文',
          time: '刚刚',
          text: '一张油画风格的赛博朋克城市夜景：霓虹灯映在湿漉漉的街道上，远处摩天楼玻璃幕墙反射着粉紫色光晕，前景有撑伞的女子，电影级景深与体积光，8k 高细节。',
        },
        {
          tag: 'SD Tag',
          time: '3 分钟前',
          text: '(masterpiece, best quality:1.2), 1girl, long silver hair, cyberpunk city, neon lights, rain reflections, depth of field, cinematic lighting, ultra detailed, 8k',
        },
        {
          tag: 'Midjourney',
          time: '12 分钟前',
          text: 'cinematic neon-lit cyberpunk alley at night, lone figure with umbrella, hyper-detailed reflections on wet pavement --ar 16:9 --s 250 --v 6.1',
        },
      ]
        .map(
          (item, i) => `
        <div style="padding: 14px 16px ${i === 2 ? '18px' : '14px'};
          ${i < 2 ? `border-bottom: 1px solid ${B.uiCardBorder};` : ''}">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px;
              background: ${B.violetSoft}; color: ${B.violet}; font-size: 11px; font-weight: 600;">${item.tag}</div>
            <div style="font-size: 11px; color: ${B.inkSoft};">${item.time}</div>
          </div>
          <div style="font-size: 13px; line-height: 1.55; margin-top: 8px; color: ${B.ink};
            display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${item.text}
          </div>
          <div style="display: flex; gap: 8px; margin-top: 10px; font-size: 12px;">
            <div style="color: ${B.violet}; font-weight: 600;">复制</div>
            <div style="color: ${B.inkSoft};">编辑</div>
            <div style="color: ${B.inkSoft};">版本</div>
            <div style="color: ${B.inkSoft};">召回面板</div>
            <div style="color: ${B.inkSoft};">对话调整</div>
            <div style="margin-left: auto; color: #ef4444;">删除</div>
          </div>
        </div>`,
        )
        .join('')}
    </div>
  </div>
`);

// ============================================================
// 4. Settings — 快速配置
// ============================================================
const RECOMMENDED = ['OpenAI', '智谱 GLM', '通义千问', 'SiliconFlow', 'DeepSeek', 'Gemini'];

const SHOT_4 = pageShell(`
  ${header(
    'Options Page',
    '粘贴 Key，快速开始',
    '设置页支持粘贴 curl / 多 provider 配置一键导入；已配置后显示摘要条与 ModelPicker 选模型。',
  )}

  <div style="margin-top: 28px; display: flex; justify-content: center;">
    <div style="width: 920px; background: ${B.panel}; border-radius: 20px;
      box-shadow: 0 30px 70px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06);
      overflow: hidden; color: ${B.ink};">

      <div style="display: flex; align-items: center; justify-content: space-between;
        padding: 16px 22px; border-bottom: 1px solid ${B.uiCardBorder};">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${LOGO}" style="width: 34px; height: 34px; border-radius: 8px;" />
          <div style="font-size: 17px; font-weight: 800;">Prompt Hub · 设置</div>
          <div style="margin-left: 12px; display: flex; gap: 14px; font-size: 13px; color: ${B.inkSoft};">
            <div style="font-weight: 700; color: ${B.ink};">设置</div>
            <div>提示词库</div>
          </div>
        </div>
        <div style="background: #10b981; color: white; padding: 5px 12px;
          border-radius: 8px; font-size: 12px; font-weight: 600;">已保存</div>
      </div>

      <div style="padding: 22px 26px;">
        <div style="padding: 12px 14px; background: ${B.violetSoft}; border: 1px solid #ddd6fe;
          border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 13px; font-weight: 700; color: ${B.violet};">智谱 GLM · glm-4v-flash</div>
            <div style="font-size: 12px; color: ${B.inkSoft}; margin-top: 2px;">API Key 已配置 · 跨设备 sync 同步</div>
          </div>
          <div style="font-size: 12px; color: ${B.violet}; font-weight: 600;">更换供应商</div>
        </div>

        <div style="margin-top: 18px;">
          <div style="font-size: 12px; font-weight: 700; color: ${B.inkSoft}; margin-bottom: 8px;">推荐供应商</div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${RECOMMENDED.map(
              (name, i) => `
              <div style="font-size: 12px; padding: 6px 12px; border-radius: 999px; font-weight: 600;
                ${i === 1 ? `background: ${B.violet}; color: white;` : `background: ${B.uiCard}; color: ${B.ink}; border: 1px solid ${B.uiCardBorder};`}
              ">${name}</div>`,
            ).join('')}
          </div>
        </div>

        <div style="margin-top: 18px;">
          <div style="font-size: 12px; font-weight: 700; color: ${B.inkSoft}; margin-bottom: 6px;">粘贴 API Key 或 curl 一键导入</div>
          <div style="background: ${B.uiCard}; border: 1px solid ${B.uiCardBorder}; border-radius: 10px;
            padding: 12px 14px; font-size: 13px; color: ${B.inkSoft}; font-family: 'JetBrains Mono', Menlo, monospace;">
            sk-••••••••••••••••••••••••••••••••
          </div>
        </div>

        <div style="margin-top: 18px;">
          <div style="font-size: 12px; font-weight: 700; color: ${B.inkSoft}; margin-bottom: 6px;">MODEL</div>
          <div style="display: flex; align-items: center; justify-content: space-between;
            background: ${B.uiCard}; border: 1px solid ${B.uiCardBorder}; border-radius: 10px;
            padding: 11px 14px;">
            <div style="font-size: 14px; font-weight: 600;">glm-4v-flash</div>
            <div style="font-size: 12px; color: ${B.violet}; font-weight: 600;">从端点拉取模型 ▾</div>
          </div>
        </div>
      </div>
    </div>
  </div>
`);

// ============================================================
// 5. Providers — 12+ 供应商
// ============================================================
const PROVIDERS_GRID = [
  { name: 'OpenAI', sub: 'GPT-4o · GPT-4o-mini', tag: '海外旗舰' },
  { name: 'Anthropic', sub: 'Claude 3.5 Sonnet', tag: '描述细腻' },
  { name: 'Google', sub: 'Gemini 2.0 Flash', tag: '速度快' },
  { name: '智谱 GLM', sub: 'glm-4v-flash 免费', tag: '国内可直连' },
  { name: '通义千问', sub: 'Qwen-VL-Max', tag: '国产旗舰' },
  { name: 'SiliconFlow', sub: 'DeepSeek-VL2 等', tag: '聚合开源' },
  { name: 'DeepSeek', sub: '官方端点', tag: '性价比高' },
  { name: 'Moonshot', sub: 'Kimi Vision', tag: '长上下文' },
  { name: '豆包 Doubao', sub: '火山方舟视觉', tag: '字节系' },
  { name: '百度千帆', sub: 'ERNIE 4.5 VL', tag: '国产' },
  { name: 'OpenRouter', sub: '百模聚合网关', tag: '海外聚合' },
  { name: 'Custom', sub: 'OpenAI 兼容端点', tag: '自定义' },
];

const SHOT_5 = pageShell(`
  ${header(
    'Multi-Provider',
    '12+ 视觉大模型，自由切换',
    '主列表覆盖 OpenAI / Claude / Gemini / 智谱 / Qwen / DeepSeek 等；折叠区另有 Step / MiniMax / Groq 等。',
  )}

  <div style="margin-top: 32px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;">
    ${PROVIDERS_GRID.map(
      (p) => `
      <div style="background: ${B.panel}; color: ${B.ink}; border-radius: 14px; padding: 18px 18px 16px;
        box-shadow: 0 12px 32px rgba(0,0,0,0.35);">
        <div style="display: inline-block; padding: 2px 8px; border-radius: 999px;
          background: ${B.violetSoft}; color: ${B.violet}; font-size: 10px; font-weight: 700;">${p.tag}</div>
        <div style="font-size: 18px; font-weight: 800; margin-top: 12px;">${p.name}</div>
        <div style="font-size: 12px; color: ${B.inkSoft}; margin-top: 4px; line-height: 1.4;">${p.sub}</div>
      </div>`,
    ).join('')}
  </div>

  <div style="margin-top: 28px; padding: 16px 20px; background: ${B.card};
    border: 1px solid ${B.cardBorder}; border-radius: 14px;
    display: flex; align-items: center; gap: 14px;">
    <div style="font-size: 28px;">🔒</div>
    <div>
      <div style="font-size: 16px; font-weight: 700;">API Key 仅保存在本地浏览器，不上传开发者</div>
      <div style="font-size: 13px; color: ${B.textSoft}; margin-top: 2px;">
        扩展无后端、不收集遥测；源代码 100% 开源（MIT）
      </div>
    </div>
  </div>
`);

// ============================================================
// Render all
// ============================================================
const tasks = [
  { html: SHOT_1, file: 'screenshot-1-hero.png' },
  { html: SHOT_2, file: 'screenshot-2-reference.png' },
  { html: SHOT_3, file: 'screenshot-3-popup.png' },
  { html: SHOT_4, file: 'screenshot-4-settings.png' },
  { html: SHOT_5, file: 'screenshot-5-providers.png' },
];

for (const t of tasks) {
  await renderHtmlToPng({
    html: t.html,
    width: W,
    height: H,
    outPath: join(outDir, t.file),
  });
}

console.log(`\n[store] 5 张商品截图已生成于 ${outDir}`);
console.log(`[store] 上架时按下面顺序拖拽到 Chrome Web Store 后台 Screenshots 区：`);
for (let i = 0; i < tasks.length; i++) {
  console.log(`        #${i + 1}  ${tasks[i].file}`);
}
