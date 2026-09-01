import { describe, expect, it } from 'vitest';
import {
  NARROW_LAYOUT_CLASS,
  READER_LAYOUT_CLASS,
  WIDE_LAYOUT_CLASS,
  layoutContentClassName,
  layoutKind,
  shouldUseWideLayout,
} from './layoutWidth';

describe('layoutKind', () => {
  it('keeps Agent Reader on the default layout before hydration', () => {
    expect(layoutKind([''], 'agentReader', false)).toBe('narrow');
  });

  it('uses the flush reader layout after hydration', () => {
    expect(layoutKind([''], 'agentReader', true)).toBe('reader');
  });

  it('widens the agents picker from the URL on the server and the client', () => {
    expect(layoutKind(['agents'], 'agentSFC', false)).toBe('wide');
    expect(layoutKind(['agents'], 'agentSFC', true)).toBe('wide');
  });

  it('keeps other chat agents on the narrow layout', () => {
    expect(layoutKind([''], 'agentSFC', true)).toBe('narrow');
    expect(layoutKind(['c', 'abc'], 'agentDocument', true)).toBe('narrow');
  });
});

describe('shouldUseWideLayout', () => {
  it('treats the reader and agents picker as wide shells', () => {
    expect(shouldUseWideLayout([''], 'agentReader', true)).toBe(true);
    expect(shouldUseWideLayout(['agents'], 'agentSFC', false)).toBe(true);
    expect(shouldUseWideLayout([''], 'agentSFC', true)).toBe(false);
  });
});

describe('layoutContentClassName', () => {
  it('lets Agent Reader use the full width beside the sidebar', () => {
    expect(layoutContentClassName('reader')).toBe(READER_LAYOUT_CLASS);
    expect(READER_LAYOUT_CLASS).toContain('max-w-none');
    expect(READER_LAYOUT_CLASS).not.toContain('mx-auto');
  });

  it('uses the wide max-width for the agents picker', () => {
    expect(layoutContentClassName('wide')).toBe(WIDE_LAYOUT_CLASS);
    expect(WIDE_LAYOUT_CLASS).toContain('max-w-[100rem]');
  });

  it('uses the default chat max-width when not wide', () => {
    expect(layoutContentClassName('narrow')).toBe(NARROW_LAYOUT_CLASS);
    expect(NARROW_LAYOUT_CLASS).toContain('max-w-screen-lg');
  });
});
