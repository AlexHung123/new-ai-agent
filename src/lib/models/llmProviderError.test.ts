import { describe, expect, it } from 'vitest';
import {
  LLM_PROVIDER_CONNECTION_ERROR,
  formatAgentFailureResponse,
  isLlmProviderConnectionError,
} from './llmProviderError';

describe('isLlmProviderConnectionError', () => {
  it('detects Node connection refused', () => {
    expect(
      isLlmProviderConnectionError(
        new Error('connect ECONNREFUSED 192.168.128.122:8000'),
      ),
    ).toBe(true);
  });

  it('detects undici fetch failed with a nested cause', () => {
    const err = new TypeError('fetch failed');
    (err as Error & { cause?: unknown }).cause = new Error(
      'connect ECONNREFUSED 127.0.0.1:8000',
    );
    expect(isLlmProviderConnectionError(err)).toBe(true);
  });

  it('detects provider network_error stop reason', () => {
    expect(
      isLlmProviderConnectionError(
        new Error('Provider finish_reason: network_error'),
      ),
    ).toBe(true);
  });

  it('detects a missing/unknown model from the OpenAI-compatible gateway', () => {
    expect(
      isLlmProviderConnectionError(
        new Error(
          '404 The model `deepseek-ai/DeepSeek-V4-Flash-0731111` does not exist.',
        ),
      ),
    ).toBe(true);
  });

  it('detects stopReason=error from pi-ai even without a network marker', () => {
    expect(
      isLlmProviderConnectionError({
        stopReason: 'error',
        errorMessage: '404 The model `missing` does not exist.',
      }),
    ).toBe(true);
  });

  it('does not treat model/content errors as connection failures', () => {
    expect(
      isLlmProviderConnectionError(new Error('context length exceeded')),
    ).toBe(false);
    expect(isLlmProviderConnectionError(new Error('Invalid API key'))).toBe(
      false,
    );
  });
});

describe('formatAgentFailureResponse', () => {
  it('returns the LLM connection fallback instead of the raw error', () => {
    expect(
      formatAgentFailureResponse(
        new Error('connect ECONNREFUSED 192.168.128.122:8000'),
      ),
    ).toBe(LLM_PROVIDER_CONNECTION_ERROR);
  });

  it('keeps the existing Error: prefix for other failures', () => {
    expect(formatAgentFailureResponse(new Error('boom'))).toBe('\n\nError: boom');
  });

  it('maps a missing model to the LLM connection fallback', () => {
    expect(
      formatAgentFailureResponse(
        new Error(
          '404 The model `deepseek-ai/DeepSeek-V4-Flash-0731111` does not exist.',
        ),
      ),
    ).toBe(LLM_PROVIDER_CONNECTION_ERROR);
  });
});
