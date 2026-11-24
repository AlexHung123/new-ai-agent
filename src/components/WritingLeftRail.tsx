'use client';

import { motion } from 'framer-motion';
import { useChat } from '@/lib/hooks/useChat';
import { isKnowledgeFocusMode } from '@/lib/agents';
import AgentCard from './AgentCard';
import WritingKnowledgeFiles from './WritingKnowledgeFiles';

const WritingLeftRail = () => {
  const { focusMode } = useChat();
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
      className="writing-left-rail"
    >
      <AgentCard />
      {isKnowledgeFocusMode(focusMode) ? <WritingKnowledgeFiles /> : null}
    </motion.div>
  );
};

export default WritingLeftRail;
