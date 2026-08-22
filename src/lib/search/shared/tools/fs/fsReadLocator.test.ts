import { describe, expect, it } from 'vitest';
import {
  mergeFsReadRange,
  parseFsReadLocator,
} from './fsReadLocator';

describe('parseFsReadLocator', () => {
  it('returns a plain path unchanged', () => {
    expect(parseFsReadLocator('dir/part-01.md')).toEqual({
      path: 'dir/part-01.md',
    });
  });

  it('parses path:fromLine and path:fromLine:maxLines', () => {
    expect(parseFsReadLocator('dir/part-01.md:142')).toEqual({
      path: 'dir/part-01.md',
      fromLine: 142,
    });
    expect(parseFsReadLocator('dir/part-01.md:142:40')).toEqual({
      path: 'dir/part-01.md',
      fromLine: 142,
      maxLines: 40,
    });
  });

  it('does not treat a Windows drive letter as a locator', () => {
    expect(parseFsReadLocator('C:foo')).toEqual({ path: 'C:foo' });
  });

  it('ignores a non-numeric suffix', () => {
    expect(parseFsReadLocator('part-01.md:draft')).toEqual({
      path: 'part-01.md:draft',
    });
  });
});

describe('mergeFsReadRange', () => {
  it('defaults to line 1 and the configured cap', () => {
    expect(
      mergeFsReadRange({
        locator: { path: 'a.md' },
        maxReadLines: 80,
      }),
    ).toEqual({ fromLine: 1, maxLines: 80 });
  });

  it('lets params override a path suffix and caps maxLines', () => {
    expect(
      mergeFsReadRange({
        locator: { path: 'a.md', fromLine: 10, maxLines: 40 },
        fromLine: 120,
        maxLines: 500,
        maxReadLines: 80,
      }),
    ).toEqual({ fromLine: 120, maxLines: 80 });
  });

  it('treats maxReadLines 0 as no line cap', () => {
    const all = mergeFsReadRange({
      locator: { path: 'a.md' },
      maxReadLines: 0,
    });
    expect(all.fromLine).toBe(1);
    expect(all.maxLines).toBeGreaterThan(10_000);

    expect(
      mergeFsReadRange({
        locator: { path: 'a.md' },
        fromLine: 20,
        maxLines: 5,
        maxReadLines: 0,
      }),
    ).toEqual({ fromLine: 20, maxLines: 5 });
  });
});
