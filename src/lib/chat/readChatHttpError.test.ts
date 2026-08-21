import { describe, expect, it } from 'vitest';
import { messageFromChatHttpError } from './readChatHttpError';

describe('messageFromChatHttpError', () => {
  it('reads message from the pretty-printed chat 400 body', () => {
    const body = `{
    "message": "Invalid request body",
    "error": [
        {
            "path": "documentId",
            "message": "Expected string, received null"
        }
    ]
}`;
    expect(messageFromChatHttpError(body, 400)).toBe('Invalid request body');
  });

  it('does not treat a truncated { as the user-visible error', () => {
    expect(messageFromChatHttpError('{', 400)).toBe('Request failed (400)');
  });
});
