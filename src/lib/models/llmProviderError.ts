export const LLM_PROVIDER_CONNECTION_ERROR = 'LLM provider connection error.';

const CONNECTION_MARKERS = [
  'econnrefused',
  'enotfound',
  'etimedout',
  'econnreset',
  'enetunreach',
  'ehostunreach',
  'eai_again',
  'fetch failed',
  'network_error',
  'network error',
  'socket hang up',
  'other side closed',
  'connect timeout',
  'und_err_connect_timeout',
  'und_err_socket',
  'und_err_connect',
  'connection error.',
  'connection error',
  'does not exist',
  'model_not_found',
  'notfounderror',
  'the model `',
];

function collectErrorText(error: unknown, depth = 0): string {
  if (depth > 4 || error == null) return '';
  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    const parts = [error.name, error.message];
    const extra = error as Error & {
      cause?: unknown;
      errors?: unknown;
      code?: unknown;
    };
    if (extra.code) parts.push(String(extra.code));
    if (extra.cause) parts.push(collectErrorText(extra.cause, depth + 1));
    if (Array.isArray(extra.errors)) {
      for (const nested of extra.errors) {
        parts.push(collectErrorText(nested, depth + 1));
      }
    }
    return parts.join(' ');
  }

  if (typeof error === 'object') {
    const rec = error as {
      errorMessage?: unknown;
      message?: unknown;
      code?: unknown;
    };
    return [rec.errorMessage, rec.message, rec.code]
      .filter((value) => value != null && value !== '')
      .map(String)
      .join(' ');
  }

  return String(error);
}

export function isLlmProviderConnectionError(error: unknown): boolean {
  if (
    error &&
    typeof error === 'object' &&
    (error as { stopReason?: unknown }).stopReason === 'error'
  ) {
    return true;
  }
  const haystack = collectErrorText(error).toLowerCase();
  if (!haystack) return false;
  return CONNECTION_MARKERS.some((marker) => haystack.includes(marker));
}

export function formatAgentFailureResponse(error: unknown): string {
  if (isLlmProviderConnectionError(error)) {
    return LLM_PROVIDER_CONNECTION_ERROR;
  }
  return `\n\nError: ${error instanceof Error ? error.message : String(error)}`;
}
