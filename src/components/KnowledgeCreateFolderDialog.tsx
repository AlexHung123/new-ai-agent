'use client';

import { useEffect, useId, useState } from 'react';
import { Globe, Lock, X } from 'lucide-react';
import type { KnowledgeLibrary } from '@/lib/knowledge/library';

type Props = {
  open: boolean;
  canWritePublic: boolean;
  defaultLibrary?: KnowledgeLibrary;
  currentPath?: string;
  onClose: () => void;
  onCreate: (input: { name: string; library: KnowledgeLibrary }) => Promise<void> | void;
};

export default function KnowledgeCreateFolderDialog({
  open,
  canWritePublic,
  defaultLibrary = 'private',
  currentPath,
  onClose,
  onCreate,
}: Props) {
  const titleId = useId();
  const [name, setName] = useState('');
  const [library, setLibrary] = useState<KnowledgeLibrary>(defaultLibrary);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setError(null);
    setBusy(false);
    setLibrary(
      defaultLibrary === 'public' && canWritePublic ? 'public' : 'private',
    );
  }, [open, defaultLibrary, canWritePublic]);

  if (!open) return null;

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a folder name.');
      return;
    }
    if (library === 'public' && !canWritePublic) {
      setError('Only a knowledge curator can create shared folders.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate({ name: trimmed, library });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create folder');
      setBusy(false);
    }
  };

  return (
    <div className="knowledge-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="knowledge-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="knowledge-dialog-header">
          <div>
            <h2 id={titleId}>Create folder</h2>
            <p>
              {currentPath
                ? `New folder inside ${currentPath}`
                : 'Add a folder to your Knowledge library.'}
            </p>
          </div>
          <button type="button" className="knowledge-dialog-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <label className="knowledge-dialog-field">
          <span>Folder name</span>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void submit();
              }
            }}
            placeholder="e.g. Contracts"
          />
        </label>
        <fieldset className="knowledge-visibility">
          <legend>Visibility</legend>
          <div className="knowledge-visibility-grid">
            <button
              type="button"
              className={`knowledge-visibility-card${library === 'private' ? ' is-selected' : ''}`}
              onClick={() => setLibrary('private')}
            >
              <Lock size={16} aria-hidden />
              <span>
                <strong>Private</strong>
                <em>Only you can see and edit this folder.</em>
              </span>
            </button>
            <button
              type="button"
              className={`knowledge-visibility-card${library === 'public' ? ' is-selected' : ''}${
                canWritePublic ? '' : ' is-disabled'
              }`}
              onClick={() => canWritePublic && setLibrary('public')}
              disabled={!canWritePublic}
              title={
                canWritePublic
                  ? undefined
                  : 'Only a knowledge curator can create shared folders.'
              }
            >
              <Globe size={16} aria-hidden />
              <span>
                <strong>Public</strong>
                <em>
                  {canWritePublic
                    ? 'Shared with all signed-in users.'
                    : 'Only a knowledge curator can create shared folders.'}
                </em>
              </span>
            </button>
          </div>
        </fieldset>
        {error ? <p className="knowledge-dialog-error">{error}</p> : null}
        <div className="knowledge-dialog-actions">
          <button type="button" className="knowledge-btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="knowledge-btn" onClick={() => void submit()} disabled={busy}>
            {busy ? 'Creating…' : 'Create folder'}
          </button>
        </div>
      </div>
    </div>
  );
}
