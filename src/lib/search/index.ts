import MetaSearchAgent from '@/lib/search/metaSearchAgent';
import prompts from '../prompts';

export const searchHandlers: Record<string, MetaSearchAgent> = {
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
  agentSurvey: new MetaSearchAgent({
    activeEngines: [],
    queryGeneratorPrompt: '',
    queryGeneratorFewShots: [],
    responsePrompt: prompts.surveyPrompt,
    rerank: true,
    rerankThreshold: 0,
    searchWeb: false,
  }),
};
