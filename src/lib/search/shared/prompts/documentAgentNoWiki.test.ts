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
