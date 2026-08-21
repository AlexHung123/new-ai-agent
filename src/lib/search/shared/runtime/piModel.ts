import { streamSimple } from '@earendil-works/pi-ai';

export type PiModelConfig = {
  modelId: string;
  apiKey: string;
  baseUrl: string;
};

export type PiModel = {
  id: string;
  name: string;
  api: 'openai-completions';
  provider: string;
  baseUrl: string;
  reasoning: boolean;
  input: Array<'text' | 'image'>;
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };
  contextWindow: number;
  maxTokens: number;
  compat?: {
    supportsStore: boolean;
    supportsDeveloperRole: boolean;
    supportsReasoningEffort: boolean;
    supportsStrictMode: boolean;
    maxTokensField: 'max_tokens';
  };
};

export type PiModelBundle = {
  model: PiModel;
  streamSimple: typeof streamSimple;
  getApiKey: () => string | undefined;
};

const DEFAULT_MODEL_ID = 'gpt-3.5-turbo';

export function buildPiModelFromConfig(config: PiModelConfig): PiModel {
  const id = (config.modelId || '').trim() || DEFAULT_MODEL_ID;
  const baseUrl = (config.baseUrl || '').replace(/\/$/, '');

  return {
    id,
    name: id,
    api: 'openai-completions',
    provider: 'local-openai',
    baseUrl,
    reasoning: false,
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 256_000,
    maxTokens: 16384,
    compat: {
      supportsStore: false,
      supportsDeveloperRole: false,
      supportsReasoningEffort: false,
      supportsStrictMode: false,
      maxTokensField: 'max_tokens',
    },
  };
}

export function createPiModelBundle(config: PiModelConfig): PiModelBundle {
  const apiKey = (config.apiKey || '').trim();
  return {
    model: buildPiModelFromConfig(config),
    streamSimple,
    getApiKey: () => apiKey || undefined,
  };
}
