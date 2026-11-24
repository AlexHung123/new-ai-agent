import {
  Code2,
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
  /** If set, the card is shown when the user has any of these permissions. */
  permissionCodes?: string[];
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
    key: 'agentKnowledge',
    title: 'Agent Knowledge',
    description:
      'Write with your private files, or ask about shared policy folders',
    icon: PenLine,
    image: '/itms/ai/agent-writing.png',
    permissionCode: 'chatGuideAgent:execute',
    permissionCodes: ['chatGuideAgent:execute', 'chatDocumentAgent:execute'],
    placeholder: 'Write a draft, or ask about a pinned Knowledge folder…',
    followUpPlaceholder: 'Continue writing, or ask a follow-up about this folder…',
  },
  {
    key: 'agentHtml',
    title: 'Agent HTML',
    description: 'Your assistant for create and modify HTML webpages',
    icon: Code2,
    image: '/itms/ai/agent-html.jpg',
    permissionCode: 'chatHtmlAgent:execute',
    placeholder: 'Describe the HTML change you want…',
    followUpPlaceholder: 'Ask for another HTML revision…',
  },
  {
    key: 'agentVoice',
    title: 'Agent Voice',
    description: 'Clone a voice or transcribe audio and video to text',
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
  agentWriting: 'agentKnowledge',
  agentDocument: 'agentKnowledge',
};

export const KNOWLEDGE_FOCUS_MODE = 'agentKnowledge';
const KNOWLEDGE_FOCUS_MODES = new Set([
  'agentKnowledge',
  'agentWriting',
  'agentDocument',
]);

export function isKnowledgeFocusMode(key: string | null | undefined): boolean {
  return Boolean(key && KNOWLEDGE_FOCUS_MODES.has(key));
}

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

export function isChatFocusMode(key: string): boolean {
  const resolved = FOCUS_MODE_ALIASES[key] || key;
  return focusModes.some((mode) => mode.key === resolved && mode.kind !== 'tool');
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
  if (isSfcFocusMode(key)) return DEFAULT_FOCUS_MODE;
  return FOCUS_MODE_ALIASES[key] || key;
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

/** First paint must not read storage. Pass null on the server and the client. */
export function focusStateFromStored(stored?: string | null): {
  focusMode: string;
  sfcExactMatch: boolean;
  documentId: string | null;
} {
  const focusMode = resolveFocusMode(stored);
  return {
    focusMode,
    sfcExactMatch: focusMode === DEFAULT_FOCUS_MODE,
    documentId: focusMode === SFC_DOCUMENT_FOCUS_MODE ? SFC_DOCUMENT_ID : null,
  };
}
