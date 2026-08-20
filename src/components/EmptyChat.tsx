import EmptyChatMessageInput from './EmptyChatMessageInput';
import SettingsButtonMobile from '@/components/Settings/SettingsButtonMobile';
import { useChat } from '@/lib/hooks/useChat';
import AgentCard from './AgentCard';
import DocumentPicker from './DocumentPicker';
import { motion } from 'framer-motion';

const EmptyChat = () => {
  const { focusMode, documentId, documentItems } = useChat();

  const focusDescriptions: Record<string, string> = {
    agentGuide: 'You assistant on training policy',
    agentSFC: 'Your assistant for searching SFC questions and replies',
    newSfcAgent: 'Your assistant for searching SFC questions and replies',
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
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
        className="fixed left-20 top-24 z-30 ml-4 hidden xl:block"
      >
        <AgentCard />
      </motion.div>

      <div className="absolute w-full flex flex-row items-center justify-end mr-5 mt-5">
        <SettingsButtonMobile />
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen max-w-screen-sm mx-auto p-2 space-y-4">
        <div className="flex flex-col items-center justify-center w-full space-y-8">
          <h2 className="text-black/70 dark:text-white/70 text-3xl font-medium -mt-8">
            {heading}
          </h2>
          {subheading ? (
            <p className="text-sm text-black/50 dark:text-white/50 -mt-4 text-center">
              {subheading}
            </p>
          ) : null}
          {needsDocumentPick ? (
            <DocumentPicker />
          ) : (
            <EmptyChatMessageInput />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmptyChat;
