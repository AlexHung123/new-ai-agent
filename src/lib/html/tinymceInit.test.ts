import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { WCMS_TINYMCE_INIT } from './tinymceInit';

describe('WCMS_TINYMCE_INIT', () => {
  it('only names community TinyMCE plugins that ship in node_modules', () => {
    const plugins = WCMS_TINYMCE_INIT.plugins.split(/\s+/).filter(Boolean);
    expect(plugins.length).toBeGreaterThan(0);
    expect(plugins).not.toContain('advtable');
    for (const name of plugins) {
      expect(
        existsSync(
          path.join(process.cwd(), 'node_modules', 'tinymce', 'plugins', name),
        ),
        `missing plugin ${name}`,
      ).toBe(true);
    }
  });

  it('keeps the iTMS allow-list so scripts and iframes survive round-trip', () => {
    expect(WCMS_TINYMCE_INIT.extended_valid_elements).toBe(
      'meta[*],link[*],style[*],script[*],button[*],iframe[*],div[*],span[*],p[*],input[*],a[*],img[*],li[*],i[*],svg[*],video[*]',
    );
    expect(WCMS_TINYMCE_INIT.extended_valid_children).toBe(
      '+p[script|iframe],+iframe[script|meta|link|script|button],+body[style|meta|link|script|button|iframe],+div[h2|span|meta|object|link|script|button|iframe]',
    );
    expect(WCMS_TINYMCE_INIT.sandbox_iframes).toBe(false);
    expect(WCMS_TINYMCE_INIT.convert_urls).toBe(false);
    expect(WCMS_TINYMCE_INIT.relative_urls).toBe(false);
  });
});
