'use client';

import { useChat } from '@/lib/hooks/useChat';
import Image from 'next/image';
import { focusModes } from '@/lib/agents';
import { motion } from 'framer-motion';

const AgentsPage = () => {
  const { setFocusMode } = useChat();

  const handleSelect = (key: string) => {
    setFocusMode(key);
    // Use window.location to force a full page reload and start fresh
    window.location.href = '/itms/ai/';
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-12">
      <div className="mb-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-3xl font-bold text-black dark:text-white md:text-4xl"
        >
          AI Agents
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg text-black/60 dark:text-white/60"
        >
          Please select an AI agent as your assistant.
        </motion.p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
      >
        {focusModes.map((mode) => (
          <motion.button
            key={mode.key}
            variants={item}
            onClick={() => handleSelect(mode.key)}
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            className="group flex flex-col overflow-hidden rounded-2xl border border-light-200 bg-white text-left shadow-sm transition-all hover:shadow-xl dark:border-dark-200 dark:bg-dark-secondary"
          >
            <div className="relative h-64 w-full bg-gray-50 dark:bg-black/20">
              <div className="relative h-full w-full transition-transform duration-500 group-hover:scale-105">
                <Image
                  src={mode.image}
                  alt={mode.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#24A0ED] transition-colors group-hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:group-hover:bg-blue-500/20">
                  <mode.icon size={20} />
                </div>
                <div className="font-semibold text-black dark:text-white">
                  {mode.title}
                </div>
              </div>
              <div className="text-sm leading-relaxed text-black/60 dark:text-white/60">
                {mode.description}
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default AgentsPage;