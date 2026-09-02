import {
  FileText,
  Mic,
  NotepadText,
  UsersRound,
  LucideIcon,
  PenLine,
  Presentation,
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
    key: 'agentPpt',
    title: 'Agent PPT',
    description: 'Outline, plan, and design a slide deck from uploaded files',
    icon: Presentation,
    image: '/itms/ai/agent-ppt.jpg',
    permissionCode: 'chatGuideAgent:execute',
    placeholder: 'What is the presentation about? Attach source files if you have them…',
    followUpPlaceholder: 'Adjust the outline, a page, or the theme…',
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
      'Clone a voice or transcribe audio and video to text',
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

/** Internal SFC chat modes that are not separate agent cards. */
export const SFC_REPLY_FOCUS_MODE = 'newSfcAgent';
export const SFC_DOCUMENT_FOCUS_MODE = 'sfcDocumentAgent';
/** Agent Document catalog id for `data/documents/sfc`. */
export const SFC_DOCUMENT_ID = 'sfc';

const SFC_INTERNAL_FOCUS_MODES = new Set<string>([
  SFC_REPLY_FOCUS_MODE,
  SFC_DOCUMENT_FOCUS_MODE,
]);

export function isSfcFocusMode(key: string): boolean {
  return key === DEFAULT_FOCUS_MODE || SFC_INTERNAL_FOCUS_MODES.has(key);
}

export const PPT_FOCUS_MODE = 'agentPpt';

export function usesWritingLibrary(key: string): boolean {
  return key === 'agentWriting' || key === PPT_FOCUS_MODE;
}

export function isChatFocusMode(key: string): boolean {
  return focusModes.some((mode) => mode.key === key && mode.kind !== 'tool');
}

export function isToolFocusMode(key: string): boolean {
  return focusModes.some((mode) => mode.key === key && mode.kind === 'tool');
}

/** Focus mode stored on an existing chat, including tool agents such as Voice. */
export function resolveLoadedFocusMode(stored?: string | null): string {
  if (stored && isToolFocusMode(stored)) return stored;
  return resolveFocusMode(stored);
}

export function shouldPersistFocusMode(mode: string): boolean {
  return isChatFocusMode(mode);
}

export function resolveDisplayFocusMode(key: string): string {
  return isSfcFocusMode(key) ? DEFAULT_FOCUS_MODE : key;
}

export function findDisplayFocusMode(key: string): AgentMode | undefined {
  const displayKey = resolveDisplayFocusMode(key);
  return focusModes.find((mode) => mode.key === displayKey);
}

export function resolveFocusMode(stored?: string | null): string {
  if (!stored) return DEFAULT_FOCUS_MODE;
  if (SFC_INTERNAL_FOCUS_MODES.has(stored)) return stored;
  if (FOCUS_MODE_ALIASES[stored]) return FOCUS_MODE_ALIASES[stored];
  if (isChatFocusMode(stored)) return stored;
  return DEFAULT_FOCUS_MODE;
}
