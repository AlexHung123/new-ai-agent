import { defineTool } from '@shareai-lab/kode-sdk/dist/tools/define';
import { queryRagflow } from '../ragflow/ragflowClient';
import db from '../../../db';
import { sfcQuestionM } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

function extractYear(content: string) {
  const yearMatch = content.match(/(?:年份|Year)[：:]\s*(\d{4})/);
  return yearMatch ? parseInt(yearMatch[1], 10) : 0;
}

interface ChunkResult {
  content: string;
  document_link?: string;
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
    async exec(
      args: EsBm25Args,
    ): Promise<
      EsBm25ToolResult | { ok: false; error: string; recommendations: string[] }
    > {
      try {
        const rawResult = await queryRagflow(args.query, undefined);

        const rawChunks = (rawResult?.data?.chunks ??
          rawResult?.chunks ??
          []) as any[];

        const chunks: ChunkResult[] = await Promise.all(
          rawChunks.map(async (chunk) => {
            let content =
              typeof chunk?.content_with_weight === 'string'
                ? chunk.content_with_weight
                : typeof chunk?.content === 'string'
                  ? chunk.content
                  : '';

            let document_link = '';

            const cleanContent = content
              .replace(/檢索結果\s*\d+\s*\(相似度:\s*[\d.]+%\)/g, '')
              .replace(/文件來源:[^\n]*/g, '')
              .trim();

            const year = extractYear(cleanContent);

            const important_kwd = chunk?.important_keywords || [];
            const hasTC = important_kwd.some(
              (kwd: string) => kwd.toLowerCase() === 'tc',
            );
            const hasEN = important_kwd.some(
              (kwd: string) => kwd.toLowerCase() === 'en',
            );

            const questionNoMatch = cleanContent.match(
              /(?:問題編號|Question Serial No\.?)\s*(?:[：:]\s*)?([A-Z]*\d+)/i,
            );
            const questionNo = questionNoMatch ? questionNoMatch[1] : null;

            if (questionNo && year > 0) {
              let tcPdfUrl = '';
              let enPdfUrl = '';
              try {
                const sfcData = await db
                  .select()
                  .from(sfcQuestionM)
                  .where(
                    and(
                      eq(sfcQuestionM.year, String(year)),
                      eq(sfcQuestionM.questionNo, String(questionNo)),
                    ),
                  )
                  .limit(1);

                if (sfcData && sfcData.length > 0) {
                  if (sfcData[0].tcLink) {
                    tcPdfUrl = sfcData[0].tcLink + '#' + sfcData[0].answerNo;
                  }
                  if (sfcData[0].enLink) {
                    enPdfUrl = sfcData[0].enLink + '#' + sfcData[0].answerNo;
                  }
                }
              } catch (err) {
                console.error('Error fetching SFC link in esBm25Tool:', err);
              }

              if (tcPdfUrl && hasTC)
                document_link = `<a href="${tcPdfUrl}" target="_blank" rel="noopener noreferrer">${year}-${questionNo}</a>`;
              if (enPdfUrl && hasEN)
                document_link = `<a href="${enPdfUrl}" target="_blank" rel="noopener noreferrer">${year}-${questionNo}</a>`;
            }

            return {
              content,
              document_link,
            };
          }),
        );

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
            'Check network connectivity to RAGFlow service',
            'Verify RAGFlow API URL and Key configuration',
            'Try a different search query or fallback approach',
          ],
        };
      }
    },
  });
}
