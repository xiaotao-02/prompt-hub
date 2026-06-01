import { PROVIDERS } from '../../providers';
import { inferProviderFromModelId } from '../../providerIdFromModel';
import type { AppSettings, ProviderId } from '../../types';
import { pickStr } from '../jsonHelpers';
import { mergeOneProvider } from '../merge';
import { KEY_SYNONYMS } from '../maps';
import { ensureOpenAIBase, matchProviderByUrl, resolveProviderAlias } from '../providerResolve';
import type { ImportResult } from '../types';

export function importSingleProvider(
  base: AppSettings,
  raw: Record<string, unknown>,
): ImportResult {
  const apiKey = pickStr(raw, KEY_SYNONYMS.apiKey);
  const baseUrl = pickStr(raw, KEY_SYNONYMS.baseUrl);
  const model = pickStr(raw, KEY_SYNONYMS.model);
  const providerRaw = pickStr(raw, KEY_SYNONYMS.provider);

  if (!apiKey) {
    return {
      ok: false,
      error:
        '导入失败：找不到 API Key 字段。\n' +
        '识别字段名（任一即可）：apiKey / api_key / key / token / secret / OPENAI_API_KEY。',
    };
  }

  // provider 优先级：显式字段 → url 反推 → custom →（仅 custom 时）model 弱推断
  let pid: ProviderId | null = providerRaw ? resolveProviderAlias(providerRaw) : null;
  if (!pid && baseUrl) pid = matchProviderByUrl(baseUrl);
  if (!pid) pid = 'custom';

  let inferredFromModel = false;
  let modelInferenceReason: string | undefined;
  if (pid === 'custom' && model) {
    const inferred = inferProviderFromModelId(model);
    if (inferred) {
      pid = inferred.providerId;
      inferredFromModel = true;
      modelInferenceReason = inferred.reason;
    }
  }

  const next = mergeOneProvider(base, pid, {
    apiKey,
    baseUrl: baseUrl
      ? pid === 'gemini' || pid === 'anthropic'
        ? baseUrl.replace(/\/+$/, '')
        : ensureOpenAIBase(baseUrl)
      : undefined,
    model: model || undefined,
  });

  const meta = PROVIDERS[pid];
  let hint = `已导入「${meta.label}」的配置并切换为当前供应商。`;
  if (inferredFromModel) {
    hint = modelInferenceReason
      ? `${modelInferenceReason} 已切换为「${meta.label}」。`
      : `未从 baseUrl/渠道类型确定具体厂商，已根据模型名「${model}」推断为「${meta.label}」。若非该厂商请在「模型供应商」中改选。`;
  } else if (providerRaw && !resolveProviderAlias(providerRaw)) {
    hint = `未识别 provider 字段「${providerRaw}」，已按 baseUrl 归类到「${meta.label}」。${
      pid === 'custom' ? '如需切到具体厂商可在下方调整。' : ''
    }`;
  } else if (!providerRaw && pid !== 'custom') {
    hint = `未提供 provider 字段，已按 baseUrl 自动识别为「${meta.label}」。`;
  } else if (pid === 'custom' && !providerRaw) {
    hint = `未识别出具体厂商，已导入到「自定义」端点。`;
  }
  return { ok: true, settings: next, hint };
}
