#!/usr/bin/env node
/**
 * 配置 ZPAY 聚合支付（运营后台 API 或 env 预填）。
 *
 * 用法：
 *   ZPAY_PID=2026... ZPAY_KEY=your-key node scripts/setup-zpay.mjs
 *   node scripts/setup-zpay.mjs --api-url http://localhost:8787
 *
 * 环境变量：
 *   ZPAY_PID / ZPAY_KEY     商户凭据（必填，除非仅打印回调说明）
 *   ZPAY_API_BASE           默认 https://zpayz.cn
 *   API_PUBLIC_URL          回调根地址（默认 http://localhost:8787）
 *   ADMIN_EMAIL             管理员邮箱（默认 dev@local.test）
 */
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    'api-url': { type: 'string', default: process.env.API_PUBLIC_URL ?? 'http://localhost:8787' },
    'admin-email': { type: 'string', default: process.env.ADMIN_EMAIL ?? 'dev@local.test' },
    'dry-run': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (args.help) {
  console.log(`用法: ZPAY_PID=... ZPAY_KEY=... node scripts/setup-zpay.mjs [选项]

选项:
  --api-url URL       API 根地址（默认 API_PUBLIC_URL 或 http://localhost:8787）
  --admin-email EMAIL 管理员邮箱（默认 dev@local.test）
  --dry-run           仅打印 ZPAY 商户后台需配置的回调地址，不调用 API
  -h, --help          显示帮助
`);
  process.exit(0);
}

const apiUrl = args['api-url'].replace(/\/$/, '');
const notifyUrl = `${apiUrl}/v1/webhooks/zpay`;
const pid = (process.env.ZPAY_PID ?? '').trim();
const key = (process.env.ZPAY_KEY ?? '').trim();
const apiBase = (process.env.ZPAY_API_BASE ?? 'https://zpayz.cn').replace(/\/$/, '');

console.log('\n=== ZPAY 接入检查清单 ===\n');
console.log('1. ZPAY 商户后台（兼容易支付）');
console.log(`   网关:     ${apiBase}/`);
console.log(`   异步通知: ${notifyUrl}`);
console.log(
  '   说明:     本地 localhost 无法接收 ZPAY 回调；生产须将 API_PUBLIC_URL 设为公网 https 地址',
);
console.log(
  '             或在 ZPAY 后台填公网回调 URL。本地可依赖 POST /v1/orders/:id/sync 查单兜底。\n',
);

if (!pid || !key) {
  console.log('2. 凭据: 未设置 ZPAY_PID / ZPAY_KEY，跳过后台写入。');
  console.log('   获取 KEY: ZPAY 商户后台 → 发送到邮箱');
  console.log('   配置方式: /admin 支付管理 → ZPAY 聚合 → 填 zpayPid / zpayKey 并启用');
  console.log('   或重跑:   ZPAY_PID=... ZPAY_KEY=... node scripts/setup-zpay.mjs\n');
  process.exit(0);
}

if (args['dry-run']) {
  console.log('2. --dry-run: 已提供凭据但不写入 API。\n');
  process.exit(0);
}

async function devLogin() {
  const res = await fetch(`${apiUrl}/v1/auth/dev-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: args['admin-email'] }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`dev-login 失败 (${res.status}): ${text}`);
  }
  const data = await res.json();
  if (!data.token) throw new Error('dev-login 未返回 token');
  return data.token;
}

async function adminFetch(path, token, init = {}) {
  const res = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `${path} 失败 (${res.status})`);
  }
  return data;
}

try {
  console.log(`2. 连接 API: ${apiUrl}`);
  const health = await fetch(`${apiUrl}/health`);
  if (!health.ok) throw new Error(`API 未就绪 (${health.status})`);

  console.log('3. 管理员登录 (dev-login)...');
  const token = await devLogin();

  console.log('4. 写入 ZPAY 通道 (enabled + 凭据)...');
  const update = await adminFetch('/v1/admin/payment-channels/zpay', token, {
    method: 'PUT',
    body: JSON.stringify({
      enabled: true,
      credentials: {
        zpayPid: pid,
        zpayKey: key,
        zpayApiBase: apiBase,
      },
    }),
  });
  console.log(
    `   已保存: enabled=${update.channel.enabled}, configured=${update.channel.isConfigured}`,
  );

  console.log('5. 连通性测试...');
  const test = await adminFetch('/v1/admin/payment-channels/zpay/test', token, {
    method: 'POST',
  });
  console.log(`   ${test.ok ? '✓' : '✗'} ${test.message}`);

  if (!test.ok) process.exit(1);

  console.log('\n=== 下一步 ===');
  console.log('- 在 ZPAY 商户后台确认异步通知 URL:', notifyUrl);
  console.log('- 官网充值页选套餐 → 微信/支付宝 → 扫码支付');
  console.log('- 验证 orders.status=paid 与用户余额增加\n');
} catch (e) {
  console.error('\n错误:', e instanceof Error ? e.message : String(e));
  console.error('提示: 先运行 npm run dev:previews 启动 API (8787)\n');
  process.exit(1);
}
