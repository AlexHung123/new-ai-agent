import EmptyChatMessageInput from './EmptyChatMessageInput';
import SettingsButtonMobile from '@/components/Settings/SettingsButtonMobile';
import { useChat } from '@/lib/hooks/useChat';
import { SFC_DOCUMENT_FOCUS_MODE, SFC_REPLY_FOCUS_MODE } from '@/lib/agents';
import DocumentPicker from './DocumentPicker';
import WritingHtmlHint from './WritingHtmlHint';
import WritingLeftRail from './WritingLeftRail';

const EmptyChat = () => {
  const { focusMode, documentId, documentItems } = useChat();

  const focusDescriptions: Record<string, string> = {
    agentSFC: 'Your assistant for searching SFC questions and replies',
    [SFC_REPLY_FOCUS_MODE]:
      'Your assistant for searching SFC questions and replies',
    [SFC_DOCUMENT_FOCUS_MODE]:
      'Your assistant for searching SFC questions and replies',
    newSurveyAgent: 'Your assistant for summarizing survey results',
    agentWriting: 'Your assistant for drafting, rewriting, and polishing text',
    agentDocument: 'Ask about a selected policy document',
    agentHtml: 'Your assistant for create and modify HTML webpages',
  };

  const selectedDocument = documentItems.find((item) => item.id === documentId);
  const needsDocumentPick = focusMode === 'agentDocument' && !documentId;
  const showWritingHint = focusMode === 'agentWriting';
  const heading = selectedDocument
    ? selectedDocument.title
    : focusDescriptions[focusMode] || 'Research begins here.';
  const subheading = selectedDocument?.description;

  return (
    <div className="relative h-full min-h-full">
      <WritingLeftRail />

      <div className="absolute w-full flex flex-row items-center justify-end gap-1 mr-5 pr-2 top-[var(--chat-topbar-height)]">
        <SettingsButtonMobile />
      </div>
      <div className="empty-chat-body flex flex-col items-center justify-center min-h-full mx-auto p-2 pb-28 lg:pb-2">
        <div
          className={`welcome-wiki${showWritingHint ? ' writing-welcome' : ''}`}
        >
          {showWritingHint ? null : <h2>{heading}</h2>}
          {!showWritingHint && subheading ? <p>{subheading}</p> : null}
          {needsDocumentPick ? (
            <DocumentPicker />
          ) : showWritingHint ? (
            <WritingHtmlHint />
          ) : (
            <EmptyChatMessageInput />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmptyChat;
