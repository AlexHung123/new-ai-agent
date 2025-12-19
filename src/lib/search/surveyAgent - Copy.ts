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
      rerank: false,
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
        
        if (isNaN(surveyIdInt) || surveyIdInt.toString() !== surveyId) {
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

        // Step 2: Pass the entire survey data to the LLM
        const surveyJson = JSON.stringify(data);
        
        const agentEmitter = await this.metaSearchAgent.searchAndAnswer(
          surveyJson,
          history,
          llm,
          embeddings,
          optimizationMode,
          fileIds,
          systemInstructions,
        );

        // Step 3: Forward the response from metaSearchAgent directly
        agentEmitter.on('data', (data: string) => {
          emitter.emit('data', data);
        });

        agentEmitter.on('end', () => {
          emitter.emit('end');
        });

        agentEmitter.on('error', (error) => {
          emitter.emit(
            'data',
            JSON.stringify({
              type: 'response',
              data: `Error: ${error instanceof Error ? error.message : String(error)}`,
            }),
          );
          emitter.emit('end');
        });
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

