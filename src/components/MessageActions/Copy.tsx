import { Check, ClipboardList } from 'lucide-react';
import { Message } from '../ChatWindow';
import { useState } from 'react';
import { Section } from '@/lib/hooks/useChat';

const Copy = ({
  section,
  initialMessage,
}: {
  section: Section;
  initialMessage: string;
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      // Check if Clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for browsers that don't support Clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          return successful;
        } catch (err) {
          document.body.removeChild(textArea);
          return false;
        }
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
      return false;
    }
  };

  return (
    <button
      onClick={async () => {
        const citations = section?.sourceMessage?.sources && section.sourceMessage.sources.length > 0
          ? `\n\nCitations:\n${section.sourceMessage.sources.map((source: any, i: any) => `[${i + 1}] ${source.metadata.url}`).join(`\n`)}`
          : '';
        const contentToCopy = `${initialMessage}${citations}`;
        const success = await copyToClipboard(contentToCopy);
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        }
      }}
      className="p-2 text-black/70 dark:text-white/70 rounded-xl hover:bg-light-secondary dark:hover:bg-dark-secondary transition duration-200 hover:text-black dark:hover:text-white"
    >
      {copied ? <Check size={18} /> : <ClipboardList size={18} />}
    </button>
  );
};

export default Copy;
