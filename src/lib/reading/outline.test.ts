import { describe, expect, it } from 'vitest';
import { formatOutlineMarkdown } from './outline';

describe('formatOutlineMarkdown', () => {
  it('renders nested titles with page citations', () => {
    const md = formatOutlineMarkdown([
      {
        title: 'Introduction',
        page: 1,
        items: [{ title: 'Background', page: 3, items: [] }],
      },
      { title: 'Appendix', page: null, items: [] },
    ]);
    expect(md).toContain('# Outline');
    expect(md).toContain('- Introduction — p. 1');
    expect(md).toContain('  - Background — p. 3');
    expect(md).toContain('- Appendix');
    expect(md).not.toContain('Appendix —');
  });
});
