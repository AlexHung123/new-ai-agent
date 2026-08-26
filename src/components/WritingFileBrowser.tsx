'use client';

import { useState, useRef } from 'react';
import { ChevronRight, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useChat } from '@/lib/hooks/useChat';
import {
  MAX_WRITING_FILES,
  WRITING_ACCEPT,
  filterAllowedWritingFiles,
  formatWritingBytes,
  planWritingUploads,
  writingFileLimitMessage,
  writingUnsupportedTypeMessage,
} from '@/lib/writing/types';
import FileTypeIcon from './FileTypeIcon';

const WritingFileBrowser = ({ compact = false }: { compact?: boolean }) => {
  const {
    focusMode,
    writingFiles,
    uploadWritingFile,
    removeWritingFile,
    requestMention,
  } = useChat();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [filesOpen, setFilesOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (focusMode !== 'agentWriting') return null;

  const atLimit = writingFiles.length >= MAX_WRITING_FILES;

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const typed = filterAllowedWritingFiles(Array.from(list));
    if (typed.rejected > 0) {
      toast.error(writingUnsupportedTypeMessage());
    }
    const { accepted, rejected } = planWritingUploads(
      writingFiles.length,
      typed.accepted,
    );
    if (rejected > 0) {
      toast.error(writingFileLimitMessage());
    }
    accepted.forEach((file) => {
      void uploadWritingFile(file);
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  const mentionFile = (fileId: string, name: string) => {
    requestMention(name);
    setSelectedIds((prev) => (prev.includes(fileId) ? prev : [...prev, fileId]));
  };

  const toggleFile = (fileId: string, name: string) => {
    if (selectedIds.includes(fileId)) {
      setSelectedIds((prev) => prev.filter((id) => id !== fileId));
      return;
    }
    mentionFile(fileId, name);
  };

  const onRemove = (fileId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== fileId));
    void removeWritingFile(fileId);
  };

  return (
    <aside
      className={`writing-file-browser${compact ? ' writing-file-browser-compact' : ''}`}
    >
      <header className="writing-files-header">
        <button
          type="button"
          className="writing-files-toggle"
          onClick={() => setFilesOpen((open) => !open)}
        >
          <ChevronRight
            size={14}
            className={filesOpen ? 'rotated' : undefined}
          />
          <h2>Files</h2>
          <span className="writing-files-count">
            {writingFiles.length}/{MAX_WRITING_FILES}
          </span>
        </button>
        <button
          type="button"
          className="writing-files-upload"
          aria-label="Upload file"
          title={atLimit ? writingFileLimitMessage() : 'Upload files'}
          disabled={atLimit}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={15} />
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={WRITING_ACCEPT}
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </header>

      {filesOpen ? (
        <div className="writing-files-body">
          <div className="writing-files-path">
            <button type="button" className="writing-files-path-up" disabled>
              ..
            </button>
            <span className="writing-files-path-text">/</span>
          </div>
          <ul className="writing-files-list" aria-label="Writing files">
            {writingFiles.length === 0 ? (
              <li className="writing-files-empty">
                Empty — upload files with ↑
              </li>
            ) : (
              writingFiles.map((file) => {
                const uploading = file.status === 'uploading';
                const failed = file.status === 'failed';
                const selected = selectedIds.includes(file.fileId);
                const size = formatWritingBytes(file.sizeBytes);
                return (
                  <li key={file.fileId}>
                    <div
                      className={`writing-file-row${selected ? ' is-selected' : ''}`}
                    >
                      <button
                        type="button"
                        className="writing-file-row-main"
                        onClick={() => mentionFile(file.fileId, file.name)}
                        disabled={uploading}
                        title={file.error || `Mention ${file.name}`}
                      >
                        <FileTypeIcon name={file.name} size={16} />
                        <span className="writing-file-name" title={file.name}>
                          {uploading ? `Uploading… ${file.name}` : file.name}
                        </span>
                        {failed ? (
                          <span className="writing-file-error">失败</span>
                        ) : size ? (
                          <span className="writing-file-meta">{size}</span>
                        ) : null}
                      </button>
                      {!uploading ? (
                        <>
                          <button
                            type="button"
                            className={`writing-file-select${selected ? ' is-selected' : ''}`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              toggleFile(file.fileId, file.name);
                            }}
                            title={
                              selected
                                ? `Deselect ${file.name}`
                                : `Select ${file.name}`
                            }
                            aria-pressed={selected}
                            aria-label={
                              selected
                                ? `Deselect ${file.name}`
                                : `Select ${file.name}`
                            }
                          >
                            <span className="writing-file-sel-dot" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="writing-file-mention"
                            title={`Mention ${file.name}`}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              mentionFile(file.fileId, file.name);
                            }}
                          >
                            @ mention
                          </button>
                          <button
                            type="button"
                            className="writing-file-remove"
                            aria-label={`Delete ${file.name}`}
                            title="Delete"
                            onClick={() => onRemove(file.fileId)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </aside>
  );
};

export default WritingFileBrowser;
