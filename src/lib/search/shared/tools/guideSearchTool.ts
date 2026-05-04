import { defineTool } from '@shareai-lab/kode-sdk/dist/tools/define';
import { queryRagflow } from '../ragflow/ragflowClient';
import configManager from '../../../config';

interface ChunkResult {
  content: string;
  document_link?: string;
}

interface GuideSearchArgs {
  query: string;
  top_k?: number;
}

interface GuideSearchResult {
  total: number;
  chunks: ChunkResult[];
  no_result: boolean;
  search_query: string;
}

export function createGuideSearchTool() {
  return defineTool({
    name: 'guide_search',
    description: 'Search chunks in guide document.',
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
    async exec(
      args: GuideSearchArgs,
    ): Promise<
      | GuideSearchResult
      | { ok: false; error: string; recommendations: string[] }
    > {
      try {
        const datasetIds =
          configManager.getConfig('ragflow.guideDatasetIds') || [
            '08fc6bd63fb811f1909cc9d8a18e3451',
          ];
        const documentIds =
          configManager.getConfig('ragflow.guideDocumentIds') || [
            '106f144a3fb811f1909cc9d8a18e3451',
          ];
        const similarityThreshold =
          configManager.getConfig('ragflow.guideSimilarityThreshold') ?? 0.4;
        const page_size =
          configManager.getConfig('ragflow.guidePageSize') ?? 3;

        const rawResult = await queryRagflow(args.query, undefined, {
          datasetIds,
          documentIds,
          similarityThreshold,
          page_size,
        });

        const rawChunks = (rawResult?.data?.chunks ??
          rawResult?.chunks ??
          []) as any[];

        const chunks: ChunkResult[] = rawChunks.map((chunk) => {
          let document_link = '';
          let content =
            typeof chunk?.content_with_weight === 'string'
              ? chunk.content_with_weight
              : typeof chunk?.content === 'string'
                ? chunk.content
                : '';
          const important_kwd = chunk?.important_keywords || [];

          document_link = `<a href="${important_kwd[0]}" target="_blank" rel="noopener noreferrer">Reference</a>`;

          return {
            content: content,
            document_link,
          };
        });

        const total = rawResult?.data?.total ?? chunks.length;

        return {
          total,
          chunks,
          no_result: total === 0,
          search_query: args.query,
        };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          recommendations: [
            'Check network connectivity to RAGFlow service',
            'Verify RAGFlow API URL and Key configuration',
            'Try a different search query or fallback approach',
          ],
        };
      }
    },
  });
}
