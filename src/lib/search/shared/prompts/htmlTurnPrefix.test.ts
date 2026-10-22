import { describe, expect, it } from 'vitest';
import { buildHtmlUserPrompt } from './htmlTurnPrefix';

describe('buildHtmlUserPrompt', () => {
  it('injects the bound TinyMCE HTML for the model to edit', () => {
    const prompt = buildHtmlUserPrompt('Make the heading larger', {
      userId: '42',
      bind: { wcmsContentId: 15, pageIndex: 0, lang: 'en' },
      html: '<h1>Hi</h1>',
      titleEn: 'Welcome',
    });
    expect(prompt).toContain('WCMS content id 15');
    expect(prompt).toContain('Welcome');
    expect(prompt).toContain('<h1>Hi</h1>');
    expect(prompt).toContain('Make the heading larger');
    expect(prompt).toContain('<html-document>');
    expect(prompt).not.toContain('```');
  });

  it('does not paste a truncated document', () => {
    const html = `<p>${'a'.repeat(80_000)}</p>`;
    const prompt = buildHtmlUserPrompt('Tighten the heading', {
      userId: '42',
      bind: { wcmsContentId: 15, pageIndex: 0, lang: 'en' },
      html,
    });
    expect(prompt).toContain('html_get');
    expect(prompt).toContain('Tighten the heading');
    expect(prompt).not.toContain('a'.repeat(200));
    expect(prompt).not.toContain('<p>');
  });
});
