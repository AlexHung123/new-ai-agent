'use client';

import { useChat } from '@/lib/hooks/useChat';
import { motion } from 'framer-motion';

const SfcExactMatchToggle = () => {
  const { focusMode, setFocusMode, sfcExactMatch, setSfcExactMatch } = useChat();

  if (focusMode !== 'agentSFC' && focusMode !== 'newSfcAgent') {
    return null;
  }

  const handleToggle = (checked: boolean) => {
    setSfcExactMatch(checked);
    if (checked) {
      setFocusMode('agentSFC');
    } else {
      setFocusMode('newSfcAgent');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-center my-2"
    >
      <div className="inline-flex rounded-md shadow-sm" role="group">
        <button
          type="button"
          onClick={() => handleToggle(true)}
          className={`px-4 py-2 text-sm font-medium border rounded-s-lg transition-colors ${
            sfcExactMatch
              ? 'bg-[#24A0ED] text-white border-[#24A0ED]'
              : 'bg-transparent text-[#24A0ED] border-[#24A0ED] hover:bg-[#24A0ED]/10'
          }`}
        >
          Keyword Search
        </button>
        <button
          type="button"
          onClick={() => handleToggle(false)}
          className={`px-4 py-2 text-sm font-medium border border-s-0 rounded-e-lg transition-colors ${
            !sfcExactMatch
              ? 'bg-[#24A0ED] text-white border-[#24A0ED]'
              : 'bg-transparent text-[#24A0ED] border-[#24A0ED] hover:bg-[#24A0ED]/10'
          }`}
        >
          Reply Generation
        </button>
      </div>
    </motion.div>
  );
};

export default SfcExactMatchToggle;
