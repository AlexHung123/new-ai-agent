import { ChatOpenAI } from '@langchain/openai';
import { Embeddings } from '@langchain/core/embeddings';
import configManager from '../config';

export const DEFAULT_CHAT_MODEL_ID = 'Ornith-1.5-35B-A3B-MLX-4bit';
export const DEFAULT_CHAT_BASE_URL = 'http://192.168.128.122:8000/v1';
export const DEFAULT_CHAT_API_KEY = 'test';

export type ConfiguredChatModel = {
  modelId: string;
  apiKey: string;
  baseUrl: string;
};

export function resolveConfiguredChatModel(input: {
  modelId?: string;
  apiKey?: string;
  baseURL?: string;
}): ConfiguredChatModel {
  return {
    modelId: (input.modelId || '').trim() || DEFAULT_CHAT_MODEL_ID,
    apiKey: (input.apiKey || '').trim() || DEFAULT_CHAT_API_KEY,
    baseUrl: (input.baseURL || '').trim().replace(/\/$/, ''),
  };
}

export function loadConfiguredChatModel(): ChatOpenAI {
  const cfg = resolveConfiguredChatModel({
    modelId: configManager.getConfig('base.modelId', ''),
    apiKey: configManager.getConfig('base.apiKey', ''),
    baseURL:
      configManager.getConfig('base.baseURL', '') || DEFAULT_CHAT_BASE_URL,
  });

  return new ChatOpenAI({
    apiKey: cfg.apiKey,
    temperature: 0.7,
    model: cfg.modelId,
    configuration: {
      baseURL: cfg.baseUrl || undefined,
    },
    modelKwargs: {
      enable_thinking: false,
    },
  });
}

export class NoopEmbeddings extends Embeddings {
  constructor() {
    super({});
  }

  embedDocuments(documents: string[]): Promise<number[][]> {
    return Promise.resolve(documents.map(() => [0]));
  }

  embedQuery(_document: string): Promise<number[]> {
    return Promise.resolve([0]);
  }
}
