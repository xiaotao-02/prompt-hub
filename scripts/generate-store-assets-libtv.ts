#!/usr/bin/env node
/**
 * 用 LibTV CLI（lib-image-2）批量生成 Chrome Web Store 宣传图与截图。
 *
 * 前置：libtv 已安装且 account info 成功（PATH 或 %USERPROFILE%\.libtv\libtv.exe，或 LIBTV_EXE）。
 * 配置：store-assets/libtv/prompts.json
 * 输出：store-assets/promo/ + store-assets/screenshots/（sharp 缩放到目标尺寸）
 *
 * 后处理：默认 fit:contain + 黑底（不裁切）；STORE_LIBTV_CROP=cover 可恢复居中裁切。
 *
 * 节点：全程 project scope（group unuse）；nodeKey 持久化于 .libtv/node-keys.json。
 *
 * 环境变量：
 *   STORE_LIBTV_SKIP_RUN=1       — 跳过 --run，直接下载已有完成图
 *   STORE_LIBTV_REQUIRE_FRESH=0  — 不强制新 taskId，有完成图即下载
 *   STORE_LIBTV_POLL_TIMEOUT_MS  — 轮询超时（默认 900000，单次 wait 上限可另设）
 *   STORE_LIBTV_TASK_TIMEOUT_MS  — 单任务单次等待返图超时（默认 180000 = 3 分钟）
 *   STORE_LIBTV_TASK_MAX_ATTEMPTS — 单任务最大尝试次数（默认 2：首次 + 1 次重试）
 *
 * CLI：
 *   --only promo-small,shot-1-hero   — 仅生成指定节点（逗号分隔，匹配 prompts.json 的 node 字段）
 *
 * 流程：setup → upsert 全部节点 → 每路独立 pipeline（--run → wait → download/crop，出图即落盘）
 * 单任务：3 分钟无返图则重新 --run；再次 3 分钟仍无返图则跳过该节点，继续其余任务。
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTaskOutAbs } from './_store-task-paths.ts';
import { validateStoreAssets } from './validate-store-assets.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const libtvDir = join(root, 'store-assets', 'libtv');
const libtvMetaDir = join(libtvDir, '.libtv');
const nodeKeysPath = join(libtvMetaDir, 'node-keys.json');
const promptsPath = join(libtvDir, 'prompts.json');
const rawDir = join(libtvDir, 'raw');
const logoPath = join(root, 'public', 'icons', 'icon-128.png');
const PROJECT_NAME = 'PromptHubStore';

const POLL_MS = 8000;
const POLL_TIMEOUT_MS = Number(process.env.STORE_LIBTV_POLL_TIMEOUT_MS) || 900_000;
/** 单任务单次等待返图上限（默认 3 分钟） */
const TASK_ATTEMPT_TIMEOUT_MS = Number(process.env.STORE_LIBTV_TASK_TIMEOUT_MS) || 180_000;
/** 单任务最大尝试次数（默认 2 = 首次 + 1 次重试） */
const TASK_MAX_ATTEMPTS = Number(process.env.STORE_LIBTV_TASK_MAX_ATTEMPTS) || 2;
const SKIP_RUN = process.env.STORE_LIBTV_SKIP_RUN === '1';
const REQUIRE_FRESH = process.env.STORE_LIBTV_REQUIRE_FRESH !== '0';

/** contain = 等比缩放 + 黑边（默认，不裁切）；cover = 居中裁切填满 */
const CROP_FIT = (() => {
  const mode = (process.env.STORE_LIBTV_CROP || 'contain').toLowerCase();
  return mode === 'cover' ? 'cover' : 'contain';
})();

/** 组内相对坐标：logo 左上锚点，生图节点 3 列网格展开 */
const NODE_LAYOUT = {
  logo: { x: 40, y: 40 },
  originX: 480,
  originY: 0,
  colWidth: 520,
  rowHeight: 380,
  cols: 3,
};

function layoutForTaskIndex(index) {
  const col = index % NODE_LAYOUT.cols;
  const row = Math.floor(index / NODE_LAYOUT.cols);
  return {
    x: NODE_LAYOUT.originX + col * NODE_LAYOUT.colWidth,
    y: NODE_LAYOUT.originY + row * NODE_LAYOUT.rowHeight,
  };
}

function appendPosition(args, x, y) {
  return [...args, '--x', String(x), '--y', String(y)];
}

function resolveLibtvExe() {
  const fromEnv = process.env.LIBTV_EXE?.trim();
  if (fromEnv) {
    if (!existsSync(fromEnv)) fail(`LIBTV_EXE 不存在: ${fromEnv}`);
    return fromEnv;
  }
  const defaultExe = join(
    homedir(),
    '.libtv',
    process.platform === 'win32' ? 'libtv.exe' : 'libtv',
  );
  if (existsSync(defaultExe)) return defaultExe;
  return 'libtv';
}

const libtvExe = resolveLibtvExe();

function parseOnlyArg() {
  const idx = process.argv.indexOf('--only');
  if (idx === -1) return null;
  return (
    process.argv[idx + 1]
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? null
  );
}

const ONLY_NODES = parseOnlyArg();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg) {
  console.log(`[store:libtv] ${msg}`);
}

function fail(msg, code = 1) {
  console.error(`[store:libtv] ✗ ${msg}`);
  process.exit(code);
}

function handleLibtvResult(
  args,
  {
    ok,
    stdout,
    stderr,
    code,
    error,
    allowFail = false,
  }: {
    ok: any;
    stdout: any;
    stderr: any;
    code: any;
    error?: any;
    allowFail?: boolean;
  },
) {
  if (error) {
    if (allowFail) return { ok: false, stdout: '', stderr: String(error), code: 1 };
    fail(`libtv ${args.join(' ')} 启动失败: ${error.message}`);
  }
  if (!ok && !allowFail) {
    fail(`libtv ${args.join(' ')} 退出码 ${code}\n${stderr || stdout || '(无输出)'}`);
  }
  return { ok, stdout, stderr, code };
}

function runLibtv(args, { cwd = libtvDir, allowFail = false } = {}) {
  const r = spawnSync(libtvExe, args, {
    cwd,
    encoding: 'utf-8',
    shell: false,
    maxBuffer: 20 * 1024 * 1024,
  });
  return handleLibtvResult(args, {
    ok: r.status === 0,
    stdout: (r.stdout || '').trim(),
    stderr: (r.stderr || '').trim(),
    code: r.status ?? 0,
    error: r.error,
    allowFail,
  });
}

function runLibtvAsync(args, { cwd = libtvDir, allowFail = false } = {}) {
  return new Promise<any>((resolve, reject) => {
    const child = spawn(libtvExe, args, {
      cwd,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      try {
        resolve(
          handleLibtvResult(args, {
            ok: false,
            stdout: '',
            stderr: String(error),
            code: 1,
            error,
            allowFail,
          }),
        );
      } catch (e) {
        reject(e);
      }
    });
    child.on('close', (code) => {
      try {
        resolve(
          handleLibtvResult(args, {
            ok: code === 0,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            code: code ?? 0,
            allowFail,
          }),
        );
      } catch (e) {
        reject(e);
      }
    });
  });
}

function parseJson(stdout) {
  if (!stdout) return null;
  try {
    return JSON.parse(stdout);
  } catch {
    const lines = stdout.split('\n').filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        return JSON.parse(lines[i]);
      } catch {
        /* try previous line */
      }
    }
  }
  return null;
}

function ensureDirs() {
  const dirs = [
    libtvDir,
    rawDir,
    join(root, 'store-assets', 'promo'),
    join(root, 'store-assets', 'screenshots'),
    join(root, 'docs', 'images', 'readme'),
  ];
  for (const d of dirs) {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  }
}

function ensureLoggedIn() {
  const r = runLibtv(['account', 'info']);
  const j = parseJson(r.stdout);
  if (!j?.user) fail('未登录 LibTV，请先执行: libtv login web');
  log(`已登录: ${j.user.nickname || j.user.uuid}`);
}

function ensureProject() {
  const binding = join(libtvDir, '.libtv', 'project.json');
  if (existsSync(binding)) {
    const j = parseJson(readFileSync(binding, 'utf-8'));
    if (j?.projectUuid) {
      log(`已绑定项目: ${j.projectUuid}`);
      return j.projectUuid;
    }
  }
  log(`创建画布项目 ${PROJECT_NAME} …`);
  const created = runLibtv(['project', 'create', PROJECT_NAME]);
  const cj = parseJson(created.stdout);
  const uuid = cj?.uuid || cj?.projectUuid || cj?.data?.uuid || cj?.projectMeta?.uuid;
  if (!uuid) fail('project create 未返回 uuid\n' + created.stdout);
  runLibtv(['project', 'use', uuid]);
  log(`已绑定新项目: ${uuid}`);
  return uuid;
}

/** 节点 CRUD 必须在画布根级（project scope）；group use 会导致按名查询为空。 */
function ensureProjectScope() {
  const r = runLibtv(['group', 'unuse'], { allowFail: true });
  if (r.ok) log('已切换为 project scope（group unuse）');
}

function loadNodeKeys() {
  if (!existsSync(nodeKeysPath)) return {};
  try {
    return JSON.parse(readFileSync(nodeKeysPath, 'utf-8')) ?? {};
  } catch {
    return {};
  }
}

function saveNodeKeys(keys) {
  mkdirSync(libtvMetaDir, { recursive: true });
  writeFileSync(nodeKeysPath, `${JSON.stringify(keys, null, 2)}\n`, 'utf-8');
}

function queryNodeByKey(nodeKey) {
  const r = runLibtv(['node', nodeKey], { allowFail: true });
  if (!r.ok) return null;
  const j = parseNodeQuery(r.stdout);
  return j?.nodeKey ? j : null;
}

function resolveNodeKeyForName(nodeName, nodeKeys) {
  const saved = nodeKeys[nodeName];
  if (saved && queryNodeByKey(saved)) return saved;
  if (saved) delete nodeKeys[nodeName];
  if (nodeExists(nodeName)) return resolveNodeKey(nodeName);
  return null;
}

function parseNodeQuery(stdout) {
  const j = parseJson(stdout);
  if (!j) return null;
  if (j.nodeKey && j.data) return j;
  if (Array.isArray(j.matches) && j.matches.length > 0) {
    const withUrl = j.matches.filter((m) => extractImageUrls(m).length > 0);
    const pool = withUrl.length > 0 ? withUrl : j.matches;
    return pool.sort((a, b) => (b.data?._updatedAtMs ?? 0) - (a.data?._updatedAtMs ?? 0))[0];
  }
  return j;
}

function nodeExists(name) {
  const r = runLibtv(['node', name], { allowFail: true });
  if (!r.ok) return false;
  const j = parseJson(r.stdout);
  return !!(j?.nodeKey || j?.matches?.length > 0);
}

function resolveNodeKey(nodeName) {
  const r = runLibtv(['node', nodeName], { allowFail: true });
  if (!r.ok) fail(`无法查询节点: ${nodeName}`);
  const j = parseNodeQuery(r.stdout);
  if (!j?.nodeKey) fail(`无法解析节点 key: ${nodeName}`);
  return j.nodeKey;
}

function ensureLogoRef(refName, nodeKeys) {
  const { x, y } = NODE_LAYOUT.logo;
  const existingKey = resolveNodeKeyForName(refName, nodeKeys);
  if (existingKey) {
    runLibtv(appendPosition(['node', existingKey], x, y), { allowFail: true });
    nodeKeys[refName] = existingKey;
    log(`参考节点已存在: ${refName} [${existingKey}] @ ${x},${y}`);
    return existingKey;
  }
  if (!existsSync(logoPath)) fail(`缺少 logo: ${logoPath}`);
  log(`上传 logo 参考图 → ${refName} @ ${x},${y}`);
  const uploaded = runLibtv(appendPosition(['upload', refName, '-f', logoPath], x, y));
  const uj = parseJson(uploaded.stdout);
  const nodeKey = uj?.nodeKey ?? uj?.newNodeKey ?? resolveNodeKey(refName);
  nodeKeys[refName] = nodeKey;
  return nodeKey;
}

function buildWriteArgs(task, cfg) {
  const { prompt, ratio } = task;
  return [
    '--prompt',
    prompt,
    '-s',
    `model=${cfg.model}`,
    '-s',
    `ratio=${ratio}`,
    '-s',
    `resolution=${cfg.resolution}`,
    '-s',
    `quality=${cfg.quality}`,
    '-s',
    'modeType=image2image',
    '--left',
    cfg.referenceNode,
  ];
}

function upsertNode(task, cfg, index, nodeKeys) {
  const { node } = task;
  const { x, y } = layoutForTaskIndex(index);
  const writeArgs = appendPosition(buildWriteArgs(task, cfg), x, y);
  const existingKey = resolveNodeKeyForName(node, nodeKeys);
  if (existingKey) {
    runLibtv(['node', existingKey, ...writeArgs]);
    task.nodeKey = existingKey;
  } else {
    const created = runLibtv(['node', 'create', node, '-t', 'image', ...writeArgs]);
    const cj = parseJson(created.stdout);
    task.nodeKey = cj?.nodeKey ?? cj?.newNodeKey ?? resolveNodeKey(node);
  }
  nodeKeys[node] = task.nodeKey;
  log(`节点就绪: ${node} [${task.nodeKey}] (${task.ratio}) @ ${x},${y}`);
}

async function triggerRun(nodeKey, label) {
  const r = await runLibtvAsync(['node', nodeKey, '--run'], { allowFail: true });
  if (!r.ok) {
    log(`触发 ${label} 返回非零（${r.code}），继续轮询等待出图 …`);
  }
}

function extractImageUrls(nodeJson) {
  const data = nodeJson?.data ?? nodeJson;
  const urls = [];
  for (const key of ['url', 'originalUrl']) {
    const v = data?.[key];
    if (Array.isArray(v))
      urls.push(...v.filter((u) => typeof u === 'string' && u.startsWith('http')));
    else if (typeof v === 'string' && v.startsWith('http')) urls.push(v);
  }
  return urls;
}

function getNodeSnapshot(nodeKey) {
  const r = runLibtv(['node', nodeKey], { allowFail: true });
  const j = parseNodeQuery(r.stdout);
  return {
    updatedAt: j?.data?._updatedAtMs ?? 0,
    url: extractImageUrls(j)[0] ?? null,
    taskId: j?.data?.taskInfo?.taskId ?? null,
  };
}

function formatPollStatus(j) {
  if (!j?.nodeKey) return 'query=empty';
  const ti = j.data?.taskInfo ?? {};
  const urls = extractImageUrls(j);
  return [
    `status=${ti.status ?? '?'}`,
    `loading=${ti.loading ?? '?'}`,
    `taskId=${ti.taskId ?? '-'}`,
    `url=${urls.length > 0 ? 'yes' : 'no'}`,
  ].join(' ');
}

function isImageReady(j, baseline, { requireFresh }) {
  const urls = extractImageUrls(j);
  if (urls.length === 0) return false;
  const ti = j?.data?.taskInfo ?? {};
  if (ti.loading === true) return false;
  if (ti.status === 1) return false;
  if (ti.status === 3) return false;
  if (!requireFresh) return ti.status === 2 || urls.length > 0;
  if (!baseline) return true;
  if (ti.taskId && ti.taskId !== baseline.taskId) return true;
  const updatedAt = j?.data?._updatedAtMs ?? 0;
  return updatedAt > baseline.updatedAt || urls[0] !== baseline.url;
}

async function waitForNodeImage(nodeKey, label, baseline, timeoutMs = POLL_TIMEOUT_MS) {
  const start = Date.now();
  let lastStatus = '';
  while (Date.now() - start < timeoutMs) {
    const r = runLibtv(['node', nodeKey], { allowFail: true });
    const j = parseNodeQuery(r.stdout);
    if (isImageReady(j, baseline, { requireFresh: REQUIRE_FRESH })) {
      log(`生成完成: ${label} (${Math.round((Date.now() - start) / 1000)}s)`);
      return extractImageUrls(j)[0];
    }
    const status = formatPollStatus(j);
    if (status !== lastStatus) {
      log(`等待 ${label} [${nodeKey}]: ${status}`);
      lastStatus = status;
    } else {
      log(`等待生成 ${label} … (${Math.round((Date.now() - start) / 1000)}s)`);
    }
    await sleep(POLL_MS);
  }
  const final = queryNodeByKey(nodeKey);
  throw new Error(
    `节点 ${label} [${nodeKey}] 未产出可用图片（超时 ${timeoutMs / 1000}s）` +
      (final ? `；末态: ${formatPollStatus(final)}` : '；末态: query=empty'),
  );
}

function downloadNode(nodeKey, label) {
  const outDir = join(rawDir, label);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  log(`下载: ${label}`);
  runLibtv(['download', '-n', nodeKey, '-o', outDir, '--vip', '--without-ai-watermark']);
  return findLatestImage(outDir);
}

function findLatestImage(dir) {
  const exts = new Set(['.png', '.jpg', '.jpeg', '.webp']);
  let best = null;
  let bestMtime = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (!st.isFile()) continue;
    const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
    if (!exts.has(ext)) continue;
    if (st.mtimeMs > bestMtime) {
      bestMtime = st.mtimeMs;
      best = p;
    }
  }
  if (!best) fail(`下载目录无图片: ${dir}`);
  return best;
}

async function cropToSize(inputPath, outPath, width, height) {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    fail('缺少 sharp，请执行: npm i -D sharp');
  }
  mkdirSync(dirname(outPath), { recursive: true });
  const resizeOpts: any = { fit: CROP_FIT, position: 'centre' };
  if (CROP_FIT === 'contain') {
    resizeOpts.background = { r: 0, g: 0, b: 0, alpha: 1 };
  }
  await sharp(inputPath).resize(width, height, resizeOpts).png().toFile(outPath);
}

async function processTask(task) {
  const raw = downloadNode(task.nodeKey, task.node);
  const outPath = resolveTaskOutAbs(task, root);
  await cropToSize(raw, outPath, task.width, task.height);
  log(`✓ ${relative(root, outPath)} (${task.width}×${task.height})`);
  return outPath;
}

/** 单任务完整链路：触发生成 → 等待出图 → 下载裁剪；3 分钟无返图重试 1 次，仍失败则跳过 */
async function runTaskPipeline(task, initialBaseline) {
  for (let attempt = 1; attempt <= TASK_MAX_ATTEMPTS; attempt++) {
    const baseline = attempt === 1 ? initialBaseline : getNodeSnapshot(task.nodeKey);
    try {
      if (!SKIP_RUN) {
        if (attempt > 1) {
          log(`${task.node} 第 ${attempt} 次尝试：重新触发生成 …`);
        }
        await triggerRun(task.nodeKey, task.node);
      } else if (attempt > 1) {
        log(`${task.node} 跳过重复 --run（STORE_LIBTV_SKIP_RUN=1）`);
      }
      await waitForNodeImage(task.nodeKey, task.node, baseline, TASK_ATTEMPT_TIMEOUT_MS);
      return processTask(task);
    } catch (e) {
      const timedOut = String(e?.message || e).includes('未产出可用图片');
      if (attempt < TASK_MAX_ATTEMPTS && timedOut) {
        log(
          `⚠ ${task.node} 第 ${attempt} 次超时（${TASK_ATTEMPT_TIMEOUT_MS / 1000}s 无返图），停止等待并重新生成 …`,
        );
        continue;
      }
      if (timedOut) {
        log(
          `✗ ${task.node} 放弃（${TASK_MAX_ATTEMPTS} 次尝试均 ${TASK_ATTEMPT_TIMEOUT_MS / 1000}s 内无返图），跳过`,
        );
        return null;
      }
      throw e;
    }
  }
  return null;
}

async function main() {
  const startedAt = Date.now();
  ensureDirs();
  log(`libtv 可执行文件: ${libtvExe}`);
  log(`后处理缩放模式: fit=${CROP_FIT}（STORE_LIBTV_CROP=contain|cover）`);
  log(
    `轮询: taskTimeout=${TASK_ATTEMPT_TIMEOUT_MS / 1000}s×${TASK_MAX_ATTEMPTS} requireFresh=${REQUIRE_FRESH} skipRun=${SKIP_RUN}`,
  );
  if (!existsSync(promptsPath)) fail(`缺少配置: ${promptsPath}`);
  const cfg = JSON.parse(readFileSync(promptsPath, 'utf-8'));
  let tasks = cfg.tasks ?? [];
  if (tasks.length === 0) fail('prompts.json 中 tasks 为空');
  if (ONLY_NODES?.length) {
    const set = new Set(ONLY_NODES);
    tasks = tasks.filter((t) => set.has(t.node));
    if (tasks.length === 0) fail(`--only 未匹配任何节点: ${ONLY_NODES.join(', ')}`);
    log(`仅生成 ${tasks.length} 个节点: ${tasks.map((t) => t.node).join(', ')}`);
  }

  ensureLoggedIn();
  ensureProject();
  ensureProjectScope();
  const nodeKeys = loadNodeKeys();
  ensureLogoRef(cfg.referenceNode || 'logo-ref', nodeKeys);

  log(`阶段 1/2：upsert ${tasks.length} 个节点（网格排布） …`);
  for (let i = 0; i < tasks.length; i++) {
    upsertNode(tasks[i], cfg, i, nodeKeys);
  }
  saveNodeKeys(nodeKeys);

  const nodeNames = tasks.map((t) => t.node).join(', ');
  const baselines = Object.fromEntries(tasks.map((t) => [t.node, getNodeSnapshot(t.nodeKey)]));
  const runHint = SKIP_RUN ? '跳过 --run，直接下载已有图' : '并行触发生成';
  log(`阶段 2/2：${tasks.length} 路 pipeline（${runHint}，出图即下载）…`);
  log(`  节点: ${nodeNames}`);

  const pipelineResults = await Promise.allSettled(
    tasks.map((t) => runTaskPipeline(t, baselines[t.node])),
  );

  const results = [];
  const skipped = [];
  for (let i = 0; i < pipelineResults.length; i++) {
    const r = pipelineResults[i];
    const node = tasks[i].node;
    if (r.status === 'rejected') {
      log(`✗ ${node} 异常: ${r.reason?.message || r.reason}`);
      skipped.push(node);
    } else if (r.value == null) {
      skipped.push(node);
    } else {
      results.push(r.value);
    }
  }

  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  if (skipped.length > 0) {
    log(`已跳过 ${skipped.length} 个节点: ${skipped.join(', ')}`);
  }
  if (results.length === 0) {
    fail(`全部 ${tasks.length} 个节点均未产出可用图片`);
  }

  console.log(
    `\n[store:libtv] 完成 ${results.length}/${tasks.length} 张（${elapsed}s）。上传到 Chrome Web Store 时：`,
  );
  console.log('  Small promo  → store-assets/promo/small-promo-440x280.png');
  console.log('  Marquee      → store-assets/promo/marquee-1400x560.png');
  console.log(
    '  Screenshots  → store-assets/screenshots/screenshot-1..5-*.png（按 CHECKLIST 顺序）',
  );
  for (const p of results) {
    console.log(`    ${relative(root, p)}`);
  }

  try {
    const validated = await validateStoreAssets({
      onlyNodes: ONLY_NODES,
      rootDir: root,
    });
    for (const r of validated.results) {
      const tag = r.ok ? 'OK' : 'FAIL';
      const detail = r.ok ? r.actual : (r.error ?? `${r.actual} (expect ${r.expect})`);
      log(`验收 ${tag} ${r.node} → ${r.path} (${detail})`);
    }
    if (!validated.allOk) {
      log(`⚠ 部分输出尺寸不符，请检查 raw/ 原图或重新生成`);
    }
  } catch (e) {
    log(`验收跳过: ${e.message}`);
  }
}

main().catch((e) => fail(e?.stack || String(e)));
