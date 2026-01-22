import MetaSearchAgent, {
  MetaSearchAgentType,
} from '@/lib/search/metaSearchAgent';
import DataAgent from '@/lib/search/dataAgent';
import SurveyAgent from '@/lib/search/surveyAgent';
import SfcAgent from '@/lib/search/sfcAgent';
import AgentImage from '@/lib/search/agentImage';
import prompts from '../prompts';

export const searchHandlers: Record<string, MetaSearchAgentType> = {
  agentGuide: new MetaSearchAgent({
    activeEngines: [],
    queryGeneratorPrompt: '',
    queryGeneratorFewShots: [],
    responsePrompt: prompts.guidePrompt,
    rerank: false,
    rerankThreshold: 0,
    searchWeb: false,
  }),
  agentSFC: new SfcAgent(),
  agentSurvey: new SurveyAgent(),
  agentData: new DataAgent(),
  agentImage: new AgentImage(),
};
