'use client';

import { useChat } from '@/lib/hooks/useChat';
import { findDisplayFocusMode } from '@/lib/agents';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { UsersRound } from 'lucide-react';

const AgentCard = () => {
  const { focusMode, documentId, documentItems } = useChat();

  const currentFocusMode = findDisplayFocusMode(focusMode) || {
    title: 'Agent SFC',
    description: 'Your assistant for searching SFC questions and replies',
    icon: UsersRound,
    image: '/itms/ai/agent_sfc.png',
  };
  const selectedDocument = documentItems.find((item) => item.id === documentId);
  const description = selectedDocument
    ? `${selectedDocument.title} — ${selectedDocument.description}`
    : currentFocusMode.description;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="agent-card flex flex-col rounded-xl border border-light-200 dark:border-dark-200 bg-light-primary dark:bg-dark-primary shadow-lg"
    >
      <div className="agent-card-art relative w-full rounded-lg overflow-hidden bg-white dark:bg-black">
        <Image
          src={currentFocusMode.image}
          alt={currentFocusMode.title}
          fill
          sizes="(min-width: 1536px) 300px, 200px"
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
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AgentCard;