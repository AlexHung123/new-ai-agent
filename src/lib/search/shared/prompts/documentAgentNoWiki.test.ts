import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DOCUMENT_AGENT_EMPTY_REPLY,
  DOCUMENT_AGENT_SYSTEM_PROMPT,
} from './documentAgentSystemPrompt';
import { buildDocumentTurnPrefix } from './documentTurnPrefix';

/** User-facing Document Agent replies must not say "wiki". */
const FORBIDS_WIKI_IN_ANSWERS = /never use the word ["']wiki["']/i;

describe('document agent: no wiki in answers', () => {
  it('system prompt forbids wiki in user-visible answers', () => {
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(FORBIDS_WIKI_IN_ANSWERS);
  });

  it('turn prefix forbids wiki in user-visible answers even when AGENTS.md uses the word', () => {
    const prefix = buildDocumentTurnPrefix({
      title: 'SPR',
      agentsMd: '# SPR LLM Wiki — Agent Schema\nYou are the wiki maintainer.\n',
    });
    expect(prefix).toMatch(FORBIDS_WIKI_IN_ANSWERS);
  });
});

describe('document agent: search before answering', () => {
  it('system prompt requires fs_grep or wiki/index.md before answering', () => {
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(/fs_grep/i);
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(/wiki\/index\.md/);
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(
      /MUST call fs_grep and\/or fs_read wiki\/index\.md/i,
    );
  });

  it('system prompt forbids answering from AGENTS.md or the title alone', () => {
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(
      /Never answer from AGENTS\.md or the title alone/i,
    );
  });

  it('system prompt uses 本文件沒有 when files do not cover the claim', () => {
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toContain('本文件沒有');
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(
      /Do not say the directory is empty/i,
    );
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(
      /Do not fill gaps with general knowledge/i,
    );
  });

  it('turn prefix says AGENTS.md is not enough to answer', () => {
    const prefix = buildDocumentTurnPrefix({
      title: 'GITP',
      agentsMd: '# schema only\n',
    });
    expect(prefix).toMatch(/not the policy text/i);
    expect(prefix).toMatch(/Do not answer from it/i);
  });
});

describe('document agent: always answer after search', () => {
  it('system prompt forbids ending the run with only tool calls', () => {
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(
      /Always write a user-visible answer/i,
    );
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(
      /Do not end the run with only tool calls/i,
    );
  });

  it('system prompt treats zero matches as a complete finding and bans format-variant greps', () => {
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(
      /0 matches is a complete finding/i,
    );
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(/formatting variants/i);
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(/1–3 fs_grep|1-3 fs_grep/i);
  });

  it('turn prefix requires a user-visible answer after a few searches', () => {
    const prefix = buildDocumentTurnPrefix({
      title: 'Training Guide',
      agentsMd: '# schema only\n',
    });
    expect(prefix).toMatch(/user-visible answer/i);
    expect(prefix).toMatch(/formatting variants/i);
  });

  it('document agent stream uses an LLM provider error when the model emits no text', () => {
    expect(DOCUMENT_AGENT_EMPTY_REPLY).toMatch(/LLM provider/i);
    expect(DOCUMENT_AGENT_EMPTY_REPLY).not.toMatch(
      /could not find any information/i,
    );
    const src = readFileSync(join(__dirname, '../../documentAgent.ts'), 'utf8');
    expect(src).toMatch(/emptyResponseFallback:\s*DOCUMENT_AGENT_EMPTY_REPLY/);
  });
});
