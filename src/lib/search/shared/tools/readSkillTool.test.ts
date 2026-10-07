import { describe, expect, it } from 'vitest';
import { createReadSkillTool } from './readSkillTool';

function textOf(result: { content: Array<{ type?: string; text?: string }> }): string {
  const first = result.content[0];
  return first && 'text' in first ? String(first.text) : '';
}

describe('createReadSkillTool', () => {
  it('returns html-explainer instructions', async () => {
    const tool = createReadSkillTool();
    expect(tool.name).toBe('read_skill');
    const result = await tool.execute('t1', { name: 'html-explainer' });
    expect(result.details).toMatchObject({ ok: true, name: 'html-explainer' });
    const text = textOf(result);
    expect(text).toMatch(/```flow TB/);
    expect(text).toMatch(/am_render/);
  });

  it('errors on unknown names and lists available skills', async () => {
    const tool = createReadSkillTool();
    const result = await tool.execute('t1', { name: 'nope' });
    expect(result.details).toMatchObject({ ok: false });
    const text = textOf(result);
    expect(text).toMatch(/unknown skill/i);
    expect(text).toMatch(/html-explainer/);
  });

  it('rejects path traversal names', async () => {
    const tool = createReadSkillTool();
    const result = await tool.execute('t1', { name: '../etc/passwd' });
    expect(result.details).toMatchObject({ ok: false });
  });
});
