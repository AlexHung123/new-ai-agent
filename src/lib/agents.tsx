import {
  FileText,
  Mic,
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
  kind?: 'chat' | 'tool';
  href?: string;
}

export const focusModes: AgentMode[] = [
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
    image: '/itms/ai/agent-document.png',
    permissionCode: 'chatDocumentAgent:execute',
    placeholder: 'Ask about the selected document…',
    followUpPlaceholder: 'Ask a follow-up about this document…',
  },
  {
    key: 'agentVoice',
    title: 'Agent Voice',
    description:
      'Upload a reference voice and generate speech you can download',
    icon: Mic,
    image: '/itms/ai/agent-voice.png',
    permissionCode: 'chatVoiceAgent:execute',
    kind: 'tool',
    href: '/voice',
  },
];

const DEFAULT_FOCUS_MODE = 'agentSFC';
const FOCUS_MODE_ALIASES: Record<string, string> = {
  agentSurvey: 'newSurveyAgent',
};

export function isChatFocusMode(key: string): boolean {
  return focusModes.some((mode) => mode.key === key && mode.kind !== 'tool');
}

export function resolveFocusMode(stored?: string | null): string {
  if (!stored) return DEFAULT_FOCUS_MODE;
  if (stored === 'newSfcAgent') return stored;
  if (FOCUS_MODE_ALIASES[stored]) return FOCUS_MODE_ALIASES[stored];
  if (isChatFocusMode(stored)) return stored;
  return DEFAULT_FOCUS_MODE;
}
