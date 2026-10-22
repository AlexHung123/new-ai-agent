import { describe, expect, it } from 'vitest';
import { resolveBoundWcms, wcmsBindPatchForExistingChat } from './resolveBoundWcms';

describe('resolveBoundWcms', () => {
  it('returns none for other agents', () => {
    expect(
      resolveBoundWcms({
        focusMode: 'agentWriting',
        chatExists: false,
        bodyWcmsContentId: 12,
        bodyWcmsPageIndex: 0,
      }),
    ).toEqual({ status: 'none' });
  });

  it('binds a new Agent HTML chat from the request body', () => {
    expect(
      resolveBoundWcms({
        focusMode: 'agentHtml',
        chatExists: false,
        bodyWcmsContentId: '15',
        bodyWcmsPageIndex: '2',
      }),
    ).toEqual({
      status: 'ok',
      wcmsContentId: 15,
      pageIndex: 2,
      lang: 'en',
    });
  });

  it('allows Agent HTML without a content id', () => {
    expect(
      resolveBoundWcms({
        focusMode: 'agentHtml',
        chatExists: false,
      }),
    ).toEqual({ status: 'none' });
  });

  it('keeps the stored bind on an existing chat and ignores the body', () => {
    expect(
      resolveBoundWcms({
        focusMode: 'agentHtml',
        chatExists: true,
        existingWcmsContentId: 7,
        existingWcmsPageIndex: 1,
        existingWcmsLang: 'tc',
        bodyWcmsContentId: 99,
        bodyWcmsPageIndex: 0,
        bodyWcmsLang: 'en',
      }),
    ).toEqual({
      status: 'ok',
      wcmsContentId: 7,
      pageIndex: 1,
      lang: 'tc',
    });
  });

  it('accepts the body bind once when an existing chat has no WCMS id', () => {
    expect(
      resolveBoundWcms({
        focusMode: 'agentHtml',
        chatExists: true,
        existingWcmsContentId: null,
        bodyWcmsContentId: 15,
        bodyWcmsPageIndex: 2,
        bodyWcmsLang: 'sc',
      }),
    ).toEqual({
      status: 'ok',
      wcmsContentId: 15,
      pageIndex: 2,
      lang: 'sc',
    });
  });
});

describe('wcmsBindPatchForExistingChat', () => {
  it('fills a missing bind and leaves an existing bind alone', () => {
    expect(
      wcmsBindPatchForExistingChat(
        { wcmsContentId: null },
        { wcmsContentId: 15, wcmsPageIndex: 2, wcmsLang: 'sc' },
      ),
    ).toEqual({
      wcmsContentId: 15,
      wcmsPageIndex: 2,
      wcmsLang: 'sc',
    });
    expect(
      wcmsBindPatchForExistingChat(
        { wcmsContentId: 7 },
        { wcmsContentId: 15, wcmsPageIndex: 0, wcmsLang: 'en' },
      ),
    ).toBeNull();
  });
});
