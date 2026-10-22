import { describe, expect, it } from 'vitest';
import { resolveAgentHtmlSnapshot } from './agentHtmlSnapshot';

describe('resolveAgentHtmlSnapshot', () => {
  it('ignores an empty client snapshot until the editor has loaded', () => {
    expect(
      resolveAgentHtmlSnapshot({
        html: '',
        htmlReady: false,
        pageHtml: '<p>from db</p>',
      }),
    ).toEqual({ html: '<p>from db</p>' });
  });

  it('uses the database page when the canvas is not ready', () => {
    expect(
      resolveAgentHtmlSnapshot({
        html: '',
        htmlReady: undefined,
        pageHtml: '<p>from db</p>',
      }),
    ).toEqual({ html: '<p>from db</p>' });
  });

  it('returns empty html when the canvas is not ready and the database page is missing', () => {
    expect(
      resolveAgentHtmlSnapshot({
        html: undefined,
        htmlReady: false,
        pageHtml: null,
      }),
    ).toEqual({ html: '' });
  });

  it('accepts an empty editor snapshot after the canvas has loaded', () => {
    expect(
      resolveAgentHtmlSnapshot({
        html: '',
        htmlReady: true,
        pageHtml: '<p>from db</p>',
      }),
    ).toEqual({ html: '' });
  });
});
