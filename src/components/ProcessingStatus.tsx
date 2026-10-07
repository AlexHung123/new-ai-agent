'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  liveProcessingCopy,
  type AgentProcessState,
} from '@/lib/chat/agentProcess';

type Props = {
  loading: boolean;
  process: AgentProcessState | null;
};

export default function ProcessingStatus({ loading, process }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [loading]);

  const copy = liveProcessingCopy({
    loading,
    process,
    now,
  });
  if (!copy.show) return null;

  return (
    <div className="processing-status" role="status" aria-live="polite">
      <Loader2 size={16} className="processing-status-spinner" aria-hidden />
      <div className="processing-status-text">
        <span className="processing-status-title">{copy.title}</span>
        {copy.detail ? (
          <span className="processing-status-detail">{copy.detail}</span>
        ) : null}
      </div>
    </div>
  );
}
