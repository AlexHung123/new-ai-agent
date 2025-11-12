import EmptyChatMessageInput from './EmptyChatMessageInput';
import SettingsButtonMobile from '@/components/Settings/SettingsButtonMobile';
import { useChat } from '@/lib/hooks/useChat';

const EmptyChat = () => {
  const { focusMode } = useChat();

  const focusDescriptions: Record<string, string> = {
    agentData: 'Your assistant for retrieving training data',
    agentGuide: 'You assistant on training policy',
    agentSFC: 'Your assistant for analyzing SFC meetings',
    agentSurvey: 'Your assistant for analyzing class survey',
  };

  const heading = focusDescriptions[focusMode] || 'Research begins here.';

  return (
    <div className="relative">
      <div className="absolute w-full flex flex-row items-center justify-end mr-5 mt-5">
        <SettingsButtonMobile />
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen max-w-screen-sm mx-auto p-2 space-y-4">
        <div className="flex flex-col items-center justify-center w-full space-y-8">
          <h2 className="text-black/70 dark:text-white/70 text-3xl font-medium -mt-8">{heading}</h2>
          <EmptyChatMessageInput />
        </div>
      </div>
    </div>
  );
};

export default EmptyChat;
