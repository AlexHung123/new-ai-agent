import MetaSearchAgent, {
  MetaSearchAgentType,
} from '@/lib/search/metaSearchAgent';
import DataAgent from '@/lib/search/dataAgent';
import SurveyAgent from '@/lib/search/surveyAgent';
import SfcAgent from '@/lib/search/sfcAgent';
import AgentImage from '@/lib/search/agentImage';
import NewSfcAgent from '@/lib/search/newSfcAgent';
import GuideAgent from '@/lib/search/guideAgent';
import NewSurverAgent from '@/lib/search/newSurverAgent';
import prompts from '../prompts';

export const searchHandlers: Record<string, MetaSearchAgentType> = {
  agentGuide: new GuideAgent(),
  agentSFC: new SfcAgent(),
  agentSurvey: new SurveyAgent(),
  agentData: new DataAgent(),
  agentImage: new AgentImage(),
  newSfcAgent: new NewSfcAgent(),
  newSurveyAgent: new NewSurverAgent(),
};
