import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { BaseMessage } from '@langchain/core/messages';
import eventEmitter from 'events';
import { Converter } from 'opencc-js';
import MetaSearchAgent, { MetaSearchAgentType } from './metaSearchAgent';
import configManager from '../config';

class SfcAgent implements MetaSearchAgentType {
  private metaSearchAgent: MetaSearchAgentType;

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
        const stream = await llm.stream(keywordPrompt);

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
   * Query RAGFlow API for relevant chunks
   */
  private async queryRAGFlow(keyword: string): Promise<any> {
    try {
      // Get RAGFlow configuration from config.json
      const ragflowConfig = configManager.getConfig('ragflow', {});
      const apiUrl = ragflowConfig.apiUrl || 'http://192.168.56.1:8001/api/v1/retrieval';
      const apiKey = ragflowConfig.apiKey || 'ragflow-g4OTUwYjU2NDFiYjExZjBhYmY5MDI0Mm';
      const datasetIds = ragflowConfig.datasetIds || ['272c75fed41c11f083790242ac160006'];
      const documentIds = ragflowConfig.documentIds || ['2c94c62cd41c11f083790242ac160006'];
      const similarityThreshold = ragflowConfig.similarityThreshold ?? 0.3;
      const vectorSimilarityWeight = ragflowConfig.vectorSimilarityWeight ?? 0.1;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          question: keyword,
          dataset_ids: datasetIds,
          document_ids: documentIds,
          similarity_threshold: similarityThreshold,
          vector_similarity_weight: vectorSimilarityWeight,
        }),
      });

      if (!response.ok) {
        throw new Error(`RAGFlow API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`RAGFlow API error: ${error instanceof Error ? error.message : String(error)}`);
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
    // Use OpenCC converter: Simplified Chinese to Traditional Chinese (Taiwan)
    const converter = Converter({ from: 'cn', to: 'tw' });
    return converter(text);
  }

  /**
   * Add <em> tags to content based on highlighted keywords
   */
  private highlightContentKeywords(content: string, highlight: string): string {
    if (!highlight || !content) return content;
    
    // Extract keywords from simplified Chinese highlight
    const simplifiedKeywords = this.extractHighlightedKeywords(highlight);
    
    if (simplifiedKeywords.length === 0) return content;
    
    let highlightedContent = content;
    
    // Convert simplified keywords to traditional and highlight them in content
    for (const simplifiedKeyword of simplifiedKeywords) {
      const traditionalKeyword = this.simplifiedToTraditional(simplifiedKeyword);
      
      // Use regex to match the keyword (case insensitive for better matching)
      // Escape special regex characters in the keyword
      const escapedKeyword = traditionalKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedKeyword, 'g');
      
      // Replace with <em> tags
      highlightedContent = highlightedContent.replace(regex, `<span style="color:red;">${traditionalKeyword}</span>`);
    }
    
    return highlightedContent;
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
      
      // Format chunks for display - only raw content
      const formattedChunks = chunks
        .map((chunk: any) => {
          let content = chunk.content || '';
          
          // Remove unwanted patterns
          content = content
            .replace(/檢索結果\s*\d+\s*\(相似度:\s*[\d.]+%\)/g, '') // Remove "檢索結果 X (相似度: X%)"
            .replace(/文件來源:[^\n]*/g, '') // Remove "文件來源: ..."
            .trim();
          
          // Add <em> tags based on highlight field
          if (chunk.highlight) {
            content = this.highlightContentKeywords(content, chunk.highlight);
          }
          
          return content;
        })
        .filter((content: string) => content.length > 0)
        .join('\n\n---\n\n');

      return formattedChunks;
    } catch (error) {
      console.error('Error extracting chunks:', error);
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
  ): Promise<eventEmitter> {
    const emitter = new eventEmitter();

    // Execute asynchronously
    (async () => {
      try {
        // Step 1: Extract keyword from user question
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'response',
            data: '正在提取關鍵詞...\n\n',
          }),
        );

        const keyword = await this.extractKeyword(message, llm);
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

        // Step 2: Query RAGFlow API
        const ragflowResponse = await this.queryRAGFlow(keyword);

        // Step 3: Extract chunks from response
        const chunks = this.extractChunks(ragflowResponse);

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

        // Return chunks directly without analysis
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'response',
            data: `找到 ${ragflowResponse.data.total} 個相關結果 (${keyword})\n\n${chunks}`,
          }),
        );

        emitter.emit('end');

      } catch (error) {
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
