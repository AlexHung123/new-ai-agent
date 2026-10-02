'use client';

import { motion } from 'framer-motion';
import AgentCard from './AgentCard';
import WritingFileBrowser from './WritingFileBrowser';

const WritingLeftRail = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
      className="writing-left-rail"
    >
      <AgentCard />
      <WritingFileBrowser />
    </motion.div>
  );
};

export default WritingLeftRail;
