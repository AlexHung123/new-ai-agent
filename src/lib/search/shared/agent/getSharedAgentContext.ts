import {
  getMaxActiveAgents,
  getPiSessionConnectionString,
} from '../config/ragflowConfig';
import { RAG_BM25_SYSTEM_PROMPT } from '../prompts/ragBm25SystemPrompt';
import { RAG_BM25_SYSTEM_PROMPT_TRAINING_GUIDE } from '../prompts/ragBm25SystemPromptTrainingGuide';
import { RAG_SURVEY_SYSTEM_PROMPT } from '../prompts/ragSurveySystemPrompt';
import { RAG_SURVEY_CHAT_SYSTEM_PROMPT } from '../prompts/ragSurveyChatSystemPrompt';
import { WRITING_AGENT_SYSTEM_PROMPT } from '../prompts/writingAgentSystemPrompt';
import { PPT_AGENT_SYSTEM_PROMPT } from '../prompts/pptAgentSystemPrompt';
import { DOCUMENT_AGENT_SYSTEM_PROMPT } from '../prompts/documentAgentSystemPrompt';
import { createPptTools } from '@/lib/ppt/tools';
import { getDocumentTurnContext } from '../runtime/documentTurnContext';
import { getWritingTurnContext } from '../runtime/writingTurnContext';
import { createAgentFsTools } from '../tools/fs/fsTools';
import { createPiRuntime } from '../runtime/createPiRuntime';
import { createPgAgentTranscriptStoreFromUrl } from '../runtime/agentTranscriptStore';
import { createPgPiSessionStoreFromUrl } from '../runtime/piSessionStore';
import { createEsBm25SearchTool } from '../tools/esBm25Tool';
import { createGuideSearchTool } from '../tools/guideSearchTool';
import { createSurveySearchTools } from '../tools/surveySearchTool';
import {
  createPiAgentSessionManager,
  type NamedTool,
  type PiAgentSessionManager,
  type PiTemplate,
} from './piAgentSessionManager';

const DEFAULT_TEMPLATE_ID = 'rag-base-template';
const AGENT_ID_PREFIX = 'rag-chat-agent';

function initSharedAgentDependencies() {
  const esBm25SearchTool = createEsBm25SearchTool();
  const guideSearchTool = createGuideSearchTool();
  const surveySearchTools = createSurveySearchTools();
  const fsTools = createAgentFsTools({
    isAdmin: true,
    getProjectRootAbs: () =>
      getWritingTurnContext()?.rootAbs ?? getDocumentTurnContext()?.rootAbs,
  });
  const pptTools = createPptTools();

  const tools: Record<string, NamedTool> = {
    [esBm25SearchTool.name]: esBm25SearchTool,
    [guideSearchTool.name]: guideSearchTool,
  };
  for (const tool of surveySearchTools) {
    tools[tool.name] = tool;
  }
  for (const tool of fsTools) {
    tools[tool.name] = tool;
  }
  for (const tool of pptTools) {
    tools[tool.name] = tool;
  }

  const templates: Record<string, PiTemplate> = {
    [DEFAULT_TEMPLATE_ID]: {
      id: DEFAULT_TEMPLATE_ID,
      systemPrompt: RAG_BM25_SYSTEM_PROMPT,
      tools: [],
    },
    'rag-training-guide-template': {
      id: 'rag-training-guide-template',
      systemPrompt: RAG_BM25_SYSTEM_PROMPT_TRAINING_GUIDE,
      tools: [],
    },
    'rag-survey-template': {
      id: 'rag-survey-template',
      systemPrompt: RAG_SURVEY_SYSTEM_PROMPT,
      tools: surveySearchTools.map((t) => t.name),
    },
    'rag-survey-chat-template': {
      id: 'rag-survey-chat-template',
      systemPrompt: RAG_SURVEY_CHAT_SYSTEM_PROMPT,
      tools: [],
    },
    'writing-agent-template': {
      id: 'writing-agent-template',
      systemPrompt: WRITING_AGENT_SYSTEM_PROMPT,
      tools: ['fs_ls', 'fs_read', 'fs_grep', 'fs_find'],
    },
    'ppt-agent-template': {
      id: 'ppt-agent-template',
      systemPrompt: PPT_AGENT_SYSTEM_PROMPT,
      tools: [
        'fs_ls',
        'fs_read',
        'fs_grep',
        'fs_find',
        ...pptTools.map((tool) => tool.name),
      ],
    },
    'document-agent-template': {
      id: 'document-agent-template',
      systemPrompt: DOCUMENT_AGENT_SYSTEM_PROMPT,
      tools: ['fs_ls', 'fs_read', 'fs_grep', 'fs_find'],
    },
  };

  const runtime = createPiRuntime({ templates, tools });
  const connectionString = getPiSessionConnectionString();
  const store = createPgPiSessionStoreFromUrl(connectionString);
  const transcript = createPgAgentTranscriptStoreFromUrl(connectionString);

  const manager = createPiAgentSessionManager({
    defaultAgentId: `${AGENT_ID_PREFIX}-default`,
    maxActiveAgents: getMaxActiveAgents(),
    store,
    transcript,
    templates,
    tools,
    defaultTemplateId: DEFAULT_TEMPLATE_ID,
    createAgent: runtime.createAgent,
  });

  return { manager };
}

export type SharedAgentContext = {
  manager: PiAgentSessionManager;
};

declare global {
  // eslint-disable-next-line no-var
  var __sharedAgentContext: SharedAgentContext | undefined;
}

export function getSharedAgentContext(): SharedAgentContext {
  if (!globalThis.__sharedAgentContext) {
    globalThis.__sharedAgentContext = initSharedAgentDependencies();
  }
  return globalThis.__sharedAgentContext;
}
