import { defineTool } from '@shareai-lab/kode-sdk/dist/tools/define';
import { queryRagflow } from '../ragflow/ragflowClient';

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

export function createEsBm25SearchTool() {
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
    async exec(args: EsBm25Args): Promise<EsBm25ToolResult | { ok: false; error: string; recommendations: string[] }> {
      try {
        const rawResult = await queryRagflow(args.query, undefined);

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
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          recommendations: [
            "Check network connectivity to RAGFlow service",
            "Verify RAGFlow API URL and Key configuration",
            "Try a different search query or fallback approach"
          ]
        };
      }
    },
  });
}
