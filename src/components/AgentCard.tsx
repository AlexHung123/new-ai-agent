'use client';

import { useChat } from '@/lib/hooks/useChat';
import { focusModes } from '@/lib/agents';
import Image from 'next/image';
import { motion } from 'framer-motion';

const AgentCard = () => {
  const { focusMode } = useChat();

  // Find the current focus mode details
  const currentFocusMode = focusModes.find((mode) => mode.key === focusMode);

  if (!currentFocusMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-[300px] flex flex-col gap-4 p-4 rounded-xl border border-light-200 dark:border-dark-200 bg-light-primary dark:bg-dark-primary shadow-lg"
    >
      <div className="relative w-full h-64 rounded-lg overflow-hidden bg-white dark:bg-black">
        <Image
          src={currentFocusMode.image}
          alt={currentFocusMode.title}
          fill
          sizes="300px"
          className="object-contain"
          priority
        />
      </div>
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-lg bg-blue-50 p-2 text-[#24A0ED] dark:bg-blue-500/10 dark:text-blue-400">
          <currentFocusMode.icon size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-black dark:text-white">
            {currentFocusMode.title}
          </h3>
          <p className="text-sm text-black/60 dark:text-white/60 leading-snug mt-1">
            {currentFocusMode.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AgentCard;