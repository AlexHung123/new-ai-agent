import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { BaseMessage } from '@langchain/core/messages';
import eventEmitter from 'events';
import MetaSearchAgent, { MetaSearchAgentType } from './metaSearchAgent';
import { prismaSecondary } from '@/lib/postgres/db';
import prompts from '../prompts';

class DataAgent implements MetaSearchAgentType {
  private metaSearchAgent: MetaSearchAgentType;

  constructor() {
    // Create a MetaSearchAgent instance to get SQL statements
    this.metaSearchAgent = new MetaSearchAgent({
      activeEngines: [],
      queryGeneratorPrompt: '',
      queryGeneratorFewShots: [],
      responsePrompt: prompts.dataPrompt,
      rerank: false,
      rerankThreshold: 0,
      searchWeb: false,
    });
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Check if a value is epoch milliseconds (between 1970 and 3000)
   */
  private isEpochMillis(value: number): boolean {
    try {
      if (value < 0) {
        return false;
      }
      const seconds = value / 1000.0;
      const dt = new Date(seconds);
      const year = dt.getUTCFullYear();
      return 1970 <= year && year <= 3000;
    } catch {
      return false;
    }
  }

  /**
   * Format epoch milliseconds to date string
   */
  private formatEpochMillis(value: number): string {
    const dt = new Date(value);
    const year = dt.getUTCFullYear();
    const month = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const day = String(dt.getUTCDate()).padStart(2, '0');
    const hours = String(dt.getUTCHours()).padStart(2, '0');
    const minutes = String(dt.getUTCMinutes()).padStart(2, '0');
    const seconds = String(dt.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
  }

  /**
   * Format header: snake_case -> Title Case
   */
  private formatHeader(h: string): string {
    return h
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Generate HTML table from JSON data
   */
  private generateHtmlTable(data: any[]): string {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        return "<div style='color:#d32f2f'>No data to display</div>";
      }

      // Determine headers from the first row, preserving its key order
      const firstRow = data[0];
      if (!firstRow || typeof firstRow !== 'object') {
        return "<div style='color:#d32f2f'>No data to display</div>";
      }

      const headers = Object.keys(firstRow);

      const parts: string[] = [];
      parts.push(
        "<div style='margin-bottom:16px;font-weight:500;'>根據系統搜索，以下是返回的信息:</div>",
      );
      parts.push(
        "<style>" +
          "table{width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;" +
          "box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;}" +
          "th{background-color:#2962ff;color:#fff;font-weight:600;padding:12px 15px;text-align:left;}" +
          "td{padding:12px 15px;border-bottom:1px solid #e0e0e0;color:#333;}" +
          "tbody tr:nth-child(even){background-color:#f8f9ff;}" +
          "tbody tr:hover{background-color:#e6f0ff;cursor:pointer;transition:background-color 0.2s ease;}" +
          "@media (max-width:600px){table,thead,tbody,th,td,tr{display:block;}th,td{padding:10px;text-align:right;}" +
          "th{text-align:left;background-color:#2962ff;color:#fff;font-weight:bold;}tr{margin-bottom:10px;border-bottom:2px solid #ddd;" +
          "display:block;border-radius:6px;overflow:hidden;}}" +
          "</style>",
      );
      parts.push('<table>');
      parts.push('<thead><tr>');
      for (const h of headers) {
        parts.push(`<th>${this.escapeHtml(this.formatHeader(h))}</th>`);
      }
      parts.push('</tr></thead>');
      parts.push('<tbody>');

      for (const row of data) {
        parts.push('<tr>');
        if (typeof row === 'object' && row !== null) {
          for (const h of headers) {
            let cell = '';
            const v = row[h];
            if (v !== null && v !== undefined) {
              if (typeof v === 'number') {
                if (
                  h.toLowerCase().includes('date') &&
                  this.isEpochMillis(v)
                ) {
                  cell = this.escapeHtml(this.formatEpochMillis(v));
                } else {
                  cell = this.escapeHtml(String(v));
                }
              } else {
                cell = this.escapeHtml(String(v));
              }
            }
            parts.push(`<td>${cell}</td>`);
          }
        } else {
          // Non-dict row: render as single cell spanning columns
          parts.push(
            `<td colspan='${headers.length}'>${this.escapeHtml(String(row))}</td>`,
          );
        }
        parts.push('</tr>');
      }

      parts.push('</tbody></table>');
      return parts.join('');
    } catch (e) {
      return `<div style='color:red'>Error: ${this.escapeHtml(String(e))}</div>`;
    }
  }

  /**
   * Extract SQL statement from MetaSearchAgent response
   */
  private async getSqlFromMetaSearchAgent(
    message: string,
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[],
    systemInstructions: string,
  ): Promise<string | null> {
    return new Promise(async (resolve) => {
      let sqlResponse = '';
      const emitter = await this.metaSearchAgent.searchAndAnswer(
        message,
        history,
        llm,
        embeddings,
        optimizationMode,
        fileIds,
        systemInstructions,
      );

      emitter.on('data', (data: string) => {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.type === 'response') {
            sqlResponse += parsedData.data;
          }
        } catch (e) {
          // Ignore parse errors
        }
      });

      emitter.on('end', () => {
        // Clean up the SQL response - remove code fences, trim whitespace
        let sql = sqlResponse.trim();
        
        // Remove markdown code fences if present
        sql = sql.replace(/^```[\w]*\n?/g, '').replace(/\n?```$/g, '');
        sql = sql.trim();

        // Check if it's "No SQL Provide" or similar
        if (
          sql.toLowerCase().includes('no sql') ||
          sql.toLowerCase().includes('no sql provide')
        ) {
          resolve(null);
        } else {
          resolve(sql);
        }
      });

      emitter.on('error', () => {
        resolve(null);
      });
    });
  }

  /**
   * Execute SQL and return results
   */
  private async executeSql(sql: string): Promise<any[]> {
    try {
      const columns: any[] = await prismaSecondary.$queryRawUnsafe(sql);
      return columns;
    } catch (error) {
      throw new Error(`SQL execution error: ${error}`);
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
        // Step 1: Get SQL statement from MetaSearchAgent
        const sql = await this.getSqlFromMetaSearchAgent(
          message,
          history,
          llm,
          embeddings,
          optimizationMode,
          fileIds,
          systemInstructions,
        );
        if (!sql) {
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'response',
              data: 'No SQL statement could be generated for your query.',
            }),
          );
          emitter.emit('end');
          return;
        }

        // Step 2: Execute SQL using prismaSecondary
        let columns: any[];
        try {
          columns = await this.executeSql(sql);
        } catch (error) {
          // If SQL execution fails, return "No SQL Provided" message
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'response',
              data: 'No SQL statement could be generated for your query.',
            }),
          );
          emitter.emit('end');
          return;
        }

        // Step 3: Convert columns to HTML table
        const htmlTable = this.generateHtmlTable(columns);

        // Step 4: Return the response similar to MetaSearchAgent
        // Stream the HTML table as response chunks
        const chunkSize = 100; // Emit in chunks for streaming effect
        for (let i = 0; i < htmlTable.length; i += chunkSize) {
          const chunk = htmlTable.slice(i, i + chunkSize);
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'response',
              data: chunk,
            }),
          );
        }

        emitter.emit('end');
      } catch (error) {
        emitter.emit(
          'data',
          JSON.stringify({
            type: 'response',
            data: `Error: ${error instanceof Error ? error.message : String(error)}`,
          }),
        );
        emitter.emit('end');
      }
    })();

    return emitter;
  }
}

export default DataAgent;

