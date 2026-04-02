import '../../shared/load-env'

import { Agent, defineTool } from '@shareai-lab/kode-sdk'
import { createRuntime } from '../../shared/runtime'
import { MetaSearchAgentType } from './metaSearchAgent'
import { BaseMessage } from '@langchain/core/messages'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { Embeddings } from '@langchain/core/embeddings'
import eventEmitter from 'events'

interface ChunkResult {
  content: string
  doc_id: string
  docnm_kwd: string
  page_num_int: number
  position_int: number
  important_kwd: string[]
  score: number
}

interface EsBm25Args {
  query: string
  top_k?: number
  sfc_training_related?: boolean
}

interface EsBm25ToolResult {
  total: number
  chunks: ChunkResult[]
  no_result: boolean
  search_query: string
  year_filter: string[]
}

interface CachedSearchResult {
  total: number
  chunks: ChunkResult[]
  searchQuery: string
  years: string[]
}

interface ToolErrorCall {
  id: string
  name: string
  state: string
}

interface ToolErrorEvent {
  type: 'tool:error'
  call: ToolErrorCall
  error: unknown
}

interface TextChunkEvent {
  type: 'text_chunk'
  delta: string
}

interface DoneEvent {
  type: 'done'
}

interface KodeProgressEnvelope {
  event?: unknown
}

function isToolErrorEvent(event: unknown): event is ToolErrorEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'type' in event &&
    (event as { type: unknown }).type === 'tool:error' &&
    'call' in event &&
    typeof (event as { call: unknown }).call === 'object' &&
    (event as { call: object }).call !== null &&
    typeof ((event as { call: ToolErrorCall }).call.id) === 'string' &&
    typeof ((event as { call: ToolErrorCall }).call.name) === 'string' &&
    typeof ((event as { call: ToolErrorCall }).call.state) === 'string'
  )
}

function isTextChunkEvent(event: unknown): event is TextChunkEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'type' in event &&
    (event as { type: unknown }).type === 'text_chunk' &&
    'delta' in event &&
    typeof (event as { delta: unknown }).delta === 'string'
  )
}

function isDoneEvent(event: unknown): event is DoneEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'type' in event &&
    (event as { type: unknown }).type === 'done'
  )
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

async function queryRAGFlow(keyword: string, signal?: AbortSignal, sfcTrainingRelated?: boolean): Promise<any> {
  try {
    // Get RAGFlow configuration from config.json (mocked for standalone)
    const ragflowConfig: any = {}
    const apiUrl = ragflowConfig.apiUrl || 'http://192.168.56.1:8001/api/v1/retrieval'
    const apiKey = ragflowConfig.apiKey || 'ragflow-g4OTUwYjU2NDFiYjExZjBhYmY5MDI0Mm'
    const datasetIds = ragflowConfig.datasetIds || ['387232b21eaa11f1b4a62e82040d3310']
    const documentIds = sfcTrainingRelated
      ? ragflowConfig.trainingRelatedDocumentIds || ['658f16801eae11f1b4a62e82040d3310']
      : ragflowConfig.documentIds || ['658f16801eae11f1b4a62e82040d3310']

    const similarityThreshold = ragflowConfig.similarityThreshold ?? 0.3
    const vectorSimilarityWeight = ragflowConfig.vectorSimilarityWeight ?? 0.3

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      signal,
      body: JSON.stringify({
        question: keyword,
        rerank_id: 'BAAI/bge-reranker-v2-m3',
        dataset_ids: datasetIds,
        document_ids: documentIds,
        similarity_threshold: similarityThreshold,
        vector_similarity_weight: vectorSimilarityWeight,
        page: 1,
        page_size: 8
      })
    })

    if (!response.ok) {
      throw new Error(`RAGFlow API request failed with status ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw new Error(`RAGFlow API error: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const cachedSearchResults = new Map<string, CachedSearchResult>()
const RAG_SYSTEM_PROMPT = `You are a RAG assistant. When you receive a user request, follow these steps exactly:

Keyword Extraction: First, extract the core keywords from the user request to form your search query. You MUST remove any year-related terms (e.g., "2023", "2024") and unimportant words/stop words.
Search: Call es_bm25_search using these refined keywords.
Response generation:
If the tool result has total=0 or no_result=true, retry again with similar keywords, up to 3 times. If there is still no result after 3 retries, reply exactly with: No related source found.
If the tool returns data, answer the user using the retrieved chunks.`

function createEsBm25SearchTool(defaultSfcTrainingRelated: boolean) {
  return defineTool({
    name: 'es_bm25_search',
    description: 'Search chunks in Elasticsearch using BM25.',
    params: {
      query: { type: 'string', description: 'Natural language query text' },
      top_k: { type: 'number', description: 'Maximum number of returned chunks', required: false, default: 8 },
      sfc_training_related: {
        type: 'boolean',
        description: 'Use training-related doc_id instead of default doc_id',
        required: false,
        default: defaultSfcTrainingRelated
      }
    },
    attributes: { readonly: true, noEffect: true },
    async exec(args: EsBm25Args): Promise<EsBm25ToolResult> {
      const isTrainingRelated = args.sfc_training_related ?? defaultSfcTrainingRelated
      const cacheKey = JSON.stringify({
        query: args.query,
        top_k: args.top_k ?? 8,
        sfc_training_related: isTrainingRelated
      })

      const cachedSearchResult = cachedSearchResults.get(cacheKey)
      if (cachedSearchResult) {
        console.log('\n[tool:es_bm25_search][cached_output]')
        console.log(
          safeJson({
            total: cachedSearchResult.total,
            returned: cachedSearchResult.chunks.length,
            search_query: cachedSearchResult.searchQuery,
            year_filter: cachedSearchResult.years
          })
        )
        return {
          total: cachedSearchResult.total,
          chunks: cachedSearchResult.chunks,
          no_result: cachedSearchResult.total === 0,
          search_query: cachedSearchResult.searchQuery,
          year_filter: cachedSearchResult.years
        }
      }

      const rawResult = await queryRAGFlow(args.query, undefined, isTrainingRelated)

      // Map RAGFlow result back to the format expected by the rest of the app
      const chunks = (rawResult?.data?.chunks ?? rawResult?.chunks ?? []) as ChunkResult[]
      const total = rawResult?.data?.total ?? chunks.length

      const result = {
        total,
        chunks,
        searchQuery: args.query,
        years: []
      }

      cachedSearchResults.set(cacheKey, result)

      return {
        total: result.total,
        chunks: result.chunks,
        no_result: result.total === 0,
        search_query: result.searchQuery,
        year_filter: result.years
      }
    }
  })
}

const modelId = 'Qwen3.5-35B-A3B-8bit'
const apiKey = 'test'
const baseUrl = 'http://192.168.1.12:8000'

async function createHarnessAgent(esBm25SearchTool: ReturnType<typeof createEsBm25SearchTool>) {
  const deps = createRuntime(
    ({ templates, tools }: any) => {
      tools.register(esBm25SearchTool.name, () => esBm25SearchTool)
      templates.register({
        id: 'rag-elasticsearch-bm25',
        systemPrompt: RAG_SYSTEM_PROMPT,
        tools: [esBm25SearchTool.name],
        model: modelId,
        runtime: {}
      })
    },
    {
      modelDefaults: {
        apiKey,
        baseUrl
      }
    }
  )

  const agent = await Agent.create(
    {
      templateId: 'rag-elasticsearch-bm25',
      sandbox: { kind: 'local', workDir: './workspace', enforceBoundary: true }
    },
    deps
  )

  agent.on('tool_executed', (event: any) => {
    console.log('\n[monitor:tool_executed]')
    console.log(
      safeJson({
        id: event.call.id,
        name: event.call.name,
        state: event.call.state,
        durationMs: event.call.durationMs,
        isError: event.call.isError,
        inputPreview: event.call.inputPreview,
        error: event.call.error,
        resultPreview: event.call.result
      })
    )
  })

  agent.on('error', (event: any) => {
    console.error('\n[monitor:error]')
    console.error(safeJson(event))
  })

  return agent
}

async function streamHarnessToEmitter(
  agent: any,
  emitter: eventEmitter,
  signal?: AbortSignal
): Promise<void> {
  for await (const envelope of agent.subscribe(['progress']) as AsyncIterable<KodeProgressEnvelope>) {
    if (signal?.aborted) break
    if (!envelope?.event) continue

    const event = envelope.event

    if (isToolErrorEvent(event)) {
      console.error('\n[progress:tool:error]')
      console.error(
        safeJson({
          id: event.call.id,
          name: event.call.name,
          state: event.call.state,
          error: event.error
        })
      )
    }

    if (isTextChunkEvent(event)) {
      emitter.emit('data', JSON.stringify({ type: 'response', data: event.delta }))
    }

    if (isDoneEvent(event)) {
      emitter.emit(
        'data',
        JSON.stringify({
          type: 'progress',
          data: {
            status: 'finished',
            total: 2,
            current: 2,
            message: 'SFC Kode Agent execution finished'
          }
        })
      )
      break
    }
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
    req?: Request
  ): Promise<eventEmitter> {
    const emitter = new eventEmitter()

    if (signal) {
      signal.addEventListener('abort', () => {
        emitter.emit('end')
      })
    }

    (async () => {
      try {
        if (signal?.aborted) return

        emitter.emit(
          'data',
          JSON.stringify({
            type: 'progress',
            data: {
              status: 'processing',
              total: 2,
              current: 1,
              question: 'Initializing SFC Agent',
              message: 'Initializing SFC Kode Agent...'
            }
          })
        )

        const esBm25SearchTool = createEsBm25SearchTool(sfcTrainingRelated ?? false)
        const agent = await createHarnessAgent(esBm25SearchTool)
        const subscriptionPromise = streamHarnessToEmitter(agent, emitter, signal)

        await agent.send(message)
        await subscriptionPromise
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'response',
            data: `\n\nError: ${error instanceof Error ? error.message : String(error)}`
          })
        )
      } finally {
        emitter.emit('end')
      }
    })()

    return emitter
  }
}

