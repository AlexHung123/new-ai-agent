import { MetaSearchAgentType } from '@/lib/search/metaSearchAgent';
import SfcAgent from '@/lib/search/sfcAgent';
import NewSfcAgent from '@/lib/search/newSfcAgent';
import GuideAgent from '@/lib/search/guideAgent';
import NewSurverAgent from '@/lib/search/newSurverAgent';
import WritingAgent from '@/lib/search/writingAgent';
import DocumentAgent from '@/lib/search/documentAgent';
import HtmlAgent from '@/lib/search/htmlAgent';
import { KNOWLEDGE_FOCUS_MODE, SFC_DOCUMENT_FOCUS_MODE } from '@/lib/agents';

const documentAgent = new DocumentAgent();
const knowledgeAgent = new WritingAgent();

export const searchHandlers: Record<string, MetaSearchAgentType> = {
  agentGuide: new GuideAgent(),
  agentSFC: new SfcAgent(),
  newSfcAgent: new NewSfcAgent(),
  newSurveyAgent: new NewSurverAgent(),
  [KNOWLEDGE_FOCUS_MODE]: knowledgeAgent,
  agentWriting: knowledgeAgent,
  agentDocument: knowledgeAgent,
  agentHtml: new HtmlAgent(),
  [SFC_DOCUMENT_FOCUS_MODE]: documentAgent,
};
