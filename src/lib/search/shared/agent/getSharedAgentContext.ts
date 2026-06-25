import { createManagedAgentContext } from './createManagedAgentContext';
import { getMaxActiveAgents } from '../config/ragflowConfig';
import { RAG_BM25_SYSTEM_PROMPT } from '../prompts/ragBm25SystemPrompt';
import { RAG_BM25_SYSTEM_PROMPT_TRAINING_GUIDE } from '../prompts/ragBm25SystemPromptTrainingGuide';
import { RAG_SURVEY_SYSTEM_PROMPT } from '../prompts/ragSurveySystemPrompt';
import { createSqliteAgentRuntime } from '../runtime/createAgentRuntime';
import { createEsBm25SearchTool } from '../tools/esBm25Tool';
import { createGuideSearchTool } from '../tools/guideSearchTool';
import { createSurveySearchTools } from '../tools/surveySearchTool';

const DEFAULT_TEMPLATE_ID = 'rag-base-template';
const AGENT_ID_PREFIX = 'rag-chat-agent';

function initSharedAgentDependencies() {
  const esBm25SearchTool = createEsBm25SearchTool();
  const guideSearchTool = createGuideSearchTool();
  const surveySearchTools = createSurveySearchTools();

  const { runtimeDeps } = createSqliteAgentRuntime({
    registerTools: (tools) => {
      tools.register(esBm25SearchTool.name, () => esBm25SearchTool);
      tools.register(guideSearchTool.name, () => guideSearchTool);
      surveySearchTools.forEach((tool) => tools.register(tool.name, () => tool));
    },
    registerTemplates: (templates, modelId) => {
      templates.register({
        id: DEFAULT_TEMPLATE_ID,
        systemPrompt: RAG_BM25_SYSTEM_PROMPT,
        tools: [],
        model: modelId,
        runtime: {},
      });

      templates.register({
        id: 'rag-training-guide-template',
        systemPrompt: RAG_BM25_SYSTEM_PROMPT_TRAINING_GUIDE,
        tools: [],
        model: modelId,
        runtime: {},
      });

      templates.register({
        id: 'rag-survey-template',
        systemPrompt: RAG_SURVEY_SYSTEM_PROMPT,
        tools: surveySearchTools.map(t => t.name),
        model: modelId,
        runtime: {},
      });
    },
  });

  const maxActiveAgents = getMaxActiveAgents();

  return createManagedAgentContext({
    dependencies: runtimeDeps,
    maxActiveAgents,
    defaultAgentId: `${AGENT_ID_PREFIX}-default`,
    templateId: DEFAULT_TEMPLATE_ID,
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __sharedAgentContext:
    | ReturnType<typeof initSharedAgentDependencies>
    | undefined;
}

export function getSharedAgentContext() {
  if (!globalThis.__sharedAgentContext) {
    globalThis.__sharedAgentContext = initSharedAgentDependencies();
  }
  return globalThis.__sharedAgentContext;
}
