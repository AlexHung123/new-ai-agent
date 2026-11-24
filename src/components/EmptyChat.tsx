import EmptyChatMessageInput from './EmptyChatMessageInput';
import SettingsButtonMobile from '@/components/Settings/SettingsButtonMobile';
import { useChat } from '@/lib/hooks/useChat';
import {
  SFC_DOCUMENT_FOCUS_MODE,
  SFC_REPLY_FOCUS_MODE,
  findDisplayFocusMode,
  isKnowledgeFocusMode,
} from '@/lib/agents';

const EmptyChat = () => {
  const { focusMode } = useChat();

  const focusDescriptions: Record<string, string> = {
    agentSFC: 'Your assistant for searching SFC questions and replies',
    [SFC_REPLY_FOCUS_MODE]:
      'Your assistant for searching SFC questions and replies',
    [SFC_DOCUMENT_FOCUS_MODE]:
      'Your assistant for searching SFC questions and replies',
    newSurveyAgent: 'Your assistant for summarizing survey results',
    agentKnowledge:
      'Write with your private files, or ask about shared policy folders.',
    agentWriting:
      'Write with your private files, or ask about shared policy folders.',
    agentDocument:
      'Write with your private files, or ask about shared policy folders.',
    agentHtml: 'Your assistant for create and modify HTML webpages',
  };

  const current = findDisplayFocusMode(focusMode);
  const heading =
    focusDescriptions[focusMode] ||
    current?.description ||
    'Research begins here.';
  const subheading = isKnowledgeFocusMode(focusMode)
    ? 'Pin a folder from FILES, or type @ to mention one. Public folders are shared with signed-in users.'
    : undefined;

  return (
    <div className="relative h-full min-h-full">
      <div className="absolute w-full flex flex-row items-center justify-end gap-1 mr-5 pr-2 top-[var(--chat-topbar-height)]">
        <SettingsButtonMobile />
      </div>
      <div className="empty-chat-body flex flex-col items-center justify-center min-h-full mx-auto p-2 pb-28 lg:pb-2">
        <div className="welcome-wiki">
          <h2>{heading}</h2>
          {subheading ? <p>{subheading}</p> : null}
          <EmptyChatMessageInput />
        </div>
      </div>
    </div>
  );
};

export default EmptyChat;
