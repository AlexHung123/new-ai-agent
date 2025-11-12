import MetaSearchAgent, { MetaSearchAgentType } from '@/lib/search/metaSearchAgent';
import DataAgent from '@/lib/search/dataAgent';
import SurveyAgent from '@/lib/search/surveyAgent';
import prompts from '../prompts';

export const searchHandlers: Record<string, MetaSearchAgentType> = {
  agentGuide: new MetaSearchAgent({
    activeEngines: [],
    queryGeneratorPrompt: '',
    queryGeneratorFewShots: [],
    responsePrompt: prompts.guidePrompt,
    rerank: true,
    rerankThreshold: 0,
    searchWeb: false,
  }),
  agentSFC: new MetaSearchAgent({
    activeEngines: [],
    queryGeneratorPrompt: '',
    queryGeneratorFewShots: [],
    responsePrompt: prompts.sfcPrompt,
    rerank: true,
    rerankThreshold: 0,
    searchWeb: false,
  }),
  agentSurvey: new SurveyAgent(),
  agentData: new DataAgent(),
};
