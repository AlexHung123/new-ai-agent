'use client';

import { useChat } from '@/lib/hooks/useChat';
import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const DocumentPicker = () => {
  const { documentItems, setDocumentId } = useChat();

  if (documentItems.length === 0) {
    return (
      <p className="text-sm text-black/60 dark:text-white/60 text-center">
        No documents are available yet.
      </p>
    );
  }

  return (
    <ul className="w-full flex flex-col gap-3" aria-label="Documents">
      {documentItems.map((item) => (
        <li key={item.id}>
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setDocumentId(item.id)}
            className="w-full text-left rounded-xl border border-light-200 dark:border-dark-200 bg-light-primary dark:bg-dark-primary px-4 py-3 hover:border-[#24A0ED] transition-colors"
          >
            <span className="flex items-start gap-3">
              <span className="shrink-0 rounded-lg bg-blue-50 p-2 text-[#24A0ED] dark:bg-blue-500/10 dark:text-blue-400">
                <FileText size={18} />
              </span>
              <span>
                <span className="block font-semibold text-black dark:text-white">
                  {item.title}
                </span>
                <span className="block text-sm text-black/60 dark:text-white/60 mt-1">
                  {item.description}
                </span>
              </span>
            </span>
          </motion.button>
        </li>
      ))}
    </ul>
  );
};

export default DocumentPicker;
