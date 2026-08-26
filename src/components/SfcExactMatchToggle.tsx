'use client';

import {
  SFC_DOCUMENT_FOCUS_MODE,
  SFC_REPLY_FOCUS_MODE,
  isSfcFocusMode,
} from '@/lib/agents';
import { useChat } from '@/lib/hooks/useChat';
import { motion } from 'framer-motion';

type SfcOption = 'keyword' | 'reply' | 'document';

const OPTIONS: Array<{
  id: SfcOption;
  label: string;
  position: 'first' | 'middle' | 'last';
}> = [
  { id: 'keyword', label: 'Keyword Search', position: 'first' },
  { id: 'reply', label: 'Reply Generation', position: 'middle' },
  { id: 'document', label: 'Document Q&A', position: 'last' },
];

function optionFromFocusMode(focusMode: string): SfcOption {
  if (focusMode === SFC_REPLY_FOCUS_MODE) return 'reply';
  if (focusMode === SFC_DOCUMENT_FOCUS_MODE) return 'document';
  return 'keyword';
}

function optionClass(active: boolean, position: 'first' | 'middle' | 'last') {
  const rounding =
    position === 'first'
      ? 'rounded-s-lg'
      : position === 'last'
        ? 'rounded-e-lg'
        : '';
  const borderL = position === 'first' ? '' : 'border-s-0';
  const tone = active
    ? 'bg-[#24A0ED] text-white border-[#24A0ED]'
    : 'bg-transparent text-[#24A0ED] border-[#24A0ED] hover:bg-[#24A0ED]/10';
  return `px-3 py-1.5 text-xs font-medium whitespace-nowrap border ${rounding} ${borderL} transition-colors ${tone}`;
}

const SfcExactMatchToggle = () => {
  const { focusMode, setFocusMode, setSfcExactMatch } = useChat();

  if (!isSfcFocusMode(focusMode)) {
    return null;
  }

  const selected = optionFromFocusMode(focusMode);

  const handleSelect = (option: SfcOption) => {
    if (option === 'keyword') {
      setSfcExactMatch(true);
      setFocusMode('agentSFC');
      return;
    }
    setSfcExactMatch(false);
    setFocusMode(
      option === 'reply' ? SFC_REPLY_FOCUS_MODE : SFC_DOCUMENT_FOCUS_MODE,
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-center max-w-full"
    >
      <div
        className="inline-flex max-w-full overflow-x-auto rounded-md shadow-sm"
        role="group"
      >
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            className={optionClass(selected === option.id, option.position)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default SfcExactMatchToggle;