import EmptyChatMessageInput from './EmptyChatMessageInput';
import SettingsButtonMobile from '@/components/Settings/SettingsButtonMobile';
import { useChat } from '@/lib/hooks/useChat';
import { SFC_DOCUMENT_FOCUS_MODE, SFC_REPLY_FOCUS_MODE } from '@/lib/agents';
import DocumentPicker from './DocumentPicker';
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
    agentWriting:
      'Your assistant for drafting, rewriting, and polishing text',
    agentDocument: 'Ask about a selected policy document',
  };

  const selectedDocument = documentItems.find((item) => item.id === documentId);
  const needsDocumentPick = focusMode === 'agentDocument' && !documentId;
  const heading = selectedDocument
    ? selectedDocument.title
    : focusDescriptions[focusMode] || 'Research begins here.';
  const subheading = selectedDocument?.description;

  return (
    <div className="relative">
      <WritingLeftRail />

      <div className="absolute w-full flex flex-row items-center justify-end mr-5 mt-5">
        <SettingsButtonMobile />
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen mx-auto p-2 pb-28 lg:pb-2">
        <div className="welcome-wiki">
          <h2>{heading}</h2>
          {subheading ? <p>{subheading}</p> : null}
          {needsDocumentPick ? <DocumentPicker /> : <EmptyChatMessageInput />}
        </div>
      </div>
    </div>
  );
};

export default EmptyChat;
