import type { ProviderId, ProviderMeta } from './types';
/**
 * 内置 provider 注册表。
 *
 * 大多数厂商都提供 OpenAI Chat Completions 兼容协议；这里默认走 OpenAI 兼容
 * 通道（详见 `src/lib/api/extract.ts` 的 switch 分支），只有 `anthropic` 和
 * `gemini` 走各自的官方协议。
 *
 * 新增 provider 时只需在这里加一项 + 在 `src/lib/types.ts` 的 ProviderId 联合
 * 里补一个 id；运行时所有遍历 / 默认值生成都会自动跟随。
 *
 * 默认模型字段（defaultModel）只是引导，实际可用的模型由用户自己在「设置」
 * 中通过端点 `/models` 拉取后选择，因此即使各家上下架模型也不会让插件失效。
 */
export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  // ============ 三大原生协议 ============
  openai: {
    id: 'openai',
    label: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-5.5',
    docsUrl: 'https://platform.openai.com/api-keys',
    description: '官方 GPT-5.5 / GPT-4o / o-series 视觉模型，识别效果稳定，需要海外网络',
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic Claude',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-6',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Claude Sonnet 4.6 / Claude 4 多模态，描述细腻，适合自然语言提示词',
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    docsUrl: 'https://aistudio.google.com/apikey',
    description: 'Google Gemini 2.5 Flash / Pro，速度快、多模态识图',
  },

  // ============ 国内主流（OpenAI 兼容）============
  zhipu: {
    id: 'zhipu',
    label: '智谱 GLM',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4.6v',
    docsUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    description: '智谱 GLM-4.6V / GLM-4V 系列，国产视觉模型，glm-4v-flash 仍免费',
  },
  qwen: {
    id: 'qwen',
    label: '通义千问 Qwen-VL',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen3-vl-plus',
    docsUrl: 'https://bailian.console.aliyun.com/?apiKey=1',
    description: '阿里云百炼 Qwen3-VL / Qwen-VL，国产视觉旗舰',
  },
  siliconflow: {
    id: 'siliconflow',
    label: '硅基流动 SiliconFlow',
    defaultBaseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'Qwen/Qwen3-VL-32B-Instruct',
    docsUrl: 'https://cloud.siliconflow.cn/account/ak',
    description: '聚合 Qwen3-VL / DeepSeek-VL2 / GLM-4.6V 等开源 VL 模型，国内可直连',
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    description: 'DeepSeek 官方端点，性价比高；视觉建议走 SiliconFlow / 火山的 DeepSeek-VL',
  },
  moonshot: {
    id: 'moonshot',
    label: 'Moonshot Kimi',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-32k-vision-preview',
    docsUrl: 'https://platform.moonshot.cn/console/api-keys',
    description: 'Moonshot 月之暗面 Kimi，长上下文 + 视觉',
  },
  doubao: {
    id: 'doubao',
    label: '字节豆包 Doubao',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'doubao-1-5-vision-pro-32k-250115',
    docsUrl: 'https://console.volcengine.com/ark',
    description: '字节火山方舟 Doubao 视觉模型，需在控制台开通后填 endpoint id',
  },
  stepfun: {
    id: 'stepfun',
    label: '阶跃星辰 Step',
    uiTier: 'extended',
    defaultBaseUrl: 'https://api.stepfun.com/v1',
    defaultModel: 'step-1v-32k',
    docsUrl: 'https://platform.stepfun.com/interface-key',
    description: '阶跃星辰 Step-1V 系列视觉模型',
  },
  minimax: {
    id: 'minimax',
    label: 'MiniMax',
    uiTier: 'extended',
    defaultBaseUrl: 'https://api.minimax.chat/v1',
    defaultModel: 'MiniMax-VL-01',
    docsUrl: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
    description:
      'MiniMax 国产多模态，含 abab / VL 系列；MiniMax-M2* 已自动带 reasoning_split。识图请选择支持 image_url 的 VL 等多模态模型，勿用纯文本 M2 顶替',
  },
  yi: {
    id: 'yi',
    label: '零一万物 Yi',
    uiTier: 'extended',
    defaultBaseUrl: 'https://api.lingyiwanwu.com/v1',
    defaultModel: 'yi-vision-v2',
    docsUrl: 'https://platform.lingyiwanwu.com/apikeys',
    description: '零一万物 01.AI Yi-Vision 系列',
  },
  baidu: {
    id: 'baidu',
    label: '百度千帆 ERNIE',
    defaultBaseUrl: 'https://qianfan.baidubce.com/v2',
    defaultModel: 'ernie-4.5-turbo-vl-32k',
    docsUrl: 'https://console.bce.baidu.com/iam/#/iam/apikey/list',
    description: '百度千帆 ERNIE 4.5 VL 系列（OpenAI 兼容协议）',
  },

  // ============ 海外主流（OpenAI 兼容）============
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-5.5',
    docsUrl: 'https://openrouter.ai/keys',
    description: '聚合上百家模型的统一网关：GPT / Claude / Gemini / Llama / Qwen…',
  },
  xai: {
    id: 'xai',
    label: 'xAI Grok',
    uiTier: 'extended',
    defaultBaseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-4.3',
    docsUrl: 'https://console.x.ai',
    description: 'xAI 官方 Grok 4.3 / Grok Vision 系列，多模态识图',
  },
  mistral: {
    id: 'mistral',
    label: 'Mistral',
    uiTier: 'extended',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'pixtral-large-latest',
    docsUrl: 'https://console.mistral.ai/api-keys',
    description: 'Mistral / Pixtral 多模态，开放权重 + 官方端点',
  },
  groq: {
    id: 'groq',
    label: 'Groq',
    uiTier: 'extended',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.2-90b-vision-preview',
    docsUrl: 'https://console.groq.com/keys',
    description: 'Groq LPU 推理，速度极快；含 Llama 3.2 Vision',
  },
  together: {
    id: 'together',
    label: 'Together AI',
    uiTier: 'extended',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
    docsUrl: 'https://api.together.xyz/settings/api-keys',
    description: '海外开源模型聚合，Llama / Qwen / DeepSeek 等',
  },
  fireworks: {
    id: 'fireworks',
    label: 'Fireworks AI',
    uiTier: 'extended',
    defaultBaseUrl: 'https://api.fireworks.ai/inference/v1',
    defaultModel: 'accounts/fireworks/models/llama-v3p2-90b-vision-instruct',
    docsUrl: 'https://fireworks.ai/account/api-keys',
    description: 'Fireworks 高性能开源模型托管，含 Llama Vision',
  },

  // ============ 第三方中转 ============
  shukelongda: {
    id: 'shukelongda',
    label: '数科隆达 中转',
    uiTier: 'extended',
    defaultBaseUrl: 'https://ai.shukelongda.cn/v1',
    defaultModel: 'gpt-5.5',
    docsUrl: 'https://ai.shukelongda.cn',
    description: '第三方 OpenAI 兼容中转网关，可聚合多家模型；需自行到该站点申请 Key',
    streamingNote: '若中转端点不支持 SSE，将一次性返回完整结果并在进度条提示',
  },

  // ============ 兜底 ============
  custom: {
    id: 'custom',
    label: '自定义 (OpenAI 兼容)',
    defaultBaseUrl: 'https://your-endpoint.com/v1',
    defaultModel: 'your-model',
    docsUrl: '',
    description: '任何 OpenAI Chat Completions 协议兼容的服务（自部署 / 中转 / NewAPI 等）',
    streamingNote: '若端点不支持 SSE 流式，将一次性返回完整结果并在进度条提示',
  },
};

export const PROVIDER_LIST: ProviderMeta[] = Object.values(PROVIDERS);

/** 服务商下拉展示顺序：英文供应商在前（A-Z），中文供应商按拼音在后；不含内置服务 */
export const PROVIDER_LIST_SORTED: ProviderMeta[] = PROVIDER_LIST.sort((a, b) => {
  const aLatin = /^[A-Za-z]/.test(a.label);
  const bLatin = /^[A-Za-z]/.test(b.label);
  if (aLatin !== bLatin) return aLatin ? -1 : 1;
  return a.label.localeCompare(b.label, 'zh-Hans-CN');
});
