import EmptyChatMessageInput from './EmptyChatMessageInput';
import SettingsButtonMobile from '@/components/Settings/SettingsButtonMobile';
import { useChat } from '@/lib/hooks/useChat';
import { SFC_DOCUMENT_FOCUS_MODE, SFC_REPLY_FOCUS_MODE } from '@/lib/agents';
import AgentCard from './AgentCard';
import DocumentPicker from './DocumentPicker';
import ReaderPicker from './ReaderPicker';
import WritingFileBrowser from './WritingFileBrowser';
import { motion } from 'framer-motion';

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
    agentReader: 'Read a PDF and ask about selected passages',
  };

  const selectedDocument = documentItems.find((item) => item.id === documentId);
  const needsDocumentPick = focusMode === 'agentDocument' && !documentId;
  const needsReaderPick = focusMode === 'agentReader' && !documentId;
  const heading = selectedDocument
    ? selectedDocument.title
    : focusDescriptions[focusMode] || 'Research begins here.';
  const subheading = selectedDocument?.description;

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
        className="fixed left-20 top-24 z-30 ml-4 hidden xl:block"
      >
        <AgentCard />
      </motion.div>

      {focusMode === 'agentWriting' ? (
        <div className="writing-file-browser-chat">
          <WritingFileBrowser />
        </div>
      ) : null}

      <div className="absolute w-full flex flex-row items-center justify-end mr-5 mt-5">
        <SettingsButtonMobile />
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen mx-auto p-2 pb-28 lg:pb-2">
        <div className="welcome-wiki">
          <h2>{heading}</h2>
          {subheading ? <p>{subheading}</p> : null}
          {needsDocumentPick ? (
            <DocumentPicker />
          ) : needsReaderPick ? (
            <ReaderPicker />
          ) : (
            <EmptyChatMessageInput />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmptyChat;
