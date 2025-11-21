import {
  Globe,
  Book,
  UsersRound,
  NotepadText,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import { Fragment } from 'react';
import { useChat } from '@/lib/hooks/useChat';

const focusModes = [
  {
    key: 'agentData',
    title: 'Agent Data',
    description: 'Your assistant for retrieving training data',
    icon: <Database size={16} />,
  },
  {
    key: 'agentGuide',
    title: 'Agent Guide',
    description: 'You assistant on training policy',
    icon: <Book size={16} />,
  },
  {
    key: 'agentSFC',
    title: 'Agent SFC',
    description: 'Your assistant for analyzing SFC meetings',
    icon: <UsersRound size={16} />,
  },
  {
    key: 'agentSurvey',
    title: 'Agent Survey',
    description: 'Your assistant for analyzing survey response',
    icon: <NotepadText size={16} />,
  },
];

const Focus = () => {
  const { focusMode, setFocusMode } = useChat();

  return (
    <Popover className="relative w-full max-w-[15rem] md:max-w-md lg:max-w-lg">
      <PopoverButton
        type="button"
        className="active:border-none hover:bg-light-200 hover:dark:bg-dark-200 p-2 rounded-lg focus:outline-none headless-open:text-black dark:headless-open:text-white text-black/50 dark:text-white/50 active:scale-95 transition duration-200 hover:text-black dark:hover:text-white"
      >
        {focusMode !== 'webSearch' ? (
          <div className="flex flex-row items-center space-x-1">
            {focusModes.find((mode) => mode.key === focusMode)?.icon}
          </div>
        ) : (
          <div className="flex flex-row items-center space-x-1">
            <Globe size={16} />
          </div>
        )}
      </PopoverButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <PopoverPanel className="absolute z-10 w-64 md:w-[500px] -right-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-light-primary dark:bg-dark-primary border rounded-lg border-light-200 dark:border-dark-200 w-full p-4 max-h-[200px] md:max-h-none overflow-y-auto">
            {focusModes.map((mode, i) => (
              <PopoverButton
                onClick={() => setFocusMode(mode.key)}
                key={i}
                className={cn(
                  'p-2 rounded-lg flex flex-col items-start justify-start text-start space-y-2 duration-200 cursor-pointer transition focus:outline-none',
                  focusMode === mode.key
                    ? 'bg-light-secondary dark:bg-dark-secondary'
                    : 'hover:bg-light-secondary dark:hover:bg-dark-secondary',
                )}
              >
                <div
                  className={cn(
                    'flex flex-row items-center space-x-1',
                    focusMode === mode.key
                      ? 'text-[#24A0ED]'
                      : 'text-black dark:text-white',
                  )}
                >
                  {mode.icon}
                  <p className="text-sm font-medium">{mode.title}</p>
                </div>
                <p className="text-black/70 dark:text-white/70 text-xs">
                  {mode.description}
                </p>
              </PopoverButton>
            ))}
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  );
};

export default Focus;
