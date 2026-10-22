import { describe, expect, it } from 'vitest';
import {
  agentHtmlApplyMessage,
  agentHtmlChatHref,
  parseItmsOrigin,
  parseWcmsBind,
  parseWcmsContentId,
  parseWcmsLang,
  parseWcmsPageIndex,
  urlWcmsBoot,
} from './wcmsQuery';

describe('parseWcmsContentId', () => {
  it('accepts a positive integer or digit string', () => {
    expect(parseWcmsContentId(12)).toBe(12);
    expect(parseWcmsContentId('12')).toBe(12);
    expect(parseWcmsContentId(' 12 ')).toBe(12);
  });

  it('rejects missing, zero, negative, and non-integer values', () => {
    expect(parseWcmsContentId(undefined)).toBeNull();
    expect(parseWcmsContentId(null)).toBeNull();
    expect(parseWcmsContentId(0)).toBeNull();
    expect(parseWcmsContentId(-1)).toBeNull();
    expect(parseWcmsContentId('0')).toBeNull();
    expect(parseWcmsContentId('12.5')).toBeNull();
    expect(parseWcmsContentId('abc')).toBeNull();
  });
});

describe('parseWcmsPageIndex', () => {
  it('defaults missing values to page 0', () => {
    expect(parseWcmsPageIndex(undefined)).toBe(0);
    expect(parseWcmsPageIndex(null)).toBe(0);
    expect(parseWcmsPageIndex('')).toBe(0);
  });

  it('accepts a non-negative integer', () => {
    expect(parseWcmsPageIndex(0)).toBe(0);
    expect(parseWcmsPageIndex(3)).toBe(3);
    expect(parseWcmsPageIndex('2')).toBe(2);
  });

  it('falls back to 0 for invalid values', () => {
    expect(parseWcmsPageIndex(-1)).toBe(0);
    expect(parseWcmsPageIndex('x')).toBe(0);
  });
});

describe('parseWcmsBind', () => {
  it('returns null without a content id', () => {
    expect(parseWcmsBind({ pageIndex: 1 })).toBeNull();
  });

  it('pairs a content id with a page index', () => {
    expect(
      parseWcmsBind({ wcmsContentId: '88', pageIndex: '1' }),
    ).toEqual({ wcmsContentId: 88, pageIndex: 1, lang: 'en' });
  });

  it('keeps tc and sc and defaults other languages to en', () => {
    expect(parseWcmsLang('tc')).toBe('tc');
    expect(parseWcmsLang('SC')).toBe('sc');
    expect(parseWcmsLang('fr')).toBe('en');
    expect(
      parseWcmsBind({ wcmsContentId: 4, pageIndex: 2, lang: 'tc' }),
    ).toEqual({ wcmsContentId: 4, pageIndex: 2, lang: 'tc' });
  });
});

describe('parseItmsOrigin', () => {
  it('keeps an http(s) origin and drops anything else', () => {
    expect(parseItmsOrigin('https://itms.example/itms/')).toBe(
      'https://itms.example',
    );
    expect(parseItmsOrigin('javascript:alert(1)')).toBeNull();
    expect(parseItmsOrigin('')).toBeNull();
  });
});

describe('urlWcmsBoot', () => {
  it('reads an Agent HTML bind from the page query', () => {
    const params = new URLSearchParams(
      'wcmsContentId=88&pageIndex=1&lang=tc&itmsOrigin=https://itms.example/itms/',
    );
    expect(urlWcmsBoot(params)).toEqual({
      bind: { wcmsContentId: 88, pageIndex: 1, lang: 'tc' },
      origin: 'https://itms.example',
    });
  });

  it('returns null when the query has no content id', () => {
    expect(urlWcmsBoot(new URLSearchParams('focus=writing'))).toBeNull();
  });
});

describe('agentHtmlChatHref', () => {
  it('opens a new chat with the WCMS bind in the query', () => {
    expect(
      agentHtmlChatHref(
        { wcmsContentId: 88, pageIndex: 1, lang: 'tc' },
        'https://itms.example/app',
      ),
    ).toBe(
      '/itms/ai/?wcmsContentId=88&pageIndex=1&lang=tc&itmsOrigin=https%3A%2F%2Fitms.example',
    );
  });
});

describe('agentHtmlApplyMessage', () => {
  it('names the page and language for the iTMS form', () => {
    expect(
      agentHtmlApplyMessage(
        { wcmsContentId: 8, pageIndex: 1, lang: 'sc' },
        '<p>x</p>',
      ),
    ).toEqual({
      type: 'agent-html-apply',
      wcmsContentId: 8,
      pageIndex: 1,
      lang: 'sc',
      html: '<p>x</p>',
    });
  });
});
