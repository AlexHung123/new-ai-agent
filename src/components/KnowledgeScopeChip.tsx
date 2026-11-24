'use client';

import { Globe, Lock, X } from 'lucide-react';
import { parseKnowledgePin, pinTitle } from '@/lib/knowledge/library';

type Props = {
  pin: string | null;
  wiki?: boolean;
  onClear: () => void;
};

export default function KnowledgeScopeChip({ pin, wiki, onClear }: Props) {
  const parsed = parseKnowledgePin(pin);
  if (!parsed?.path) return null;
  const isPublic = parsed.library === 'public';
  return (
    <div className="knowledge-scope-chip" aria-label="Pinned folder">
      <span className="knowledge-scope-chip-icon" aria-hidden>
        {isPublic ? <Globe size={13} /> : <Lock size={13} />}
      </span>
      <span className="knowledge-scope-chip-text">
        <span className="knowledge-scope-chip-label">
          {isPublic ? 'Public' : 'Private'}
        </span>
        <span className="knowledge-scope-chip-name">{pinTitle(parsed)}</span>
        {wiki ? <span className="knowledge-scope-chip-badge">Structured</span> : null}
      </span>
      <button type="button" onClick={onClear} aria-label="Unpin folder" title="Unpin folder">
        <X size={13} />
      </button>
    </div>
  );
}
