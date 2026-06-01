import { PROVIDERS } from '../../providers';
import { inferProviderFromModelId } from '../../providerIdFromModel';
import type { AppSettings, ProviderId } from '../../types';
import { pickStr } from '../jsonHelpers';
import { KEY_SYNONYMS } from '../maps';
import { ensureOpenAIBase, matchProviderByUrl, resolveProviderAlias } from '../providerResolve';
import type { ImportResult } from '../types';

export function importMultiProvider(base: AppSettings, raw: Record<string, unknown>): ImportResult {
  // providers 可以是对象 map（{ openai: {...} }）也可以是数组（Cherry Studio 风格）
  const incoming = raw.providers;
  const entries: Array<{ key: string; value: Record<string, unknown> }> = [];
  if (Array.isArray(incoming)) {
    for (const item of incoming) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Record<string, unknown>;
      const idGuess =
        pickStr(obj, ['id', 'providerid', 'provider_id', 'name', 'type']) ||
        pickStr(obj, KEY_SYNONYMS.provider);
      entries.push({ key: idGuess || '', value: obj });
    }
  } else {
    for (const k of Object.keys(incoming as object)) {
      const v = (incoming as Record<string, unknown>)[k];
      if (!v || typeof v !== 'object') continue;
      entries.push({ key: k, value: v as Record<string, unknown> });
    }
  }

  const nextProviders = { ...base.providers };
  const touched: ProviderId[] = [];
  const skipped: string[] = [];

  for (const { key, value } of entries) {
    const apiKey = pickStr(value, KEY_SYNONYMS.apiKey);
    const baseUrl = pickStr(value, KEY_SYNONYMS.baseUrl);
    const model = pickStr(value, KEY_SYNONYMS.model);

    let pid: ProviderId | null = key ? resolveProviderAlias(key) : null;
    if (!pid) {
      const innerProvider = pickStr(value, KEY_SYNONYMS.provider);
      if (innerProvider) pid = resolveProviderAlias(innerProvider);
    }
    if (!pid && baseUrl) pid = matchProviderByUrl(baseUrl);

    // 没识别出 id 又没 apiKey，整条跳过；只要二者有其一就尽量保留
    if (!pid && !apiKey) {
      if (key) skipped.push(key);
      continue;
    }
    if (!pid) pid = 'custom';

    if (pid === 'custom' && model) {
      const inferred = inferProviderFromModelId(model);
      if (inferred) pid = inferred.providerId;
    }

    const prev = nextProviders[pid];
    nextProviders[pid] = {
      ...prev,
      id: pid,
      apiKey: apiKey || prev.apiKey,
      baseUrl: baseUrl
        ? pid === 'gemini' || pid === 'anthropic'
          ? baseUrl.replace(/\/+$/, '')
          : ensureOpenAIBase(baseUrl)
        : prev.baseUrl,
      model: model || prev.model,
    };
    touched.push(pid);
  }

  if (touched.length === 0) {
    return {
      ok: false,
      error:
        'providers 中没有任何可用条目（所有项要么 provider id 无法识别，要么没有 apiKey）。' +
        (skipped.length ? `\n已忽略：${skipped.join(', ')}` : ''),
    };
  }

  const wantActiveStr = pickStr(raw, ['activeprovider', 'active_provider', 'active', 'current']);
  const wantActive = wantActiveStr ? resolveProviderAlias(wantActiveStr) : null;
  const active = wantActive && touched.includes(wantActive) ? wantActive : touched[0];

  return {
    ok: true,
    settings: { ...base, activeProvider: active, providers: nextProviders },
    hint: `已导入 ${touched.length} 个 provider 的配置（${touched
      .map((p) => PROVIDERS[p]?.label || p)
      .join(' / ')}），当前供应商：${PROVIDERS[active]?.label || active}。`,
  };
}
