import { describe, expect, it } from 'vitest';
import { resolveConfiguredChatModel } from './configuredChatModel';

describe('resolveConfiguredChatModel', () => {
  it('reads modelId, apiKey, and baseURL from the config file shape', () => {
    expect(
      resolveConfiguredChatModel({
        modelId: 'deepseek-v4-flash',
        apiKey: 'test',
        baseURL: 'http://192.168.1.51:443/v1/',
      }),
    ).toEqual({
      modelId: 'deepseek-v4-flash',
      apiKey: 'test',
      baseUrl: 'http://192.168.1.51:443/v1',
    });
  });

  it('falls back to the local Ornith model when modelId is blank', () => {
    expect(
      resolveConfiguredChatModel({
        modelId: '  ',
        apiKey: '',
        baseURL: 'http://gw:8000',
      }).modelId,
    ).toBe('Ornith-1.5-35B-A3B-MLX-4bit');
  });

  it('falls back to the local test api key when apiKey is blank', () => {
    expect(
      resolveConfiguredChatModel({
        modelId: 'qwen',
        apiKey: '  ',
        baseURL: 'http://gw:8000',
      }).apiKey,
    ).toBe('test');
  });
});
