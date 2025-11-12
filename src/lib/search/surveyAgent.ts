import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { BaseMessage } from '@langchain/core/messages';
import eventEmitter from 'events';
import MetaSearchAgent, { MetaSearchAgentType } from './metaSearchAgent';
import { getLimeSurveySummaryBySid } from '@/lib/postgres/limeSurvery';
import { splitSurvey } from '@/lib/utils/splitSurvey';
import type { Survey, FreeTextOnly } from '@/lib/utils/types';
import prompts from '../prompts';

class SurveyAgent implements MetaSearchAgentType {
  private metaSearchAgent: MetaSearchAgentType;

  constructor() {
    // Create a MetaSearchAgent instance to process each question
    this.metaSearchAgent = new MetaSearchAgent({
      activeEngines: [],
      queryGeneratorPrompt: '',
      queryGeneratorFewShots: [],
      responsePrompt: prompts.surveyPrompt,
      rerank: true,
      rerankThreshold: 0,
      searchWeb: false,
    });
  }

  /**
   * Get summary for a single question using MetaSearchAgent
   */
  private async getQuestionSummary(
    question: string,
    answers: { answer: string }[],
    history: BaseMessage[],
    llm: BaseChatModel,
    embeddings: Embeddings,
    optimizationMode: 'speed' | 'balanced' | 'quality',
    fileIds: string[],
    systemInstructions: string,
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Format the question and answers as JSON for the MetaSearchAgent
        const questionData = {
          [question]: answers,
        };
        const questionJson = JSON.stringify(questionData);

        let summaryResponse = '';
        const emitter = await this.metaSearchAgent.searchAndAnswer(
          questionJson,
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
              summaryResponse += parsedData.data;
            }
          } catch (e) {
            // Ignore parse errors
          }
        });

        emitter.on('end', () => {
          resolve(summaryResponse.trim());
        });

        emitter.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
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
        // Validate input: check if message can be cast as an integer
        const surveyId = message.trim();
        const surveyIdInt = parseInt(surveyId, 10);

        console.log('--------');
        console.log('surveyId', surveyId);
        console.log('surveyIdInt', surveyIdInt);
        
        if (isNaN(surveyIdInt) || surveyIdInt.toString() !== surveyId) {
          console.log('--------');
          console.log('Please provide limeSurvery ID');
          // Use setImmediate to ensure event listeners are set up before emitting
          setImmediate(() => {
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'response',
                data: 'Please provide limeSurvery ID',
              }),
            );
            emitter.emit('end');
          });
          return;
        }

        // Step 1: Get the JSON with multiple questions
        let surveyData;
        try {
          surveyData = await getLimeSurveySummaryBySid(surveyId);
        } catch (error) {
          setImmediate(() => {
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'response',
                data: 'No such LimeSurvey ID exists',
              }),
            );
            emitter.emit('end');
          });
          return;
        }
        
        const data: Survey = (surveyData[0]['result_json']) as unknown as Survey;
        const { freeTextOnly } = splitSurvey(data);

        // Check if there are any free text questions
        const questionKeys = Object.keys(freeTextOnly);
        if (questionKeys.length === 0) {
          setImmediate(() => {
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'response',
                data: 'No free text questions found in the survey.',
              }),
            );
            emitter.emit('end');
          });
          return;
        }

        // Step 2: Process all questions concurrently
        const summaryPromises = questionKeys.map(async (question) => {
          const answers = freeTextOnly[question];
          
          try {
            const summary = await this.getQuestionSummary(
              question,
              answers,
              history,
              llm,
              embeddings,
              optimizationMode,
              fileIds,
              systemInstructions,
            );
            
            return summary || null;
          } catch (error) {
            console.error(`Error processing question "${question}":`, error);
            // Return error message instead of throwing
            return `Error processing question "${question}": ${error instanceof Error ? error.message : String(error)}`;
          }
        });
        
        // Wait for all promises to settle (either resolve or reject)
        const summaryResults = await Promise.allSettled(summaryPromises);
        
        // Extract summaries from settled promises
        const summaries: string[] = summaryResults
          .map((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
              return result.value;
            } else if (result.status === 'rejected') {
              return `Error processing question "${questionKeys[index]}": ${result.reason}`;
            }
            return null;
          })
          .filter((summary): summary is string => summary !== null);

        // Step 3: Remove duplicate "# Summary\n- Processed at: YYYY-MM-DD" from all summaries except the first one
        const processedSummaries = summaries.map((summary, index) => {
          if (index === 0) {
            // Keep the first summary as is
            return summary;
          }
          // Remove "# Summary\n- Processed at: YYYY-MM-DD" pattern from subsequent summaries
          // Match the pattern with optional whitespace and date variations
          const summaryHeaderPattern = /^# Summary\s*\n\s*-\s*Processed at:\s*[^\n]+\s*\n\s*/i;
        //   const summaryHeaderPattern =/^(?mi)#\s*Summary\s*\n-\s*Processed at:\s*(\d{4}-\d{2}-\d{2})\s*\n\s*##\s*Questions\s*\n/;

          return summary.replace(summaryHeaderPattern, '').trim();
        });

        // Step 4: Combine all summaries with '\n\n'
        const combinedSummary = processedSummaries.join('\n\n');

        // Step 5: Return the response similar to MetaSearchAgent
        // Stream the combined summary as response chunks
        const chunkSize = 100; // Emit in chunks for streaming effect
        for (let i = 0; i < combinedSummary.length; i += chunkSize) {
          const chunk = combinedSummary.slice(i, i + chunkSize);
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
        setImmediate(() => {
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'response',
              data: `Error: ${error instanceof Error ? error.message : String(error)}`,
            }),
          );
          emitter.emit('end');
        });
      }
    })();

    return emitter;
  }
}

export default SurveyAgent;

