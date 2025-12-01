import { Book, Database, NotepadText, UsersRound, LucideIcon } from 'lucide-react';
import React from 'react';

export interface AgentMode {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  image: string;
  permissionCode?: string;
}

export const focusModes: AgentMode[] = [
  {
    key: 'agentData',
    title: 'Agent Data',
    description: 'Your assistant for retrieving training data',
    icon: Database,
    image: '/itms/ai/agent_data.png',
    permissionCode: 'chatDataAgent:execute',
  },
  {
    key: 'agentGuide',
    title: 'Agent Guide',
    description: 'You assistant on training policy',
    icon: Book,
    image: '/itms/ai/agent_guide.png',
    permissionCode: 'chatGuideAgent:execute',
  },
  {
    key: 'agentSFC',
    title: 'Agent SFC',
    description: 'Your assistant for analyzing SFC meetings',
    icon: UsersRound,
    image: '/itms/ai/agent_sfc.png',
    permissionCode: 'chatSfcAgent:execute',
  },
  {
    key: 'agentSurvey',
    title: 'Agent Survey',
    description: 'Your assistant for analyzing survey response',
    icon: NotepadText,
    image: '/itms/ai/agent_survey.png',
    permissionCode: 'chatSurveyAgent:execute',
  },
];
