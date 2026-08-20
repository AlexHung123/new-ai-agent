import { MetaSearchAgentType } from '@/lib/search/metaSearchAgent';
import SfcAgent from '@/lib/search/sfcAgent';
import NewSfcAgent from '@/lib/search/newSfcAgent';
import GuideAgent from '@/lib/search/guideAgent';
import NewSurverAgent from '@/lib/search/newSurverAgent';
import WritingAgent from '@/lib/search/writingAgent';
import DocumentAgent from '@/lib/search/documentAgent';

export const searchHandlers: Record<string, MetaSearchAgentType> = {
  agentGuide: new GuideAgent(),
  agentSFC: new SfcAgent(),
  newSfcAgent: new NewSfcAgent(),
  newSurveyAgent: new NewSurverAgent(),
  agentWriting: new WritingAgent(),
  agentDocument: new DocumentAgent(),
};
