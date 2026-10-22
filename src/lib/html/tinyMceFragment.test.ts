import { describe, expect, it } from 'vitest';
import { toTinyMceBodyFragment } from './tinyMceFragment';

describe('toTinyMceBodyFragment', () => {
  it('keeps a body fragment and drops html, head, and body tags', () => {
    const fragment = toTinyMceBodyFragment(
      '<!DOCTYPE html><html><head><style>.a{color:red}</style><title>x</title></head><body><p>Hi</p><script>ok()</script></body></html>',
    );
    expect(fragment).toContain('<style>.a{color:red}</style>');
    expect(fragment).toContain('<p>Hi</p>');
    expect(fragment).toContain('<script>ok()</script>');
    expect(fragment).not.toMatch(/<\/?(html|head|body)\b/i);
    expect(fragment).not.toMatch(/<!DOCTYPE/i);
    expect(fragment).not.toContain('<title>');
  });

  it('leaves an existing body fragment unchanged', () => {
    const source = '<style>.a{}</style><p>Hi</p><script>ok()</script>';
    expect(toTinyMceBodyFragment(source)).toBe(source);
  });
});
