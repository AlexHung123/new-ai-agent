import { loadPrompt } from '../../../prompts/loader';

export const RAG_BM25_SYSTEM_PROMPT_TRAINING_GUIDE = loadPrompt(
  'agentGuide.md',
  '',
);
