import '../../shared/load-env';

import { Agent, AgentPool, defineTool } from '@shareai-lab/kode-sdk';
import { createRuntime } from '../../shared/runtime';
import { MetaSearchAgentType } from './metaSearchAgent';
import { BaseMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import eventEmitter from 'events';
import configManager from '../config';

interface ChunkResult {
  content: string;
}

interface EsBm25Args {
  query: string;
  top_k?: number;
}

interface EsBm25ToolResult {
  total: number;
  chunks: ChunkResult[];
  no_result: boolean;
  search_query: string;
  year_filter: string[];
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

async function queryRAGFlow(
  keyword: string,
  signal?: AbortSignal,
): Promise<any> {
  try {
    // Get RAGFlow configuration from config.json (mocked for standalone)
    const ragflowConfig: any = {};
    const apiUrl =
      configManager.getConfig('ragflow.apiUrl') ||
      'http://192.168.56.1:8001/api/v1/retrieval';
    const apiKey =
      configManager.getConfig('ragflow.apiKey') ||
      'ragflow-g4OTUwYjU2NDFiYjExZjBhYmY5MDI0Mm';
    const datasetIds = configManager.getConfig('ragflow.datasetIds') || [
      '387232b21eaa11f1b4a62e82040d3310',
    ];
    const documentIds = configManager.getConfig('ragflow.documentIds') || [
      '658f16801eae11f1b4a62e82040d3310',
    ];

    const similarityThreshold =
      configManager.getConfig('ragflow.similarityThreshold') ?? 0.3;
    const vectorSimilarityWeight =
      configManager.getConfig('ragflow.vectorSimilarityWeight') ?? 0.3;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal,
      body: JSON.stringify({
        question: keyword,
        // rerank_id: 'BAAI/bge-reranker-v2-m3',
        rerank_id: '',
        dataset_ids: datasetIds,
        document_ids: documentIds,
        similarity_threshold: similarityThreshold,
        vector_similarity_weight: vectorSimilarityWeight,
        page: 1,
        page_size: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `RAGFlow API request failed with status ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      `RAGFlow API error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const RAG_SYSTEM_PROMPT = `
      # RAG Assistant Instruction

      You are a RAG assistant. When you receive a user request, follow these rules and steps exactly.

      ## Core Priority Rules

      1. User instructions have the highest priority over all other rules.
      2. If the user explicitly provides, specifies, or designates the search keywords, you **MUST** use those exact keywords directly as the final search query.
      3. When the user explicitly provides keywords, you **MUST NOT** add, remove, translate, rewrite, normalize, reorder, summarize, infer, expand, or substitute any part of them.
      4. If the user explicitly requires specific words, phrases, spellings, scripts, symbols, years, or formatting, you **MUST** preserve them exactly as written.
      5. Only when the user does not explicitly provide search keywords may you extract keywords yourself.
      6. In any conflict between rules, the higher-priority rule overrides the lower-priority rule.

      ## Step 0 — Intent Check

      First, determine whether the user's request requires knowledge retrieval.

      If the request is a simple conversational message, a greeting, a self-identification question, a capability question, or another trivial request that does not require external knowledge retrieval, respond directly and naturally **without** calling any search tools.

      Examples include:
      - \`Hello\`
      - \`Hi\`
      - \`Who are you?\`
      - \`What can you do?\`

      Only proceed to the steps below if the request requires factual or document-based retrieval.

      ## Step 1 — Keyword Extraction

      Determine whether the user explicitly specified the search keywords.

      ### If the user explicitly provides or designates the search keywords

      - Use those exact keywords directly as the final search query.
      - Do not add, remove, translate, rewrite, normalize, reorder, summarize, infer, expand, or substitute any part of them.
      - Preserve the original language and script exactly as written.
      - Do not convert Traditional Chinese to Simplified Chinese.
      - Do not romanize or transliterate.
      - If the user explicitly includes years, stop words, symbols, or formatting, keep them exactly as written.

      ### If the user does not explicitly provide search keywords

      - Extract the core keywords from the user's request to form the search query.
      - If the user's request already contains suitable keywords, keep them unchanged.
      - Preserve the original language and script exactly as written.
      - Do not convert Traditional Chinese to Simplified Chinese.
      - Do not add translations, synonyms, related concepts, or inferred terms unless the user explicitly asks for them.
      - Remove year-related terms, unimportant words, and stop words, unless the user explicitly asks to keep them.

      ## Step 2 — Search

      Call \`es_bm25_search\` using the final search query determined in Step 1.

      ## Step 3 — Response Generation

      - If the tool result has \`total=0\` or \`no_result=true\`, retry with similar keywords up to 3 times.
      - The retry rule applies only when the search keywords were extracted by the assistant, not when the user explicitly specified the search keywords.
      - If the user explicitly specified the search keywords, do not alter them for retry unless the user explicitly allows modification.
      - If there is still no result after 3 retries, reply exactly with: \`No related source found.\`
      - If the tool returns data, answer the user using the retrieved chunks.

      ## Output Behavior

      - For requests that do not require retrieval, respond directly without using any search tool.
      - For requests that require retrieval, use the retrieval results to answer.
      - If no source is found after the allowed retries, reply exactly with: \`No related source found.\`
`.trim();

function createEsBm25SearchTool() {
  return defineTool({
    name: 'es_bm25_search',
    description: 'Search chunks in Elasticsearch using BM25.',
    params: {
      query: { type: 'string', description: 'Natural language query text' },
      top_k: {
        type: 'number',
        description: 'Maximum number of returned chunks',
        required: false,
        default: 8,
      },
    },
    attributes: { readonly: true, noEffect: true },
    async exec(args: EsBm25Args): Promise<EsBm25ToolResult> {
      const rawResult = await queryRAGFlow(args.query, undefined);

      // Keep only `content` in each chunk for downstream output.
      const rawChunks = (rawResult?.data?.chunks ?? rawResult?.chunks ?? []) as
        | Array<{ content?: unknown }>
        | unknown[];
      const chunks: ChunkResult[] = rawChunks.map((chunk) => ({
        content:
          typeof (chunk as { content?: unknown })?.content === 'string'
            ? (chunk as { content: string }).content ?? ''
            : '',
      }));
      const total = rawResult?.data?.total ?? chunks.length;

      return {
        total,
        chunks,
        no_result: total === 0,
        search_query: args.query,
        year_filter: [],
      };
    },
  });
}

const modelId = configManager.getConfig('base.modelId', '') || 'gpt-3.5-turbo';
const apiKey = configManager.getConfig('base.apiKey', '') || '';
const baseUrl =
  configManager.getConfig('base.baseURL', '') || 'http://192.168.1.51:8000';

const esBm25SearchTool = createEsBm25SearchTool();
const runtimeDeps = createRuntime(
  ({ templates, tools }: any) => {
    tools.register(esBm25SearchTool.name, () => esBm25SearchTool);
    templates.register({
      id: 'rag-elasticsearch-bm25',
      systemPrompt: RAG_SYSTEM_PROMPT,
      tools: [esBm25SearchTool.name],
      model: modelId,
      runtime: {},
    });
  },
  {
    modelDefaults: {
      apiKey,
      baseUrl,
    },
  },
);
const DEFAULT_MAX_ACTIVE_AGENTS = 50;
const configuredMaxActiveAgents = Number(
  configManager.getConfig('ragflow.maxActiveAgents') ??
    DEFAULT_MAX_ACTIVE_AGENTS,
);
const maxActiveAgents = Number.isFinite(configuredMaxActiveAgents)
  ? Math.max(1, Math.floor(configuredMaxActiveAgents))
  : DEFAULT_MAX_ACTIVE_AGENTS;
const agentPool = new AgentPool({
  dependencies: runtimeDeps,
  maxAgents: maxActiveAgents,
});
const agentMonitored = new WeakSet<Agent>();
const progressBookmarkByAgent = new WeakMap<Agent, string>();

const AGENT_ID_PREFIX = 'sfc-chat-agent';
const agentCache = new Map<string, Promise<Agent>>();
const agentLastUsedAt = new Map<string, number>();
const busyAgentIds = new Set<string>();

type AgentPoolInternals = {
  agents?: Map<string, Agent>;
};

function normalizeAgentId(agentId?: string): string {
  const trimmed = (agentId ?? '').trim();
  return trimmed.length > 0 ? trimmed : `${AGENT_ID_PREFIX}-default`;
}

function isPoolFullError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Pool is full');
}

function touchAgent(agentId: string): void {
  agentLastUsedAt.set(agentId, Date.now());
}

function pickEvictionCandidate(excludeAgentId?: string): string | undefined {
  const ids = agentPool.list();
  const candidates = ids.filter(
    (id) => id !== excludeAgentId && !busyAgentIds.has(id),
  );
  if (candidates.length === 0) return undefined;

  candidates.sort((a, b) => {
    const aTs = agentLastUsedAt.get(a) ?? 0;
    const bTs = agentLastUsedAt.get(b) ?? 0;
    return aTs - bTs;
  });

  return candidates[0];
}

function unloadAgentFromMemory(agentId: string): boolean {
  const poolInternals = agentPool as unknown as AgentPoolInternals;
  if (!(poolInternals.agents instanceof Map)) return false;

  const agent = poolInternals.agents.get(agentId);
  if (!agent) return false;

  // Memory-only unload: keep state in store, free pool slot and local caches.
  poolInternals.agents.delete(agentId);
  agentCache.delete(agentId);
  agentLastUsedAt.delete(agentId);
  busyAgentIds.delete(agentId);
  progressBookmarkByAgent.delete(agent);
  agentMonitored.delete(agent);
  return true;
}

function ensurePoolCapacity(excludeAgentId?: string): boolean {
  let evicted = false;
  while (agentPool.size() >= maxActiveAgents) {
    const candidate = pickEvictionCandidate(excludeAgentId);
    if (!candidate) break;
    if (!unloadAgentFromMemory(candidate)) break;
    evicted = true;
  }
  return evicted;
}

async function getOrCreateHarnessAgent(agentId?: string): Promise<Agent> {
  const stableAgentId = normalizeAgentId(agentId);
  if (!agentCache.has(stableAgentId)) {
    const creationPromise = (async () => {
      const existing = agentPool.get(stableAgentId);
      if (existing) {
        touchAgent(stableAgentId);
        return existing;
      }

      const config = {
        templateId: 'rag-elasticsearch-bm25',
        sandbox: {
          kind: 'local' as const,
          workDir: './workspace',
          enforceBoundary: true,
        },
      };

      const existsInStore = await runtimeDeps.store.exists(stableAgentId);
      ensurePoolCapacity(stableAgentId);

      const loadAgent = async () =>
        existsInStore
          ? await agentPool.resume(stableAgentId, config)
          : await agentPool.create(stableAgentId, config);

      let agent: Agent;
      try {
        agent = await loadAgent();
      } catch (error) {
        if (!isPoolFullError(error)) throw error;

        const evicted = ensurePoolCapacity(stableAgentId);
        if (!evicted) {
          throw new Error(
            `Agent pool is full (${maxActiveAgents}) and all active agents are busy`,
          );
        }
        agent = await loadAgent();
      }

      if (!agentMonitored.has(agent)) {
        agentMonitored.add(agent);
        agent.on('error', (event: any) => {
          console.error('\n[monitor:error]');
          console.error(safeJson(event));
        });
      }

      touchAgent(stableAgentId);
      return agent;
    })();

    agentCache.set(stableAgentId, creationPromise);
    creationPromise.catch(() => {
      agentCache.delete(stableAgentId);
    });
  }
  return await agentCache.get(stableAgentId)!;
}

async function streamHarnessToEmitter(
  agent: any,
  emitter: eventEmitter,
  signal?: AbortSignal,
): Promise<void> {
  let lastBookmark = progressBookmarkByAgent.get(agent as Agent);

  for await (const envelope of agent.subscribe(['progress'], {
    since: lastBookmark,
  }) as AsyncIterable<any>) {
    if (signal?.aborted) break;
    if (!envelope?.event) continue;
    lastBookmark = envelope.bookmark ?? lastBookmark;

    const event = envelope.event;

    switch (event.type) {
      case 'text_chunk':
        emitter.emit(
          'data',
          JSON.stringify({ type: 'response', data: event.delta }),
        );
        break;
      case 'tool:start':
        console.log('\n[progress:tool:start]');
        console.log(
          safeJson({
            id: event.call.id,
            name: event.call.name,
            inputPreview: event.call.inputPreview || event.call.args,
          }),
        );
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'tool_execution',
            data: {
              id: event.call.id,
              name: event.call.name,
              state: 'RUNNING',
              inputPreview: event.call.inputPreview || event.call.args,
            },
          }),
        );
        break;
      case 'tool:end':
        // Wait for the native agent tool execution event or trigger it manually here if needed.
        // We're mostly letting the `agent.on('tool_executed')` handle the COMPLETED state with `resultPreview`.
        break;
      case 'tool:error':
        console.error('\n[progress:tool:error]');
        console.error(
          safeJson({
            id: event.call.id,
            name: event.call.name,
            state: event.call.state,
            error: event.error,
          }),
        );
        break;
      case 'done':
        if (lastBookmark) {
          progressBookmarkByAgent.set(agent as Agent, lastBookmark);
        }
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'progress',
            data: {
              status: 'finished',
              total: 2,
              current: 2,
              message: 'SFC Kode Agent execution finished',
            },
          }),
        );
        return; // Exit the loop
    }
  }

  if (lastBookmark) {
    progressBookmarkByAgent.set(agent as Agent, lastBookmark);
  }
}

export default class NewSfcAgent implements MetaSearchAgentType {
  async searchAndAnswer(
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[],
    systemInstructions: string,
    signal?: AbortSignal,
    sfcExactMatch?: boolean,
    sfcTrainingRelated?: boolean,
    req?: Request,
  ): Promise<eventEmitter> {
    const emitter = new eventEmitter();
    let hasEnded = false;
    const emitEndOnce = () => {
      if (hasEnded) return;
      hasEnded = true;
      emitter.emit('end');
    };

    if (signal) {
      signal.addEventListener('abort', () => {
        emitEndOnce();
      });
    }

    (async () => {
      try {
        if (signal?.aborted) return;

        emitter.emit(
          'data',
          JSON.stringify({
            type: 'progress',
            data: {
              status: 'processing',
              total: 2,
              current: 1,
              question: 'Initializing SFC Agent',
              message: 'Initializing SFC Kode Agent...',
            },
          }),
        );

        const requestAgentId =
          req?.headers.get('x-agent-id') ??
          req?.headers.get('x-chat-id') ??
          undefined;
        console.log('Request for SFC Agent with ID:', requestAgentId);
        const stableAgentId = normalizeAgentId(requestAgentId);
        const agent = await getOrCreateHarnessAgent(stableAgentId);
        busyAgentIds.add(stableAgentId);
        touchAgent(stableAgentId);
        const onToolExecuted = (event: any) => {
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'tool_execution',
              data: {
                id: event.call.id,
                name: event.call.name,
                state: event.call.state,
                durationMs: event.call.durationMs,
                inputPreview: event.call.inputPreview,
                resultPreview: event.call.result,
              },
            }),
          );
        };
        const disposeToolExecuted = agent.on('tool_executed', onToolExecuted);
        try {
          const subscriptionPromise = streamHarnessToEmitter(
            agent,
            emitter,
            signal,
          );

          await agent.send(message);
          await subscriptionPromise;
        } finally {
          busyAgentIds.delete(stableAgentId);
          touchAgent(stableAgentId);
          disposeToolExecuted();
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'response',
            data: `\n\nError: ${error instanceof Error ? error.message : String(error)}`,
          }),
        );
      } finally {
        emitEndOnce();
      }
    })();

    return emitter;
  }
}
