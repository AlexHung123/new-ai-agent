import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { BaseMessage } from '@langchain/core/messages';
import eventEmitter from 'events';
import { Converter } from 'opencc-js';
import MetaSearchAgent, { MetaSearchAgentType } from './metaSearchAgent';
import configManager from '../config';

class SfcAgent implements MetaSearchAgentType {
  private metaSearchAgent: MetaSearchAgentType;
  // 靜態 Converter 實例，避免每次調用都創建新實例
  private static cnToTwConverter = Converter({ from: 'cn', to: 'tw' });
  private static conversionCache = new Map<string, string>();

  constructor() {
    // Create a MetaSearchAgent instance for final analysis
    this.metaSearchAgent = new MetaSearchAgent({
      activeEngines: [],
      queryGeneratorPrompt: '',
      queryGeneratorFewShots: [],
      responsePrompt: `你是一個專業的香港立法會質詢分析助手。
        根據提供的檢索結果（chunks），請分析用戶的問題並提供詳細回答。

        ## 回答要求：
        1. 使用繁體中文回答
        2. 根據檢索到的chunks內容進行分析
        3. 如果檢索結果包含相關信息，請整理並清晰呈現
        4. 保持客觀、準確，避免推測
        5. 必要時可以使用表格或列表整理信息

        請根據以下檢索結果回答用戶問題：

        {context}

        用戶問題：{query}`,
      rerank: false,
      rerankThreshold: 0,
      searchWeb: false,
    });
  }

  /**
   * Extract keyword from user question using LLM
   */
  private async extractKeyword(
    userQuestion: string,
    llm: BaseChatModel,
    signal?: AbortSignal,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Check if the question is wrapped in quotes
        const trimmedQuestion = userQuestion.trim();
        if (trimmedQuestion.startsWith('"') && trimmedQuestion.endsWith('"')) {
          // Extract the content between quotes and return directly
          const keyword = trimmedQuestion.slice(1, -1).trim();
          resolve(keyword);
          return;
        }

        const keywordPrompt = `你是一個「主題關鍵詞抽取助手」，專門為 RAG 檢索系統從使用者查詢中抽取**唯一核心主題**，用於全文與向量檢索。
            ## 任務
            - 從使用者的自然語言查詢中，找出最核心、最關鍵的**一個主題詞或短語**。
            - 這個主題會被用來向知識庫檢索相關的 chunks，之後會再用使用者原始問題做分析與生成回答。
            - 因此，你只需要輸出**主題本身**，其他條件（年份、人物、格式要求等）不需要出現在你的輸出中。
            - 如果不包含任何主題，則輸出「未找到相關資料」。

            ## 語言規則
            1. 如果使用者查詢是中文（繁體或簡體），直接在**中文語境下**判斷並抽取主題。
            2. 如果使用者查詢是英文或中英混合：
              - 先理解英文含義。
              - 在腦中將主題概念轉換為**自然、常用的中文表達**。
              - 輸出的主題必須是中文，用於中文全文檢索。

            ## 輸出規則（非常重要）
            1. **只輸出一個主題詞或短語**，且必須是查詢真正關心的核心內容。
            2. 不要輸出任何解釋、說明、標點符號或引號。
            3. 優先保留使用者原文中的關鍵詞語（若為中文），例如：「愛國精神」、「房屋政策」、「最低工資」、「中小企業融資困難」。
            4. 如果查詢中包含很多格式或欄位描述（例如「問題 N」「提問年份」「提問人」等），全部忽略，只關注要搜尋「什麼內容」。
            5. 無論輸入是中文還是英文，你的最終輸出都必須是**一個中文主題詞或短語**。

            ## 範例
            - 使用者：請以繁體中文回答： 以下列格式例出以往的問答, 例出全部問題原文或答案原文必須包括「愛國精神」的字眼 ……  
              你輸出：愛國精神

            - 使用者：我想查以前有關房屋政策的質詢紀錄  
              你輸出：房屋政策

            - 使用者：幫我找所有提到中小企業融資困難的問答  
              你輸出：中小企業融資困難

            - 使用者：Find all questions about minimum wage by LegCo members  
              （先理解為：關於最低工資的問題）  
              你輸出：最低工資

            - 使用者：Show me past LegCo questions about housing policy  
              （先理解為：關於房屋政策的立法會質詢）  
              你輸出：房屋政策

            現在，請從以下使用者查詢中抽取主題：
            ${userQuestion}`;

        let keywordResponse = '';
        const stream = await llm.stream(keywordPrompt, { signal });

        for await (const chunk of stream) {
          keywordResponse += chunk.content;
        }

        resolve(keywordResponse.trim());
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Query Elasticsearch directly for exact match search
   */
  private async queryElasticsearchDirect(
    pattern: string,
    signal?: AbortSignal,
    sfcTrainingRelated?: boolean,
  ): Promise<any> {
    try {
      // Get Elasticsearch configuration from config.json
      const ragflowConfig = configManager.getConfig('ragflow', {});
      const elasticsearchUrl =
        ragflowConfig.elasticsearchUrl || 'http://192.168.1.240:12001';
      const elasticsearchAuth = ragflowConfig.elasticsearchAuth || {
        username: 'elastic1',
        password: 'infini_rag_flow',
      };
      const datasetId =
        ragflowConfig.datasetIds?.[0] || '272c75fed41c11f083790242ac1600061';
      const docId = sfcTrainingRelated
        ? ragflowConfig.trainingRelatedDocumentIds?.[0]
        : ragflowConfig.documentIds?.[0];
      const indexPattern = ragflowConfig.indexPattern || 'ragflow_*1';
      const topK = ragflowConfig.topK || 5001;

      // Build Elasticsearch query
      const queryBody = {
        size: topK,
        _source: [
          'id',
          'doc_id',
          'kb_id',
          'docnm_kwd',
          'page_num_int',
          'position_int',
          'content_with_weight_kw',
        ],
        query: {
          bool: {
            must: [
              { term: { kb_id: datasetId } },
              { term: { doc_id: docId } },
              {
                wildcard: {
                  content_with_weight_kw: {
                    value: `*${pattern}*`,
                    case_insensitive: true,
                  },
                },
              },
            ],
          },
        },
        sort: [
          { doc_id: 'asc' },
          { page_num_int: 'asc' },
          { position_int: 'asc' },
        ],
      };

      const response = await fetch(
        `${elasticsearchUrl}/${indexPattern}/_search`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/vnd.elasticsearch+json; compatible-with=8',
            Accept: 'application/vnd.elasticsearch+json; compatible-with=8',
            Authorization: `Basic ${Buffer.from(`${elasticsearchAuth.username}:${elasticsearchAuth.password}`).toString('base64')}`,
          },
          signal,
          body: JSON.stringify(queryBody),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Elasticsearch request failed with status ${response.status}`,
        );
      }

      const data = await response.json();

      // Transform Elasticsearch response to match RAGFlow response format
      const chunks = (data.hits?.hits || []).map((hit: any) => ({
        content: hit._source?.content_with_weight_kw || '',
        doc_id: hit._source?.doc_id || '',
        docnm_kwd: hit._source?.docnm_kwd || '',
        page_num_int: hit._source?.page_num_int || 0,
        position_int: hit._source?.position_int || 0,
        highlight: pattern, // Use pattern as highlight for exact match
        score: hit._score || 0,
      }));

      return {
        data: {
          total: data.hits?.total?.value || 0,
          chunks: chunks,
        },
      };
    } catch (error) {
      throw new Error(
        `Elasticsearch error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Query RAGFlow API for relevant chunks
   */
  private async queryRAGFlow(
    keyword: string,
    signal?: AbortSignal,
    sfcTrainingRelated?: boolean,
  ): Promise<any> {
    try {
      // Get RAGFlow configuration from config.json
      const ragflowConfig = configManager.getConfig('ragflow', {});
      const apiUrl =
        ragflowConfig.apiUrl || 'http://192.168.56.1:8001/api/v1/retrieval';
      const apiKey =
        ragflowConfig.apiKey || 'ragflow-g4OTUwYjU2NDFiYjExZjBhYmY5MDI0Mm';
      const datasetIds = ragflowConfig.datasetIds || [
        '272c75fed41c11f083790242ac160006',
      ];
      const documentIds = sfcTrainingRelated
        ? ragflowConfig.trainingRelatedDocumentIds || [
            '2c94c62cd41c11f083790242ac160006',
          ]
        : ragflowConfig.documentIds || ['2c94c62cd41c11f083790242ac160006'];

      const similarityThreshold =
        // overrides?.similarityThreshold ??
        ragflowConfig.similarityThreshold ?? 0.3;
      const vectorSimilarityWeight =
        // overrides?.vectorSimilarityWeight ??
        ragflowConfig.vectorSimilarityWeight ?? 0.1;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal,
        body: JSON.stringify({
          question: keyword,
          dataset_ids: datasetIds,
          document_ids: documentIds,
          similarity_threshold: similarityThreshold,
          vector_similarity_weight: vectorSimilarityWeight,
          page: 1,
          page_size: 2000,
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

  /**
   * Extract highlighted keywords from simplified Chinese highlight text
   */
  private extractHighlightedKeywords(highlight: string): string[] {
    if (!highlight) return [];

    const keywords: string[] = [];
    const regex = /<em>(.*?)<\/em>/g;
    let match;

    while ((match = regex.exec(highlight)) !== null) {
      if (match[1] && match[1].trim()) {
        keywords.push(match[1].trim());
      }
    }

    return keywords;
  }

  /**
   * Convert simplified Chinese keyword to traditional Chinese
   * Using opencc-js library for accurate conversion
   */
  private simplifiedToTraditional(text: string): string {
    if (SfcAgent.conversionCache.has(text)) {
      return SfcAgent.conversionCache.get(text)!;
    }
    // Use static OpenCC converter: Simplified Chinese to Traditional Chinese (Taiwan)
    const converted = SfcAgent.cnToTwConverter(text);
    SfcAgent.conversionCache.set(text, converted);
    return converted;
  }

  /**
   * Add <em> tags to content based on highlighted keywords
   */
  private highlightContentKeywords(content: string, highlight: string): string {
    if (!highlight || !content) return content;

    // Extract keywords from simplified Chinese highlight
    const simplifiedKeywords = this.extractHighlightedKeywords(highlight);

    if (simplifiedKeywords.length === 0) return content;

    // Deduplicate and convert to traditional Chinese
    const traditionalKeywords = new Set<string>();
    for (const keyword of simplifiedKeywords) {
      traditionalKeywords.add(this.simplifiedToTraditional(keyword));
    }

    if (traditionalKeywords.size === 0) return content;

    // Create a single regex pattern for all keywords
    const patterns = Array.from(traditionalKeywords)
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape regex chars
      .sort((a, b) => b.length - a.length); // Sort by length descending to match longest first

    const regex = new RegExp(`(${patterns.join('|')})`, 'g');

    // Replace all occurrences in one pass
    return content.replace(
      regex,
      '<span style="color:red;display:inline !important;">$1</span>',
    );
  }

  private extractYear(content: string) {
    const yearMatch = content.match(/(?:年份|Year)[：:]\s*(\d{4})/);
    return yearMatch ? parseInt(yearMatch[1], 10) : 0;
  }

  /**
   * Extract chunks from RAGFlow response
   */
  private extractChunks(ragflowResponse: any): string {
    try {
      if (
        !ragflowResponse ||
        !ragflowResponse.data ||
        !ragflowResponse.data.chunks ||
        ragflowResponse.data.chunks.length === 0
      ) {
        return '未找到相關資料';
      }

      const chunks = ragflowResponse.data.chunks;

      // Sort chunks by year in descending order
      const sortedChunks = [...chunks].sort((a: any, b: any) => {
        const yearA = this.extractYear(a.content || '');
        const yearB = this.extractYear(b.content || '');
        return yearB - yearA; // Descending order
      });

      // Format chunks for display - only raw content
      const formattedChunks = sortedChunks
        .map((chunk: any) => {
          let content = chunk.content || '';

          // Remove unwanted patterns
          content = content
            .replace(/檢索結果\s*\d+\s*\(相似度:\s*[\d.]+%\)/g, '') // Remove "檢索結果 X (相似度: X%)"
            .replace(/文件來源:[^\n]*/g, '') // Remove "文件來源: ..."
            .trim();

          const year = this.extractYear(content);

          // Extract category number from "綱領： (x)" or "綱領： （x）"
          const categoryMatch = content.match(/綱領：\s*[（\(](\d+)[）\)]/);
          const category = categoryMatch ? categoryMatch[1] : null;

          // Extract question number
          const questionNoMatch = content.match(
            /(?:問題編號|Question No\.?)\s*[：:]\s*(\d+)/i,
          );
          const questionNo = questionNoMatch ? questionNoMatch[1] : null;

          // Extract first 4 lines for summary (before highlighting)
          const lines = content
            .split('\n')
            .filter((line: string) => line.trim().length > 0);
          // const firstFourLines = lines.slice(0, 2).join(' ');
          // const summaryLines = lines.filter((line: string) => !line.match(/(?:年份|Year)[：:]\s*\d{4}/));
          const summaryLines = lines.filter(
            (line: string) => !line.match(/(?:年份|Year)[：:]\s*\d{4}/),
          );
          const firstFourLines = summaryLines.slice(0, 1).join(' ');
          const truncatedSummary =
            firstFourLines.length > 150
              ? firstFourLines.substring(0, 150) + '...'
              : firstFourLines;

          // Add <em> tags based on highlight field
          if (chunk.highlight) {
            content = this.highlightContentKeywords(content, chunk.highlight);
          }

          // Create summary text with document metadata and content preview
          // let summaryText = truncatedSummary;
          let summaryText = year > 0 ? `${year} - ` : '';

          if (questionNo) {
            summaryText += `（問題編號：${questionNo}）`;
          } else {
            summaryText += truncatedSummary;
          }

          if (category) {
            summaryText += ` (綱領：${category})`;
          }

          // Add highlighted keywords to summaryText in traditional Chinese, separated by |
          if (chunk.highlight) {
            const simplifiedKeywords = this.extractHighlightedKeywords(
              chunk.highlight,
            );
            if (simplifiedKeywords.length > 0) {
              // Convert to traditional Chinese and remove duplicates using Set
              const traditionalKeywords = [
                ...new Set(
                  simplifiedKeywords.map((keyword) =>
                    this.simplifiedToTraditional(keyword),
                  ),
                ),
              ].join(' | ');
              summaryText += ` [關鍵詞: ${traditionalKeywords}]`;
            }
          }

          // Wrap content in details/summary for collapsible functionality
          const collapsibleContent = `<details>
<summary style="cursor: pointer; font-weight: bold; padding: 8px; background-color: #f5f5f5; border-radius: 4px; margin-bottom: 8px;">${summaryText}</summary>
<div style="padding: 12px; border-left: 3px solid #ddd; margin-left: 4px;">${content}</div>
</details>`;

          return collapsibleContent;

          // return content;
        })
        .filter((content: string) => content.length > 0)
        .join('\n\n');

      return formattedChunks;
    } catch (error) {
      console.log(error);
      return '處理檢索結果時發生錯誤';
    }
  }

  /**
   * Extract chunks from Elasticsearch direct query response
   * This method handles the different data structure returned by Elasticsearch
   * where highlight is just a pattern string, not formatted text with <em> tags
   */
  private extractChunksFromElasticsearch(elasticsearchResponse: any): string {
    try {
      if (
        !elasticsearchResponse ||
        !elasticsearchResponse.data ||
        !elasticsearchResponse.data.chunks ||
        elasticsearchResponse.data.chunks.length === 0
      ) {
        return '未找到相關資料';
      }

      const chunks = elasticsearchResponse.data.chunks;

      // Sort chunks by year in descending order
      const sortedChunks = [...chunks].sort((a: any, b: any) => {
        const yearA = this.extractYear(a.content || '');
        const yearB = this.extractYear(b.content || '');
        return yearB - yearA; // Descending order
      });

      // Format chunks for display with collapsible functionality
      const formattedChunks = sortedChunks
        .map((chunk: any, index: number) => {
          let content = chunk.content || '';

          // Remove unwanted patterns
          content = content
            .replace(/檢索結果\s*\d+\s*\(相似度:\s*[\d.]+%\)/g, '') // Remove "檢索結果 X (相似度: X%)"
            .replace(/文件來源:[^\n]*/g, '') // Remove "文件來源: ..."
            .trim();

          // Extract year for display
          const year = this.extractYear(content);
          // Extract category number from "綱領： (x)" or "綱領： （x）"
          const categoryMatch = content.match(/綱領：\s*[（\(](\d+)[）\)]/);
          const category = categoryMatch ? categoryMatch[1] : null;

          // Extract question number
          const questionNoMatch = content.match(
            /(?:問題編號|Question No\.?)\s*[：:]\s*(\d+)/i,
          );
          const questionNo = questionNoMatch ? questionNoMatch[1] : null;

          // Extract first lines for summary, skipping the "年份：XXXX" line
          const lines = content
            .split('\n')
            .filter((line: string) => line.trim().length > 0);
          // const summaryLines = lines.filter((line: string) => !line.match(/年份[：:]\s*\d{4}/));
          const summaryLines = lines.filter(
            (line: string) => !line.match(/(?:年份|Year)[：:]\s*\d{4}/),
          );
          const firstFourLines = summaryLines.slice(0, 1).join(' ');
          const truncatedSummary =
            firstFourLines.length > 150
              ? firstFourLines.substring(0, 150) + '...'
              : firstFourLines;

          // Highlight the search pattern in the content
          if (chunk.highlight) {
            // Elasticsearch highlight is just a pattern string
            // Escape special regex characters in the pattern
            const escapedPattern = chunk.highlight.replace(
              /[.*+?^${}()|[\]\\]/g,
              '\\$&',
            );
            const regex = new RegExp(escapedPattern, 'gi');

            // Replace with red span
            content = content.replace(
              regex,
              '<span style="color:red;display:inline !important;">$&</span>',
            );
          }

          let summaryText = year > 0 ? `${year} - ` : '';
          // summaryText += truncatedSummary;
          if (questionNo) {
            summaryText += `（問題編號：${questionNo}）`;
          } else {
            summaryText += truncatedSummary;
          }

          if (category) {
            summaryText += ` 綱領：${category}`;
          }

          // Wrap content in details/summary for collapsible functionality
          const collapsibleContent = `<details>
<summary style="cursor: pointer; font-weight: bold; padding: 8px; background-color: #f5f5f5; border-radius: 4px; margin-bottom: 8px;">${summaryText}</summary>
<div style="padding: 12px; border-left: 3px solid #ddd; margin-left: 4px;">${content}</div>
</details>`;

          return collapsibleContent;
        })
        .filter((content: string) => content.length > 0)
        .join('\n\n');

      return formattedChunks;
    } catch (error) {
      return '處理檢索結果時發生錯誤';
    }
  }

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

    if (signal) {
      signal.addEventListener('abort', () => {
        emitter.emit('end');
      });
    }

    // Execute asynchronously
    (async () => {
      try {
        if (signal?.aborted) return;

        const totalSteps = sfcExactMatch ? 1 : 2;

        let keyword = '';

        if (sfcExactMatch) {
          keyword = message.trim();
        } else {
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'progress',
              data: {
                status: 'processing',
                total: totalSteps,
                current: 1,
                question: '正在分析問題',
                message: '正在分析問題…',
              },
            }),
          );

          keyword = await this.extractKeyword(message, llm, signal);
          if (keyword.includes('</think>')) {
            keyword = keyword.split('</think>').pop()?.trim() || keyword;
          }
          console.log('----------');
          console.log('Extracted keyword:', keyword);
          if (keyword === '未找到相關資料') {
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'response',
                data: '抱歉，未能在資料庫中找到與您問題相關的資料。',
              }),
            );
            emitter.emit('end');
            return;
          }
        }

        emitter.emit(
          'data',
          JSON.stringify({
            type: 'progress',
            data: {
              status: 'processing',
              total: totalSteps,
              current: sfcExactMatch ? 1 : 2,
              question: '檢索資料源',
              message: '正在檢索資料源…',
            },
          }),
        );
        let ragflowResponse: any;

        if (sfcExactMatch) {
          // Use Elasticsearch direct query for exact match
          ragflowResponse = await this.queryElasticsearchDirect(
            keyword,
            signal,
            sfcTrainingRelated,
          );
        } else {
          ragflowResponse = await this.queryRAGFlow(
            keyword,
            signal,
            sfcTrainingRelated,
          );
        }
        let chunks: string;

        if (sfcExactMatch) {
          // Use the new method for Elasticsearch response
          chunks = this.extractChunksFromElasticsearch(ragflowResponse);
        } else {
          // Use the existing method for RAGFlow response
          chunks = this.extractChunks(ragflowResponse);
        }
        if (chunks === '未找到相關資料') {
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'response',
              data: '抱歉，未能在資料庫中找到與您問題相關的資料。',
            }),
          );
          emitter.emit('end');
          return;
        }

        if (signal?.aborted) return;

        // Return chunks directly without analysis
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'response',
            data: `找到 ${ragflowResponse.data.total} 個相關結果 (${keyword})\n\n${chunks}`,
          }),
        );
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'progress',
            data: {
              status: 'finished',
              total: totalSteps,
              current: totalSteps,
              message: '檢索完成',
            },
          }),
        );

        emitter.emit('end');
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return;
        }
        setImmediate(() => {
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'response',
              data: `錯誤：${error instanceof Error ? error.message : String(error)}`,
            }),
          );
          emitter.emit('end');
        });
      }
    })();

    return emitter;
  }
}

export default SfcAgent;
