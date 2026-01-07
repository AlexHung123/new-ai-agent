'use client';

import { useChat } from '@/lib/hooks/useChat';
import { Switch } from '@headlessui/react';
import { motion } from 'framer-motion';

const SfcExactMatchToggle = () => {
  const { focusMode, sfcExactMatch, setSfcExactMatch } = useChat();

  if (focusMode !== 'agentSFC') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center space-x-2 p-2 bg-light-secondary dark:bg-dark-secondary rounded-lg"
    >
      <Switch
        checked={sfcExactMatch}
        onChange={setSfcExactMatch}
        className={`${sfcExactMatch ? 'bg-blue-600' : 'bg-gray-400'}
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white/75`}
      >
        <span className="sr-only">Use exact match</span>
        <span
          aria-hidden="true"
          className={`${sfcExactMatch ? 'translate-x-5' : 'translate-x-0'}
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
        />
      </Switch>
      <span className="text-sm text-black/70 dark:text-white/70">Exact Match</span>
    </motion.div>
  );
};

export default SfcExactMatchToggle;
