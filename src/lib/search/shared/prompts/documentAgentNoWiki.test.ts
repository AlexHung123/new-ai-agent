import { describe, expect, it } from 'vitest';
import { DOCUMENT_AGENT_SYSTEM_PROMPT } from './documentAgentSystemPrompt';
import { buildDocumentTurnPrefix } from './documentTurnPrefix';

/** User-facing Document Agent replies must not say "wiki". */
const FORBIDS_WIKI_IN_ANSWERS =
  /never use the word ["']wiki["']/i;

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

describe('document agent: query navigation', () => {
  it('tells the model to read the index then concept/year pages before chunks', () => {
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(/index\.md/i);
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(/concept/i);
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).toMatch(/filesOnly/i);
    expect(DOCUMENT_AGENT_SYSTEM_PROMPT).not.toMatch(
      /index plus 1–3 fs_grep calls is enough/i,
    );
  });

  it('turn prefix asks for index → concept/catalog → chunks', () => {
    const prefix = buildDocumentTurnPrefix({
      title: 'SFC',
      agentsMd: 'Orient every session: read SCHEMA.md\n',
    });
    expect(prefix).toMatch(/index\.md/i);
    expect(prefix).toMatch(/concept/i);
    expect(prefix).toMatch(/filesOnly/i);
  });
});
