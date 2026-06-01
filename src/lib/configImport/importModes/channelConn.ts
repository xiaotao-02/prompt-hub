import { PROVIDERS } from '../../providers';
import { inferProviderFromModelId } from '../../providerIdFromModel';
import type { AppSettings } from '../../types';
import { pickStr } from '../jsonHelpers';
import { mergeOneProvider } from '../merge';
import { KEY_SYNONYMS } from '../maps';
import { ensureOpenAIBase, matchProviderByUrl } from '../providerResolve';
import type { ImportResult } from '../types';

export function importChannelConn(base: AppSettings, raw: Record<string, unknown>): ImportResult {
  const apiKey = pickStr(raw, KEY_SYNONYMS.apiKey);
  const rawUrl = pickStr(raw, KEY_SYNONYMS.baseUrl);
  const modelConn = pickStr(raw, KEY_SYNONYMS.model);
  if (!apiKey) {
    return { ok: false, error: '导入失败：渠道连接缺少 key/token/apiKey 字段或为空。' };
  }
  if (!rawUrl) {
    return { ok: false, error: '导入失败：渠道连接缺少 url/baseUrl/endpoint 字段或为空。' };
  }
  const baseUrl = ensureOpenAIBase(rawUrl);
  const fromUrl = matchProviderByUrl(rawUrl);
  let pid = fromUrl ?? 'custom';
  const fromUrlWasUnrecognized = pid === 'custom';
  if (pid === 'custom' && modelConn) {
    const inferred = inferProviderFromModelId(modelConn);
    if (inferred) pid = inferred.providerId;
  }
  const next = mergeOneProvider(base, pid, {
    apiKey,
    baseUrl,
    model: modelConn || undefined,
  });
  const meta = PROVIDERS[pid];
  const inferredFromModel = fromUrlWasUnrecognized && pid !== 'custom';
  let hintMsg: string;
  if (pid === 'custom') {
    hintMsg = `已把渠道「${baseUrl}」导入到「自定义」。如需切换到具体厂商可在下方「模型供应商」调整。`;
  } else if (inferredFromModel) {
    hintMsg = `已根据模型名「${modelConn}」推断为「${meta.label}」并导入（${baseUrl}）。`;
  } else {
    hintMsg = `已识别为「${meta.label}」并导入配置（${baseUrl}）。`;
  }
  return {
    ok: true,
    settings: next,
    hint: hintMsg,
  };
}
