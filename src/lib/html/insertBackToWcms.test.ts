import { describe, expect, it } from 'vitest';
import { insertBackToWcms } from './insertBackToWcms';

describe('insertBackToWcms', () => {
  const bind = {
    wcmsContentId: 15,
    pageIndex: 0,
    lang: 'en' as const,
    html: '<html><body><p>ok</p></body></html>',
  };

  it('posts a body fragment back to the parent WCMS form', () => {
    const posted: unknown[] = [];
    const result = insertBackToWcms({
      ...bind,
      embedded: true,
      post: (message) => posted.push(message),
    });
    expect(result).toBe('sent');
    expect(posted).toEqual([
      {
        type: 'agent-html-apply',
        wcmsContentId: 15,
        pageIndex: 0,
        lang: 'en',
        html: '<p>ok</p>',
      },
    ]);
  });

  it('does not post when the page is not inside the iTMS window', () => {
    const posted: unknown[] = [];
    expect(
      insertBackToWcms({
        ...bind,
        embedded: false,
        post: (message) => posted.push(message),
      }),
    ).toBe('not-embedded');
    expect(posted).toEqual([]);
  });

  it('posts to the bound ITMS origin', () => {
    let origin = '';
    const result = insertBackToWcms({
      ...bind,
      embedded: true,
      targetOrigin: 'https://itms.example/itms/',
      post: (_message, targetOrigin) => {
        origin = targetOrigin;
      },
    });
    expect(result).toBe('sent');
    expect(origin).toBe('https://itms.example');
  });

  it('falls back to any origin when none is bound', () => {
    let origin = '';
    insertBackToWcms({
      ...bind,
      embedded: true,
      post: (_message, targetOrigin) => {
        origin = targetOrigin;
      },
    });
    expect(origin).toBe('*');
  });
});
