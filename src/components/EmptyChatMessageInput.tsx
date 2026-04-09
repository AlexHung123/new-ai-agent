import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
// import Focus from './MessageInputActions/Focus';
// import Optimization from './MessageInputActions/Optimization';
// // import Attach from './MessageInputActions/Attach';
import { useChat } from '@/lib/hooks/useChat';
import ModelSelector from './MessageInputActions/ChatModelSelector';
import { focusModes } from '@/lib/agents';
import SfcExactMatchToggle from './SfcExactMatchToggle';
import SfcTrainingRelatedToggle from './SfcTrainingRelatedToggle';

const EmptyChatMessageInput = () => {
  const { sendMessage, focusMode, sfcExactMatch } = useChat();

  /* const [copilotEnabled, setCopilotEnabled] = useState(false); */
  const [message, setMessage] = useState('');
  const [aspect, setAspect] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('agentImageAspect') || '1:1';
    }
    return '1:1';
  });

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const currentAgent = focusModes.find((mode) => mode.key === focusMode);
  let placeholder = currentAgent?.placeholder || 'Ask anything...';

  if (focusMode === 'agentSFC' && sfcExactMatch) {
    placeholder = 'Search exact wording ...';
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;

      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.hasAttribute('contenteditable');

      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    inputRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (typeof window !== 'undefined' && focusMode === 'agentImage') {
          localStorage.setItem('agentImageAspect', aspect);
        }
        sendMessage(message);
        setMessage('');
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (typeof window !== 'undefined' && focusMode === 'agentImage') {
            localStorage.setItem('agentImageAspect', aspect);
          }
          sendMessage(message);
          setMessage('');
        }
      }}
      className="w-full"
    >
      <div className="flex flex-col bg-light-secondary dark:bg-dark-secondary px-3 pt-5 pb-3 rounded-2xl w-full border border-light-200 dark:border-dark-200 shadow-sm shadow-light-200/10 dark:shadow-black/20 transition-all duration-200 focus-within:border-light-300 dark:focus-within:border-dark-300">
        <TextareaAutosize
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          minRows={2}
          className="px-2 bg-transparent placeholder:text-[15px] placeholder:text-black/50 dark:placeholder:text-white/50 text-sm text-black dark:text-white resize-none focus:outline-none w-full max-h-24 lg:max-h-36 xl:max-h-48"
          placeholder={placeholder}
        />
        <div className="flex flex-row items-center justify-end mt-4">
          <SfcExactMatchToggle />
          <SfcTrainingRelatedToggle />
          {/* <Optimization /> */}
          <div className="flex flex-row items-center space-x-2">
            {focusMode === 'agentImage' && (
              <select
                value={aspect}
                onChange={(e) => setAspect(e.target.value)}
                className="mx-2 rounded-lg border border-light-200 dark:border-dark-200 bg-light-primary dark:bg-dark-primary text-sm px-2 py-1 text-black dark:text-white"
              >
                <option value="1:1">1:1</option>
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="4:3">4:3</option>
                <option value="3:2">3:2</option>
                <option value="594:295">594:295</option>
                <option value="295:295">295:295</option>
                <option value="952:320">952:320</option>
              </select>
            )}
            <div className="flex flex-row items-center space-x-1">
              <ModelSelector />
              {/* <Focus /> */}
              {/* <Attach /> */}
            </div>
            <button
              disabled={message.trim().length === 0}
              className="bg-sky-500 text-white disabled:text-black/50 dark:disabled:text-white/50 disabled:bg-[#e0e0dc] dark:disabled:bg-[#ececec21] hover:bg-opacity-85 transition duration-100 rounded-full p-2"
            >
              <ArrowRight className="bg-background" size={17} />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default EmptyChatMessageInput;
