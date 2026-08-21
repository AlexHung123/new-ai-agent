import { describe, expect, it } from 'vitest';
import { buildPiModelFromConfig, createPiModelBundle } from './piModel';

describe('buildPiModelFromConfig', () => {
  it('builds an OpenAI-completions model pointed at the configured gateway', () => {
    const model = buildPiModelFromConfig({
      modelId: 'qwen',
      apiKey: 'k',
      baseUrl: 'http://gw:8000/',
    });

    expect(model.id).toBe('qwen');
    expect(model.name).toBe('qwen');
    expect(model.api).toBe('openai-completions');
    expect(model.provider).toBe('local-openai');
    expect(model.baseUrl).toBe('http://gw:8000');
    expect(model.compat?.supportsDeveloperRole).toBe(false);
    expect(model.compat?.maxTokensField).toBe('max_tokens');
  });

  it('falls back to the local Ornith model when modelId is empty', () => {
    const model = buildPiModelFromConfig({
      modelId: '',
      apiKey: '',
      baseUrl: 'http://gw:8000',
    });
    expect(model.id).toBe('Ornith-1.5-35B-A3B-MLX-4bit');
  });
});

describe('createPiModelBundle', () => {
  it('exposes pi-ai streamSimple on the bundle', () => {
    const bundle = createPiModelBundle({
      modelId: 'qwen',
      apiKey: 'secret',
      baseUrl: 'http://gw:8000',
    });
    expect(typeof bundle.streamSimple).toBe('function');
  });

  it('exposes getApiKey from the configured key', () => {
    const bundle = createPiModelBundle({
      modelId: 'qwen',
      apiKey: 'secret',
      baseUrl: 'http://gw:8000',
    });
    expect(bundle.getApiKey()).toBe('secret');
  });

  it('returns undefined when apiKey is blank', () => {
    const bundle = createPiModelBundle({
      modelId: 'qwen',
      apiKey: '  ',
      baseUrl: 'http://gw:8000',
    });
    expect(bundle.getApiKey()).toBeUndefined();
  });
});
