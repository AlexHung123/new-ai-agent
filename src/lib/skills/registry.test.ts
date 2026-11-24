import { describe, expect, it } from 'vitest';
import {
  formatLoadedSkill,
  formatSkillsCatalog,
  listAgentSkills,
  readAgentSkill,
  withSkillsCatalog,
} from './registry';

describe('skill registry', () => {
  it('does not ship an html-explainer skill', () => {
    const skills = listAgentSkills();
    expect(skills.find((s) => s.name === 'html-explainer')).toBeUndefined();
    expect(formatSkillsCatalog()).not.toMatch(/html-explainer/);
    expect(formatSkillsCatalog()).not.toMatch(/visual explainer/i);
  });

  it('rejects unknown names and path traversal', () => {
    expect(readAgentSkill('nope')).toBeNull();
    expect(readAgentSkill('../etc/passwd')).toBeNull();
    expect(readAgentSkill('html-explainer/../html-explainer')).toBeNull();
    expect(readAgentSkill('')).toBeNull();
  });

  it('returns an empty catalog when no skills are installed', () => {
    expect(formatSkillsCatalog()).toBe('');
    expect(withSkillsCatalog('You are a writing assistant.')).toBe(
      'You are a writing assistant.',
    );
  });

  it('wraps loaded skill content without a filesystem location', () => {
    const wrapped = formatLoadedSkill({
      name: 'example',
      description: 'Example skill',
      content: 'Do the task.',
    });
    expect(wrapped).toContain('<skill name="example">');
    expect(wrapped).toContain('Do the task.');
    expect(wrapped).not.toMatch(/location=/);
  });
});
