import { ChatOpenAI } from '@langchain/openai';
import { Embeddings } from '@langchain/core/embeddings';
import configManager from '../config';

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
    modelId: (input.modelId || '').trim() || 'gpt-3.5-turbo',
    apiKey: (input.apiKey || '').trim(),
    baseUrl: (input.baseURL || '').trim().replace(/\/$/, ''),
  };
}

export function loadConfiguredChatModel(): ChatOpenAI {
  const cfg = resolveConfiguredChatModel({
    modelId: configManager.getConfig('base.modelId', ''),
    apiKey: configManager.getConfig('base.apiKey', ''),
    baseURL:
      configManager.getConfig('base.baseURL', '') || 'http://192.168.1.51:8000',
  });

  return new ChatOpenAI({
    apiKey: cfg.apiKey || 'not-needed',
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
