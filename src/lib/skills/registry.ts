import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

export type AgentSkill = {
  name: string;
  description: string;
  content: string;
};

export const SKILLS_ROOT = join(process.cwd(), 'skills');

const SKILL_NAME_RE = /^[a-z0-9][a-z0-9-]{0,63}$/i;

export function isSafeSkillName(name: string): boolean {
  return SKILL_NAME_RE.test(name);
}

function parseFrontmatter(raw: string): { name: string; description: string; content: string } | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const fm = match[1];
  const content = match[2].trim();
  const name = fm.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = fm.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!name || !description || !isSafeSkillName(name)) return null;
  return { name, description, content };
}

function skillFileAbs(name: string): string | null {
  if (!isSafeSkillName(name)) return null;
  const abs = resolve(SKILLS_ROOT, name, 'SKILL.md');
  const root = resolve(SKILLS_ROOT) + sep;
  if (!abs.startsWith(root)) return null;
  return abs;
}

export function readAgentSkill(name: string): AgentSkill | null {
  const abs = skillFileAbs(name);
  if (!abs || !existsSync(abs)) return null;
  let raw: string;
  try {
    raw = readFileSync(abs, 'utf8').replace(/^\uFEFF/, '');
  } catch {
    return null;
  }
  const parsed = parseFrontmatter(raw);
  if (!parsed || parsed.name !== name) return null;
  return parsed;
}

export function listAgentSkills(): AgentSkill[] {
  if (!existsSync(SKILLS_ROOT)) return [];
  let entries: string[];
  try {
    entries = readdirSync(SKILLS_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
  const skills: AgentSkill[] = [];
  for (const name of entries.sort()) {
    const skill = readAgentSkill(name);
    if (skill) skills.push(skill);
  }
  return skills;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatSkillsCatalog(): string {
  const skills = listAgentSkills();
  if (skills.length === 0) return '';
  const lines = [
    'The following skills provide specialized instructions for specific tasks.',
    'When a skill matches, call read_skill with its name, then follow that file.',
    'Answer in normal chat text unless the user clearly asked for a visual explainer page.',
    '',
    '<available_skills>',
  ];
  for (const skill of skills) {
    lines.push('  <skill>');
    lines.push(`    <name>${escapeXml(skill.name)}</name>`);
    lines.push(`    <description>${escapeXml(skill.description)}</description>`);
    lines.push('  </skill>');
  }
  lines.push('</available_skills>');
  return lines.join('\n');
}

export function formatLoadedSkill(skill: AgentSkill): string {
  return `<skill name="${escapeXml(skill.name)}">\n${skill.content}\n</skill>`;
}

export function withSkillsCatalog(systemPrompt: string): string {
  const catalog = formatSkillsCatalog();
  if (!catalog || systemPrompt.includes('<available_skills>')) return systemPrompt;
  const base = systemPrompt.trimEnd();
  return base ? `${base}\n\n${catalog}` : catalog;
}
