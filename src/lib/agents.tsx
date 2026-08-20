import {
  Book,
  FileText,
  NotepadText,
  UsersRound,
  LucideIcon,
  PenLine,
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
    description: 'Your assistant for searching SFC questions and replies',
    icon: UsersRound,
    image: '/itms/ai/agent_sfc.png',
    permissionCode: 'chatSfcAgent:execute',
    placeholder: 'Search keyword ...',
    followUpPlaceholder: 'Search keyword ...',
  },
  {
    key: 'newSurveyAgent',
    title: 'Agent Survey',
    description: 'Your assistant for summarizing survey results',
    icon: NotepadText,
    image: '/itms/ai/agent_survey.png',
    permissionCode: 'chatSurveyAgent:execute',
    placeholder: 'Please enter survey ID ...',
    followUpPlaceholder: 'Please enter survey id ...',
  },
  {
    key: 'agentWriting',
    title: 'Agent Writing',
    description: 'Your assistant on writing and reviewing document',
    icon: PenLine,
    image: '/itms/ai/agent-writing.png',
    permissionCode: 'chatGuideAgent:execute',
    placeholder: 'Describe what you want to write or paste text to improve...',
    followUpPlaceholder: 'Continue editing or ask for another revision...',
  },
  {
    key: 'agentDocument',
    title: 'Agent Document',
    description: 'Ask about a selected policy document',
    icon: FileText,
    image: '/itms/ai/agent-writing.png',
    permissionCode: 'chatDocumentAgent:execute',
    placeholder: 'Ask about the selected document…',
    followUpPlaceholder: 'Ask a follow-up about this document…',
  },
];

const DEFAULT_FOCUS_MODE = 'agentSFC';
const FOCUS_MODE_ALIASES: Record<string, string> = {
  agentSurvey: 'newSurveyAgent',
};

export function resolveFocusMode(stored?: string | null): string {
  if (!stored) return DEFAULT_FOCUS_MODE;
  if (stored === 'newSfcAgent') return stored;
  if (FOCUS_MODE_ALIASES[stored]) return FOCUS_MODE_ALIASES[stored];
  if (focusModes.some((mode) => mode.key === stored)) return stored;
  return DEFAULT_FOCUS_MODE;
}
