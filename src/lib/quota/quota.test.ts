import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCustomQuota } from './adapters/custom';
import { fetchDeepseekQuota } from './adapters/deepseek';
import { fetchNewapiTokenQuota } from './adapters/newapiToken';
import { fetchOpenrouterQuota } from './adapters/openrouter';
import { fetchSiliconflowQuota } from './adapters/siliconflow';
import { unsupportedSnapshot } from './adapters/helpers';
import type { QuotaAdapterContext } from './types';

const ctx = (
  providerId: QuotaAdapterContext['providerId'],
  apiKey = 'test-key',
  baseUrl?: string,
): QuotaAdapterContext => ({
  providerId,
  apiKey,
  baseUrl,
  docsUrl: 'https://example.com/docs',
});

describe('quota adapters', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });



  it('siliconflow parses totalBalance', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: { totalBalance: '88.88', chargeBalance: '80.00' },
        }),
        { status: 200 },
      ),
    );
    const snap = await fetchSiliconflowQuota(ctx('siliconflow'));
    expect(snap.status).toBe('ok');
    expect(snap.label).toBe('¥88.88');
  });

  it('deepseek parses balance_infos', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          is_available: true,
          balance_infos: [{ currency: 'CNY', total_balance: '8.66', granted_balance: '1.00' }],
        }),
        { status: 200 },
      ),
    );
    const snap = await fetchDeepseekQuota(ctx('deepseek'));
    expect(snap.status).toBe('ok');
    expect(snap.label).toBe('¥8.66');
    expect(snap.detail).toContain('赠金');
  });

  it('openrouter uses limit_remaining', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: { limit: 20, limit_remaining: 4.5, usage: 15.5 },
        }),
        { status: 200 },
      ),
    );
    const snap = await fetchOpenrouterQuota(ctx('openrouter'));
    expect(snap.status).toBe('ok');
    expect(snap.label).toBe('$4.50');
  });

  it('newapi token parses total_available as USD', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: true,
          message: 'ok',
          data: {
            name: '飞哥',
            total_granted: 25_000_000,
            total_used: 1_925_000,
            total_available: 23_075_000,
            unlimited_quota: false,
          },
        }),
        { status: 200 },
      ),
    );
    const snap = await fetchNewapiTokenQuota(ctx('shukelongda'));
    expect(snap.status).toBe('ok');
    expect(snap.label).toBe('$46.15');
    expect(snap.detail).toContain('$50.00');
    expect(snap.detail).toContain('飞哥');
    expect(snap.lowBalance).toBe(false);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://ai.shukelongda.cn/api/usage/token',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      }),
    );
  });

  it('newapi token unlimited quota', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: true,
          data: { unlimited_quota: true, total_used: 500_000 },
        }),
        { status: 200 },
      ),
    );
    const snap = await fetchNewapiTokenQuota(ctx('shukelongda'));
    expect(snap.status).toBe('ok');
    expect(snap.label).toBe('无限额度');
    expect(snap.detail).toContain('$1.00');
  });

  it('newapi token no key', async () => {
    const snap = await fetchNewapiTokenQuota(ctx('shukelongda', ''));
    expect(snap.status).toBe('no_key');
  });

  it('newapi token 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, message: 'Invalid Bearer token' }), {
        status: 401,
      }),
    );
    const snap = await fetchNewapiTokenQuota(ctx('shukelongda'));
    expect(snap.status).toBe('error');
    expect(snap.error).toBe('Key 无效');
  });

  it('custom parses newapi total_available from user baseUrl', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: true,
          data: {
            name: '飞哥',
            total_granted: 25_000_000,
            total_used: 4_770_000,
            total_available: 20_230_000,
            unlimited_quota: false,
          },
        }),
        { status: 200 },
      ),
    );
    const snap = await fetchCustomQuota(ctx('custom', 'test-key', 'https://relay.example.com/v1'));
    expect(snap.status).toBe('ok');
    expect(snap.label).toBe('$40.46');
    expect(snap.detail).toContain('$50.00');
    expect(snap.detail).toContain('飞哥');
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://relay.example.com/api/usage/token',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-key' }),
      }),
    );
  });

  it('custom 404 returns unsupported', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('not found', { status: 404 }));
    const snap = await fetchCustomQuota(ctx('custom', 'test-key', 'https://relay.example.com/v1'));
    expect(snap.status).toBe('unsupported');
    expect(snap.label).toContain('暂不支持');
  });

  it('custom no key', async () => {
    const snap = await fetchCustomQuota(ctx('custom', '', 'https://relay.example.com/v1'));
    expect(snap.status).toBe('no_key');
  });

  it('custom malformed response returns unsupported', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ code: true, data: null }), { status: 200 }),
    );
    const snap = await fetchCustomQuota(ctx('custom', 'test-key', 'https://relay.example.com/v1'));
    expect(snap.status).toBe('unsupported');
  });

  it('unsupported snapshot', async () => {
    const snap = unsupportedSnapshot(ctx('gemini'));
    expect(snap.status).toBe('unsupported');
    expect(snap.label).toContain('暂不支持');
  });
});
