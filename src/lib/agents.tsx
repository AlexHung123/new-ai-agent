import {
  Book,
  Database,
  NotepadText,
  UsersRound,
  LucideIcon,
  Image as ImageIcon,
} from 'lucide-react';

export interface AgentMode {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  image: string;
  permissionCode?: string;
  placeholder?: string;
  followUpPlaceholder?: string;
}

export const focusModes: AgentMode[] = [
  {
    key: 'agentData',
    title: 'Agent Data',
    description: 'Your assistant for retrieving training data',
    icon: Database,
    image: '/itms/ai/agent_data.png',
    permissionCode: 'chatDataAgent:execute',
    placeholder: 'Ask about training data...',
    followUpPlaceholder: 'Ask a follow-up about training data...',
  },
  {
    key: 'agentImage',
    title: 'Agent Image',
    description: 'Your assistant for generating images',
    icon: ImageIcon,
    image: '/itms/ai/agent_flyer.png',
    permissionCode: 'chatGuideAgent:execute',
    placeholder: 'Describe the image to generate...',
    followUpPlaceholder: 'Refine the image prompt...',
  },
  {
    key: 'agentGuide',
    title: 'Agent Guide',
    description: 'You assistant on training policy',
    icon: Book,
    image: '/itms/ai/agent_guide.png',
    permissionCode: 'chatGuideAgent:execute',
    placeholder: 'Ask about training policy...',
    followUpPlaceholder: 'Ask a follow-up about training policy...',
  },
  {
    key: 'agentSFC',
    title: 'Agent SFC',
    description: 'Your assistant for searching SFC meetings',
    icon: UsersRound,
    image: '/itms/ai/agent_sfc.png',
    permissionCode: 'chatSfcAgent:execute',
    placeholder: 'Search keyword ...',
    followUpPlaceholder: 'Search keyword ...',
  },
  {
    key: 'agentSurvey',
    title: 'Agent Survey',
    description: 'Your assistant for analyzing survey',
    icon: NotepadText,
    image: '/itms/ai/agent_survey.png',
    permissionCode: 'chatSurveyAgent:execute',
    placeholder: 'Please enter survey id ...',
    followUpPlaceholder: 'Please enter survey id ...',
  },
];
