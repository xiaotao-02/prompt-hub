import { PROVIDER_LIST } from '../providers';
import type { ProviderId } from '../types';

export const VALID_IDS = new Set<ProviderId>(PROVIDER_LIST.map((p) => p.id));

/** 用户写 provider 时常见的"别名 → 内置 id"映射（全部小写比较）。 */
export const PROVIDER_ALIASES: Record<string, ProviderId> = {
  // 三大原生
  openai: 'openai',
  'open-ai': 'openai',
  gpt: 'openai',
  chatgpt: 'openai',
  azure: 'openai', // Azure OpenAI 也走 OpenAI 协议；如果是真正 Azure 端点用 custom 更安全，但这里先按 openai 接，用户可以改 baseUrl
  anthropic: 'anthropic',
  claude: 'anthropic',
  gemini: 'gemini',
  google: 'gemini',
  googleai: 'gemini',
  'google-ai': 'gemini',
  vertex: 'gemini',
  // 国内
  zhipu: 'zhipu',
  zhipuai: 'zhipu',
  glm: 'zhipu',
  bigmodel: 'zhipu',
  qwen: 'qwen',
  qwenvl: 'qwen',
  tongyi: 'qwen',
  aliyun: 'qwen',
  dashscope: 'qwen',
  bailian: 'qwen',
  siliconflow: 'siliconflow',
  silicon: 'siliconflow',
  'silicon-flow': 'siliconflow',
  sf: 'siliconflow',
  deepseek: 'deepseek',
  ds: 'deepseek',
  moonshot: 'moonshot',
  kimi: 'moonshot',
  doubao: 'doubao',
  ark: 'doubao',
  volces: 'doubao',
  volcengine: 'doubao',
  'volc-engine': 'doubao',
  stepfun: 'stepfun',
  step: 'stepfun',
  minimax: 'minimax',
  minimaxi: 'minimax',
  minimaxai: 'minimax',
  'minimax-ai': 'minimax',
  abab: 'minimax',
  yi: 'yi',
  '01ai': 'yi',
  '01-ai': 'yi',
  lingyiwanwu: 'yi',
  baidu: 'baidu',
  ernie: 'baidu',
  qianfan: 'baidu',
  // 海外
  openrouter: 'openrouter',
  'open-router': 'openrouter',
  or: 'openrouter',
  xai: 'xai',
  'x-ai': 'xai',
  grok: 'xai',
  mistral: 'mistral',
  pixtral: 'mistral',
  groq: 'groq',
  together: 'together',
  togetherai: 'together',
  'together-ai': 'together',
  fireworks: 'fireworks',
  fireworksai: 'fireworks',
  'fireworks-ai': 'fireworks',
  // 中转
  shukelongda: 'shukelongda',
  // 兜底
  custom: 'custom',
  'openai-compatible': 'custom',
  openai_compatible: 'custom',
  'openai-compat': 'custom',
  oneapi: 'custom',
  'one-api': 'custom',
  newapi: 'custom',
  'new-api': 'custom',
  onehub: 'custom',
  'one-hub': 'custom',
};

/**
 * host 子串关键字 → provider id。
 *
 * 用 host 做"包含匹配"而不是"全等"，是为了让中转域名也能识别 ——
 * 例如某用户把 OpenRouter 转发到自家域 `gw.openrouter-cn.example.com` 仍能命中。
 *
 * 顺序要按"特异度从高到低"排，避免 `googleapis.com` 把 `aistudio.googleapis.com`
 * 这类子域抢走（这里不会冲突，但保留这个习惯）。
 */
export const HOST_RULES: Array<{ keyword: string; id: ProviderId }> = [
  { keyword: 'openrouter', id: 'openrouter' },
  { keyword: 'api.openai.com', id: 'openai' },
  { keyword: 'api.anthropic.com', id: 'anthropic' },
  { keyword: 'anthropic', id: 'anthropic' },
  { keyword: 'generativelanguage.googleapis', id: 'gemini' },
  { keyword: 'aiplatform.googleapis', id: 'gemini' },
  { keyword: 'bigmodel.cn', id: 'zhipu' },
  { keyword: 'open.bigmodel', id: 'zhipu' },
  { keyword: 'dashscope', id: 'qwen' },
  { keyword: 'aliyuncs.com', id: 'qwen' },
  { keyword: 'bailian.console.aliyun', id: 'qwen' },
  { keyword: 'siliconflow', id: 'siliconflow' },
  { keyword: 'deepseek', id: 'deepseek' },
  { keyword: 'moonshot', id: 'moonshot' },
  { keyword: 'ark.cn-beijing.volces', id: 'doubao' },
  { keyword: 'volces.com', id: 'doubao' },
  { keyword: 'volcengine', id: 'doubao' },
  { keyword: 'stepfun', id: 'stepfun' },
  { keyword: 'minimax.chat', id: 'minimax' },
  { keyword: 'minimaxi.com', id: 'minimax' },
  /** 新控制台常见域，与 troubleshooting 文档对齐 */
  { keyword: 'minimax.io', id: 'minimax' },
  { keyword: 'lingyiwanwu', id: 'yi' },
  { keyword: '01.ai', id: 'yi' },
  { keyword: 'qianfan', id: 'baidu' },
  { keyword: 'baidubce', id: 'baidu' },
  { keyword: 'aip.baidubce', id: 'baidu' },
  { keyword: 'api.x.ai', id: 'xai' },
  { keyword: 'mistral.ai', id: 'mistral' },
  { keyword: 'groq.com', id: 'groq' },
  { keyword: 'api.together.xyz', id: 'together' },
  { keyword: 'together.ai', id: 'together' },
  { keyword: 'fireworks.ai', id: 'fireworks' },
  { keyword: 'shukelongda', id: 'shukelongda' },
];

/** 字段名同义词归一化时使用的"小写键"。 */
export const KEY_SYNONYMS = {
  apiKey: [
    'apikey',
    'api_key',
    'key',
    'token',
    'secret',
    'sk',
    'openai_api_key',
    'access_token',
    'authorization',
  ],
  baseUrl: [
    'baseurl',
    'base_url',
    'url',
    'endpoint',
    'api_base',
    'apibase',
    'api_endpoint',
    'openai_base_url',
    'host',
    'apihost',
    'api_host',
    'server',
  ],
  model: ['model', 'model_name', 'modelname', 'default_model', 'defaultmodel', 'openai_model'],
  provider: ['provider', 'type', 'providerid', 'provider_id', 'brand', 'vendor', 'platform'],
};

/**
 * .env / 导出里的变量名 → 内置 provider（弱提示；若密钥本身已有明确前缀则以前缀为准）。
 */
export const ENV_VAR_TO_PROVIDER: Record<string, ProviderId> = {
  OPENAI_API_KEY: 'openai',
  ANTHROPIC_API_KEY: 'anthropic',
  GOOGLE_API_KEY: 'gemini',
  GEMINI_API_KEY: 'gemini',
  DASHSCOPE_API_KEY: 'qwen',
  ALIYUN_API_KEY: 'qwen',
  SILICONFLOW_API_KEY: 'siliconflow',
  DEEPSEEK_API_KEY: 'deepseek',
  MOONSHOT_API_KEY: 'moonshot',
  ARK_API_KEY: 'doubao',
  STEPFUN_API_KEY: 'stepfun',
  MINIMAX_API_KEY: 'minimax',
  MINIMAX_IAAS_API_KEY: 'minimax',
  YI_API_KEY: 'yi',
  QIANFAN_API_KEY: 'baidu',
  OPENROUTER_API_KEY: 'openrouter',
  XAI_API_KEY: 'xai',
  MISTRAL_API_KEY: 'mistral',
  GROQ_API_KEY: 'groq',
  TOGETHER_API_KEY: 'together',
  FIREWORKS_API_KEY: 'fireworks',
};
