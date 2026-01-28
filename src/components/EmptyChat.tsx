import EmptyChatMessageInput from './EmptyChatMessageInput';
import SettingsButtonMobile from '@/components/Settings/SettingsButtonMobile';
import { useChat } from '@/lib/hooks/useChat';
import AgentCard from './AgentCard';
import { motion } from 'framer-motion';

const EmptyChat = () => {
  const { focusMode } = useChat();

  const focusDescriptions: Record<string, string> = {
    agentData: 'Your assistant for retrieving training data',
    agentGuide: 'You assistant on training policy',
    agentSFC: 'Your assistant for searching SFC questions and replies',
    agentSurvey: 'Your assistant for summarizing survey results',
  };

  const heading = focusDescriptions[focusMode] || 'Research begins here.';

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
          <EmptyChatMessageInput />
        </div>
      </div>
    </div>
  );
};

export default EmptyChat;
