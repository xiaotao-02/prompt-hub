/**
 * Naming refactor — case-sensitive, ordered replacements.
 * Run from repo root: tsx scripts/apply-naming-refactor.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const srcRoot = path.join(root, 'src');

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

function rename(fromRel, toRel) {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);
  if (!fs.existsSync(from)) {
    if (fs.existsSync(to)) return;
    throw new Error(`Missing source: ${fromRel}`);
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
  console.log(`renamed ${fromRel} -> ${toRel}`);
}

const fileRenames = [
  ['src/content/panel/reducer', 'src/content/panel/reducerHandlers'],
  ['src/content/panel/reducer.ts', 'src/content/panel/panelReducer.ts'],
  ['src/content/panel/events.ts', 'src/content/panel/panelShell.ts'],
  [
    'src/content/panel/reducerHandlers/events.ts',
    'src/content/panel/reducerHandlers/panelEvents.ts',
  ],
  ['src/lib/storage/events.ts', 'src/lib/storage/backupNotify.ts'],
  ['src/lib/oneClickRewrite.ts', 'src/lib/oneClickRefine.ts'],
  [
    'src/content/panel/components/RewriteRandomnessDropdown.tsx',
    'src/content/panel/components/OneClickRefineRandomnessDropdown.tsx',
  ],
  [
    'src/options/PromptLibrary/parts/RewriteRandomnessDropdown.tsx',
    'src/options/PromptLibrary/parts/OneClickRefineRandomnessDropdown.tsx',
  ],
  ['src/lib/refineStreamVersion.ts', 'src/lib/streamVersionSentinels.ts'],
  ['src/lib/refineProgressUi.test.ts', 'src/lib/refineProgressUi.test.ts'],
  ['src/content/panel/actions/extract.ts', 'src/content/panel/actions/copyAndRetry.ts'],
  ['src/content/panel/panelEffects.ts', 'src/content/panel/panelRenderBridge.ts'],
  ['src/lib/providerInference.ts', 'src/lib/providerIdFromModel.ts'],
  ['src/lib/providerInference.test.ts', 'src/lib/providerIdFromModel.test.ts'],
  ['src/background/region-capture.ts', 'src/background/regionCapture.ts'],
];

for (const [a, b] of fileRenames) rename(a, b);

function applyReplacements(text, pairs) {
  let out = text;
  for (const [from, to] of pairs) out = out.split(from).join(to);
  return out;
}

const allFiles = walk(srcRoot);

const globalPairs = [
  // batch 2
  ["from './reducer/extract'", "from './reducerHandlers/extract'"],
  ["from './reducer/history'", "from './reducerHandlers/history'"],
  ["from './reducer/refine'", "from './reducerHandlers/refine'"],
  ["from './reducer/ui'", "from './reducerHandlers/ui'"],
  ["from './reducer/versions'", "from './reducerHandlers/versions'"],
  ["from './reducer/events'", "from './reducerHandlers/panelEvents'"],
  ["from './reducer'", "from './panelReducer'"],
  ["from '@/content/panel/events'", "from '@/content/panel/panelShell'"],
  ["from './events'", "from './panelShell'"],
  ["from './backupNotify'", "from './backupNotify'"],
  // storage only
  ["from './events'", "from './backupNotify'"],
  // batch 4
  ['@/lib/refineStreamVersion', '@/lib/streamVersionSentinels'],
  ['../refineStreamVersion', '../streamVersionSentinels'],
  // batch 5
  ["from '../panelEffects'", "from '../panelRenderBridge'"],
  ["from './extract'", "from './copyAndRetry'"],
  ["from './providerInference'", "from './providerIdFromModel'"],
  ['@/lib/providerInference', '@/lib/providerIdFromModel'],
  ['inferCustomPromptMode', 'detectCustomPromptMode'],
  ['@/background/region-capture', '@/background/regionCapture'],
  ["from './region-capture'", "from './regionCapture'"],
  // batch 3 — protect storage key first via placeholder in per-file pass
  ['OneClickRewriteRandomness', 'OneClickRefineRandomness'],
  ['@/lib/oneClickRewrite', '@/lib/oneClickRefine'],
  ["from '../oneClickRewrite'", "from '../oneClickRefine'"],
  ['DEFAULT_ONE_CLICK_REWRITE_RANDOMNESS', 'DEFAULT_ONE_CLICK_REFINE_RANDOMNESS'],
  ['REWRITE_RANDOMNESS_LABELS', 'ONE_CLICK_REFINE_RANDOMNESS_LABELS'],
  ['normalizeOneClickRewriteRandomness', 'normalizeOneClickRefineRandomness'],
  ['buildOneClickRewriteInstruction', 'buildOneClickRefineInstruction'],
  ['makeRewriteNonce', 'makeOneClickRefineNonce'],
  ['RewriteRandomnessDropdown', 'OneClickRefineRandomnessDropdown'],
  ['RewriteRandomnessDropdownProps', 'OneClickRefineRandomnessDropdownProps'],
  ['handleRewriteSpin', 'handleOneClickRefine'],
  ['hydrateLibraryPanelRewriteRandomness', 'hydrateLibraryPanelOneClickRefineRandomness'],
  ['applyStoredRewriteRandomness', 'applyStoredOneClickRefineRandomness'],
  ['applyUiRewriteRandomness', 'applyUiOneClickRefineRandomness'],
  ['patchRewriteRandomnessDropdownSelection', 'patchOneClickRefineRandomnessDropdownSelection'],
  ['ui.rewriteRandomness', 'ui.oneClickRefineRandomness'],
  ['rewrite-spin', 'one-click-refine'],
  ['rewriteControlsDisabled', 'oneClickRefineControlsDisabled'],
  ['rewriteDisabled', 'oneClickRefineDisabled'],
  ['rewriteSpinBtn', 'oneClickRefineBtn'],
  ['rewriteControl', 'oneClickRefineControl'],
  ['rewrite-control-group', 'one-click-refine-control-group'],
  ['rewrite-spin-btn', 'one-click-refine-btn'],
  ['rewrite-randomness-dropdown', 'one-click-refine-randomness-dropdown'],
  ["kind: 'rewrite' | 'refine'", "kind: 'oneClick' | 'instructed'"],
  ["kind === 'rewrite'", "kind === 'oneClick'"],
  ["? 'refine' : 'rewrite'", "? 'instructed' : 'oneClick'"],
  // batch 8
  ['const cb = b.created', 'const createdB = b.created'],
  ['const ca = a.created', 'const createdA = a.created'],
  ['if (ca !== cb) return cb - ca', 'if (createdA !== createdB) return createdB - createdA'],
];

for (const file of allFiles) {
  if (file.includes(`${path.sep}storage${path.sep}`) && file.endsWith('events.ts')) continue;
  let text = fs.readFileSync(file, 'utf8');
  const protectedKey = '__STORAGE_OCR__';
  let next = text.split('oneClickRewriteRandomness').join(protectedKey);
  next = applyReplacements(next, globalPairs);
  next = next.split('rewriteRandomness').join('oneClickRefineRandomness');
  next = next.split(protectedKey).join('oneClickRewriteRandomness');
  if (next !== text) fs.writeFileSync(file, next, 'utf8');
}

// Fix lib/storage imports that still point to events
for (const file of walk(path.join(srcRoot, 'lib/storage'))) {
  let text = fs.readFileSync(file, 'utf8');
  const next = text.replace("from './events'", "from './backupNotify'");
  if (next !== text) fs.writeFileSync(file, next, 'utf8');
}

// Split reducerHandlers/history.ts
const historyFile = path.join(srcRoot, 'content/panel/reducerHandlers/history.ts');
if (fs.existsSync(historyFile)) {
  const src = fs.readFileSync(historyFile, 'utf8');
  const imports = src.slice(0, src.indexOf('export function applyReferenceSetUrls'));
  const refFn =
    src.match(
      /export function applyReferenceSetUrls[\s\S]*?(?=\nexport function applyHistoryPrefetch)/,
    )?.[0] ?? '';
  const syncFns = src.match(/export function applyHistoryPrefetch[\s\S]*$/)?.[0] ?? '';
  fs.writeFileSync(
    path.join(srcRoot, 'content/panel/reducerHandlers/references.ts'),
    imports + refFn + '\n',
  );
  fs.writeFileSync(
    path.join(srcRoot, 'content/panel/reducerHandlers/historySync.ts'),
    imports + syncFns + '\n',
  );
  fs.unlinkSync(historyFile);
  let pr = fs.readFileSync(path.join(srcRoot, 'content/panel/panelReducer.ts'), 'utf8');
  pr = pr.replace(
    "import { applyHistoryPrefetch, applyHistoryReady, applyReferenceSetUrls } from './reducerHandlers/history'",
    "import { applyReferenceSetUrls } from './reducerHandlers/references'\nimport { applyHistoryPrefetch, applyHistoryReady } from './reducerHandlers/historySync'",
  );
  fs.writeFileSync(path.join(srcRoot, 'content/panel/panelReducer.ts'), pr);
}

// Batch 6: PanelState / panel-only ID renames (not RuntimeMessage payloads)
const panelIdPairs = [
  ['linkedHistoryId', 'prefetchStorageId'],
  // state.ts requestId field
];
const panelOnlyFiles = allFiles.filter(
  (f) => /content[\\/]panel/.test(f) && !f.includes('panelEvents.ts'),
);
for (const file of panelOnlyFiles) {
  let text = fs.readFileSync(file, 'utf8');
  let next = text;
  for (const [from, to] of panelIdPairs) next = next.split(from).join(to);
  // requestId on PanelState — skip protocol-looking lines
  if (file.endsWith('state.ts')) {
    next = next.replace(
      /\/\*\* 本次会话用于路由 EXTRACT_\* 消息的 id[^*]*\*\/\s*\n\s*requestId: string;/,
      '/** 本次会话用于路由 EXTRACT_* 消息的 id；见 {@link prefetchStorageId} */\n  sessionRequestId: string;',
    );
  }
  if (file.includes('historySync.ts')) {
    next = next.replace(/\bstorageId\b/g, 'prefetchStorageId');
    next = next.replace(/\bactualId\b/g, 'persistedHistoryId');
    next = next.replace(/\brequestId\b/g, 'sessionRequestId');
  }
  if (file.includes('panelReducer.ts')) {
    next = next.replace('event.requestId', 'event.sessionRequestId');
    next = next.replace('event.storageId', 'event.prefetchStorageId');
    next = next.replace('event.actualId', 'event.persistedHistoryId');
  }
  if (next !== text) fs.writeFileSync(file, next, 'utf8');
}

// panelEvents.ts history event fields
const pe = path.join(srcRoot, 'content/panel/reducerHandlers/panelEvents.ts');
if (fs.existsSync(pe)) {
  let text = fs.readFileSync(pe, 'utf8');
  text = text.replace(/history\.prefetch[\s\S]*?requestId: string;\s*storageId: string;/, (m) =>
    m.replace('requestId', 'sessionRequestId').replace('storageId', 'prefetchStorageId'),
  );
  text = text.replace(/history\.ready[\s\S]*?requestId: string;\s*actualId: string;/, (m) =>
    m.replace('requestId', 'sessionRequestId').replace('actualId', 'persistedHistoryId'),
  );
  fs.writeFileSync(pe, text);
}

console.log('Naming refactor applied.');
