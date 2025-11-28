'use client';

import { useChat } from '@/lib/hooks/useChat';
import { focusModes } from '@/lib/agents';
import Image from 'next/image';

const AgentCard = () => {
  const { focusMode } = useChat();

  // Find the current focus mode details
  const currentFocusMode = focusModes.find((mode) => mode.key === focusMode);

  if (!currentFocusMode) return null;

  return (
    <div className="sticky top-24 hidden lg:block">
      <div className="flex flex-col items-center gap-3 px-4 py-6 rounded-xl border border-light-200 dark:border-dark-200 bg-light-primary dark:bg-dark-primary">
        <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-white dark:bg-black">
          <Image
            src={currentFocusMode.image}
            alt={currentFocusMode.title}
            fill
            sizes="128px"
            className="object-contain"
            priority
          />
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <currentFocusMode.icon size={16} className="text-[#24A0ED] shrink-0" />
            <p className="text-sm font-medium text-black dark:text-white">{currentFocusMode.title}</p>
          </div>
          <p className="text-xs text-black/60 dark:text-white/60">{currentFocusMode.description}</p>
        </div>
      </div>
    </div>
  );
};

export default AgentCard;
