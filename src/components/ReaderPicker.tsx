'use client';

import { useRef, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useChat } from '@/lib/hooks/useChat';
import {
  MAX_READING_FILES,
  READING_ACCEPT,
  formatReadingBytes,
  isPdfFilename,
  readingFileLimitMessage,
  readingUnsupportedTypeMessage,
} from '@/lib/reading/types';

const ReaderPicker = () => {
  const {
    readingFiles,
    setDocumentId,
    uploadReadingFile,
    removeReadingFile,
  } = useChat();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const onFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const file = list[0];
    if (!isPdfFilename(file.name)) {
      toast.error(readingUnsupportedTypeMessage());
      return;
    }
    if (readingFiles.length >= MAX_READING_FILES) {
      toast.error(readingFileLimitMessage());
      return;
    }
    void uploadReadingFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="reader-picker" aria-label="PDFs">
      <button
        type="button"
        className={`reader-dropzone${dragOver ? ' is-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFiles(e.dataTransfer.files);
        }}
      >
        <Upload size={18} />
        <span>Upload a PDF</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={READING_ACCEPT}
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />

      {readingFiles.length > 0 ? (
        <ul className="reader-file-list">
          {readingFiles.map((file) => (
            <li key={file.fileId}>
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  if (file.status === 'ready' || file.status === 'failed') {
                    setDocumentId(file.fileId);
                  }
                }}
                disabled={file.status === 'uploading'}
                className="reader-file-row"
              >
                <span className="reader-file-icon">
                  <FileText size={18} />
                </span>
                <span className="reader-file-meta">
                  <span className="reader-file-name">{file.name}</span>
                  <span className="reader-file-sub">
                    {file.status === 'uploading'
                      ? 'Uploading…'
                      : file.status === 'failed'
                        ? file.error || 'Text extraction failed'
                        : formatReadingBytes(file.sizeBytes)}
                  </span>
                </span>
              </motion.button>
              {file.status !== 'uploading' ? (
                <button
                  type="button"
                  className="reader-file-remove"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => void removeReadingFile(file.fileId)}
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="reader-picker-empty">No PDFs uploaded yet.</p>
      )}
    </div>
  );
};

export default ReaderPicker;
