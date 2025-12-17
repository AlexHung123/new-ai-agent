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

        const freeTextOnly = surveyData[0]['result_json'] as unknown as Record<string, string[]>;

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

        // Step 2: Process all questions sequentially
        for (const question of questionKeys) {
          const answers = freeTextOnly[question];

          try {
            // Format the question and answers as JSON for the MetaSearchAgent
            const questionData = {
              [question]: answers,
            };
            const questionJson = JSON.stringify(questionData);

            const innerEmitter = await this.metaSearchAgent.searchAndAnswer(
              questionJson,
              history,
              llm,
              embeddings,
              optimizationMode,
              fileIds,
              systemInstructions,
            );

            // Wait for this question's stream to complete before moving to the next
            await new Promise<void>((resolve) => {
              innerEmitter.on('data', (data: string) => {
                // Pipe the data directly to the main emitter
                emitter.emit('data', data);
              });

              innerEmitter.on('end', () => {
                resolve();
              });

              innerEmitter.on('error', (error) => {
                console.error(`Error processing question "${question}":`, error);
                emitter.emit(
                  'data',
                  JSON.stringify({
                    type: 'response',
                    data: `\n\nError processing question "${question}": ${error instanceof Error ? error.message : String(error)}\n\n`,
                  }),
                );
                resolve(); // Continue to next question even on error
              });
            });

            // Add separation between questions
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'response',
                data: '\n\n',
              }),
            );
          } catch (error) {
            console.error(`Error in loop for question "${question}":`, error);
            emitter.emit(
              'data',
              JSON.stringify({
                type: 'response',
                data: `\n\nError processing question "${question}": ${error instanceof Error ? error.message : String(error)}\n\n`,
              }),
            );
          }
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

