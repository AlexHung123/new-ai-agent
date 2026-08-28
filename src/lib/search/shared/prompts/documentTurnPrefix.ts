/**
 * Document Agent 每轮用户消息前缀：文档标题 + 已注入的 AGENTS.md。
 * 与 pi-rag Domain Wiki 的 buildProjectWorkspacePromptPrefix 对齐。
 */

import {
  getDocumentTurnContext,
  type DocumentTurnContext,
} from '../runtime/documentTurnContext';
import { loadDocumentAgentsMd } from '../tools/fs/loadDocumentAgentsMd';

const AGENTS_WRAP = `Follow language, citation, and do-not-invent rules only.
You are ask-only Q&A, not a document maintainer. Ignore create/edit/write workflows
and "orient before any write" checklists (SCHEMA.md, log.md).
Do not fs_read AGENTS.md just to reload it — it is already below.
AGENTS.md is schema, not the policy text. Do not answer from it.
Call fs_grep and/or fs_read wiki/index.md before answering any question.
After a few searches, always write a user-visible answer. Do not keep grepping
formatting variants. Zero matches means 「Based on the provided document, I could not find any information regarding your question.」.
Never use the word "wiki" (any capitalization) or 「維基」 in user-visible answers,
even if AGENTS.md or page text uses those words. Call this the bound document.`;

export function buildDocumentTurnPrefix(opts?: {
  title?: string;
  agentsMd?: string;
  agentsMdTruncated?: boolean;
}): string {
  const name = opts?.title?.trim();
  const agents = (opts?.agentsMd || '').trim();
  let agentsBlock = '';
  if (agents) {
    agentsBlock =
      `[AGENTS.md]\n` +
      AGENTS_WRAP +
      `\n\n` +
      agents +
      (opts?.agentsMdTruncated ? '\n…(truncated)\n' : '\n');
  }
  return `[Document]\n` + (name ? `Title: ${name}\n` : '') + agentsBlock + `\n`;
}

/** 绑定文档时注入 AGENTS.md；未绑定则给出明确标记。 */
export function buildDocumentUserPrompt(
  userMessage: string,
  ctx: DocumentTurnContext | undefined = getDocumentTurnContext(),
): string {
  const question = `[User question]\n${userMessage}`;
  if (!ctx) {
    return `[No document bound]\n\n${question}`;
  }
  const agents = loadDocumentAgentsMd(ctx.rootAbs);
  return `${buildDocumentTurnPrefix({
    title: ctx.title,
    agentsMd: agents?.content,
    agentsMdTruncated: agents?.truncated,
  })}${question}`;
}
