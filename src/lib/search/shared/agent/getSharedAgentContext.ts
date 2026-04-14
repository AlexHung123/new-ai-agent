import { createManagedAgentContext } from './createManagedAgentContext';
import { getMaxActiveAgents } from '../config/ragflowConfig';
import { RAG_BM25_SYSTEM_PROMPT } from '../prompts/ragBm25SystemPrompt';
import { createSqliteAgentRuntime } from '../runtime/createAgentRuntime';
import { createEsBm25SearchTool } from '../tools/esBm25Tool';

const DEFAULT_TEMPLATE_ID = 'rag-elasticsearch-bm25';
const AGENT_ID_PREFIX = 'sfc-chat-agent';

function initSharedAgentDependencies() {
  // 1. 初始化所有共用的 Tools
  const esBm25SearchTool = createEsBm25SearchTool();
  
  // 2. 建立共用的 SQLite Runtime (這裡只會建立一次連線)
  const { runtimeDeps } = createSqliteAgentRuntime({
    templateId: DEFAULT_TEMPLATE_ID,
    systemPrompt: RAG_BM25_SYSTEM_PROMPT,
    toolName: esBm25SearchTool.name,
    registerTool: (tools) => {
      // 如果未來有其他 Tools，統一在這裡註冊
      tools.register(esBm25SearchTool.name, () => esBm25SearchTool);
    },
  });

  const maxActiveAgents = getMaxActiveAgents();
  
  // 3. 建立共用的 Manager Context
  return createManagedAgentContext({
    dependencies: runtimeDeps,
    maxActiveAgents,
    defaultAgentId: `${AGENT_ID_PREFIX}-default`,
    templateId: DEFAULT_TEMPLATE_ID,
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __sharedAgentContext: ReturnType<typeof initSharedAgentDependencies> | undefined;
}

export function getSharedAgentContext() {
  if (!globalThis.__sharedAgentContext) {
    globalThis.__sharedAgentContext = initSharedAgentDependencies();
  }
  return globalThis.__sharedAgentContext;
}
