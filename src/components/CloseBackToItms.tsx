'use client';

import { closeBackToItms } from '@/lib/html/closeBackToItms';

export default function CloseBackToItms() {
  const close = () => {
    closeBackToItms({
      embedded: window.parent !== window,
      historyLength: window.history.length,
      post: (message) => window.parent.postMessage(message, '*'),
      back: () => window.history.back(),
      closeWindow: () => window.close(),
    });
  };

  return (
    <button
      type="button"
      className="html-close-itms"
      onClick={close}
      title="Close and back to iTMS"
      aria-label="Close and back to iTMS"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}
