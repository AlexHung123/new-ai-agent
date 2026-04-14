import {
  getRagflowRetrievalConfig,
  RagflowRetrievalConfig,
} from '../config/ragflowConfig';

export async function queryRagflow(
  keyword: string,
  signal?: AbortSignal,
  overrides?: Partial<RagflowRetrievalConfig>,
): Promise<any> {
  try {
    const config = {
      ...getRagflowRetrievalConfig(),
      ...(overrides ?? {}),
    };

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      signal: AbortSignal.timeout(20_000),
      // signal,
      body: JSON.stringify({
        question: keyword,
        rerank_id: '',
        dataset_ids: config.datasetIds,
        document_ids: config.documentIds,
        similarity_threshold: config.similarityThreshold,
        vector_similarity_weight: config.vectorSimilarityWeight,
        page: 1,
        page_size: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `RAGFlow API request failed with status ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `RAGFlow API error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
