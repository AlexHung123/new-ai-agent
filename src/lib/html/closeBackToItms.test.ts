import { describe, expect, it } from 'vitest';
import { closeBackToItms } from './closeBackToItms';

describe('closeBackToItms', () => {
  it('tells the parent iTMS window to close when embedded', () => {
    const posted: unknown[] = [];
    const result = closeBackToItms({
      embedded: true,
      historyLength: 3,
      post: (message) => posted.push(message),
      back: () => undefined,
      closeWindow: () => undefined,
    });
    expect(result).toBe('posted');
    expect(posted).toEqual([{ type: 'agent-html-close' }]);
  });

  it('goes back when the page is not inside the iTMS window', () => {
    const posted: unknown[] = [];
    let backed = false;
    const result = closeBackToItms({
      embedded: false,
      historyLength: 2,
      post: (message) => posted.push(message),
      back: () => {
        backed = true;
      },
      closeWindow: () => undefined,
    });
    expect(result).toBe('back');
    expect(posted).toEqual([]);
    expect(backed).toBe(true);
  });
});
