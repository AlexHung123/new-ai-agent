'use client';
import { Book, Database, NotepadText, UsersRound } from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const focusModes = [
  {
    key: 'agentData',
    title: 'Agent Data',
    description: 'Your assistant for retrieving training data',
    icon: <Database size={20} />,
    image: '/itms/ai/agent_data.png',
  },
  {
    key: 'agentGuide',
    title: 'Agent Guide',
    description: 'You assistant on training policy',
    icon: <Book size={20} />,
    image: '/itms/ai/agent_guide.png',
  },
  {
    key: 'agentSFC',
    title: 'Agent SFC',
    description: 'Your assistant for analyzing SFC meetings',
    icon: <UsersRound size={20} />,
    image: '/itms/ai/agent_sfc.png',
  },
  {
    key: 'agentSurvey',
    title: 'Agent Survey',
    description: 'Your assistant for analyzing SFC meetings',
    icon: <NotepadText size={20} />,
    image: '/itms/ai/agent_survey.png',
  },
];

const AgentsPage = () => {
  const { setFocusMode } = useChat();
  const router = useRouter();

  const handleSelect = (key: string) => {
    setFocusMode(key);
    // Use window.location to force a full page reload and start fresh
    window.location.href = '/itms/ai/';
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-lg md:text-xl font-semibold text-black dark:text-white">AI Agents</h1>
        <p className="text-sm text-black/60 dark:text-white/60">Please select an AI agent as your assistant.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {focusModes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => handleSelect(mode.key)}
            className="flex flex-col items-stretch gap-3 p-4 rounded-xl border border-light-200 dark:border-dark-200 bg-light-primary dark:bg-dark-primary hover:bg-light-secondary dark:hover:bg-dark-secondary transition-colors text-left"
          >
            <div className="relative w-full h-44 md:h-52 rounded-lg overflow-hidden bg-white dark:bg-black">
              <Image
                src={mode.image}
                alt={mode.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
                priority={false}
              />
            </div>
            <div className="min-w-0 flex items-start gap-2">
              <div className="shrink-0 text-[#24A0ED]">{mode.icon}</div>
              <div className="min-w-0">
                <div className="font-medium text-black dark:text-white">{mode.title}</div>
                <div className="text-xs text-black/60 dark:text-white/60 truncate">{mode.description}</div>
                {/* <div className="mt-1 text-[10px] text-black/50 dark:text-white/50">點擊進入</div> */}
              </div>
            </div>            
          </button>
        ))}
      </div>
    </div>
  );
};

export default AgentsPage;

