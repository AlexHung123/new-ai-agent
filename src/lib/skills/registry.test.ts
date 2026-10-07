import { describe, expect, it } from 'vitest';
import {
  formatLoadedSkill,
  formatSkillsCatalog,
  listAgentSkills,
  readAgentSkill,
  withSkillsCatalog,
} from './registry';

describe('skill registry', () => {
  it('lists html-explainer from SKILL.md with a trigger-only description', () => {
    const skills = listAgentSkills();
    const html = skills.find((s) => s.name === 'html-explainer');
    expect(html).toBeDefined();
    expect(html!.description).toMatch(/^Use when/i);
    expect(html!.description).toMatch(/HTML explainer/i);
    expect(html!.description).not.toMatch(/Markdown draft/i);
    expect(html!.description).not.toMatch(/am_render/);
    expect(html!.description).not.toMatch(/composer HTML tag/i);
    expect(html!.content).toMatch(/```flow TB/);
    expect(html!.content).toMatch(/mermaid/i);
    expect(html!.content).toMatch(/\(Start\) -> \{/);
    expect(html!.content).toMatch(/am_render/);
  });

  it('rejects unknown names and path traversal', () => {
    expect(readAgentSkill('nope')).toBeNull();
    expect(readAgentSkill('../etc/passwd')).toBeNull();
    expect(readAgentSkill('html-explainer/../html-explainer')).toBeNull();
    expect(readAgentSkill('')).toBeNull();
  });

  it('formats a catalog without filesystem paths', () => {
    const catalog = formatSkillsCatalog();
    expect(catalog).toContain('<available_skills>');
    expect(catalog).toContain('<name>html-explainer</name>');
    expect(catalog).toMatch(/call read_skill/i);
    expect(catalog).not.toMatch(/composer HTML tag/i);
    expect(catalog).not.toMatch(/skills[/\\]html-explainer/);
    expect(catalog).not.toMatch(/SKILL\.md/);
    expect(catalog).not.toMatch(/<location>/);
  });

  it('wraps loaded skill content without a filesystem location', () => {
    const skill = readAgentSkill('html-explainer');
    expect(skill).not.toBeNull();
    const wrapped = formatLoadedSkill(skill!);
    expect(wrapped).toContain('<skill name="html-explainer">');
    expect(wrapped).toContain(skill!.content);
    expect(wrapped).not.toMatch(/location=/);
  });

  it('appends the catalog to a system prompt once', () => {
    const out = withSkillsCatalog('You are a writing assistant.');
    expect(out.startsWith('You are a writing assistant.')).toBe(true);
    expect(out).toContain('<available_skills>');
    expect(out).toContain('html-explainer');
    expect(out).not.toMatch(/This turn must produce/);
    expect(out).not.toMatch(/```flow/);
    expect(withSkillsCatalog(out)).toBe(out);
  });
});
