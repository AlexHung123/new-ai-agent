import { describe, expect, it } from 'vitest';
import { resolveAgentHtmlSnapshot } from './agentHtmlSnapshot';

describe('resolveAgentHtmlSnapshot', () => {
  it('ignores an empty client snapshot until the editor has loaded', () => {
    expect(
      resolveAgentHtmlSnapshot({
        html: '',
        htmlReady: false,
        working: null,
        pageHtml: '<p>from db</p>',
      }),
    ).toEqual({ html: '<p>from db</p>', persist: 'page' });
  });

  it('keeps an existing working copy when the canvas is not ready', () => {
    expect(
      resolveAgentHtmlSnapshot({
        html: '',
        htmlReady: undefined,
        working: '<p>working</p>',
        pageHtml: '<p>from db</p>',
      }),
    ).toEqual({ html: '<p>working</p>', persist: 'none' });
  });

  it('accepts an empty editor snapshot after the canvas has loaded', () => {
    expect(
      resolveAgentHtmlSnapshot({
        html: '',
        htmlReady: true,
        working: '<p>working</p>',
        pageHtml: '<p>from db</p>',
      }),
    ).toEqual({ html: '', persist: 'client' });
  });
});
