'use client';

import { useRef } from 'react';
import {
  ChevronDown,
  File,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import { useChat } from '@/lib/hooks/useChat';
import { fileExtension } from '@/lib/writing/types';

function FileGlyph({ name }: { name: string }) {
  const ext = fileExtension(name);
  if (['xls', 'xlsx', 'xlsm', 'xlsb', 'csv', 'ods'].includes(ext)) {
    return <FileSpreadsheet size={16} />;
  }
  if (['doc', 'docx', 'docm', 'odt', 'rtf', 'pdf'].includes(ext)) {
    return <FileText size={16} />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
    return <ImageIcon size={16} />;
  }
  if (['sh', 'py', 'js', 'ts', 'json', 'yml', 'yaml', 'pi'].includes(ext)) {
    return <FileCode size={16} />;
  }
  return <File size={16} />;
}

const WritingFileBrowser = ({ compact = false }: { compact?: boolean }) => {
  const {
    focusMode,
    writingFiles,
    refreshWritingFiles,
    uploadWritingFile,
    removeWritingFile,
    requestMention,
  } = useChat();
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (focusMode !== 'agentWriting') return null;

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    Array.from(list).forEach((file) => {
      void uploadWritingFile(file);
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <aside
      className={`writing-file-browser${compact ? ' writing-file-browser-compact' : ''}`}
    >
      <header className="writing-file-browser-head">
        <span className="writing-file-browser-title">
          <ChevronDown size={14} />
          文件浏览器
        </span>
        <span className="writing-file-browser-actions">
          <button
            type="button"
            aria-label="Upload file"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={15} />
          </button>
          <button
            type="button"
            aria-label="Refresh files"
            onClick={() => void refreshWritingFiles()}
          >
            <RefreshCw size={15} />
          </button>
        </span>
      </header>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      <ul className="writing-file-browser-list">
        {writingFiles.length === 0 ? (
          <li className="writing-file-browser-empty">还没有文件。点击上传。</li>
        ) : (
          writingFiles.map((file) => (
            <li key={file.fileId}>
              <button
                type="button"
                className="writing-file-browser-item"
                onClick={() => requestMention(file.name)}
                disabled={file.status === 'uploading'}
                title={file.error || file.name}
              >
                <FileGlyph name={file.name} />
                <span className="writing-file-browser-name">
                  {file.status === 'uploading' ? `上传中… ${file.name}` : file.name}
                </span>
                {file.status === 'failed' ? (
                  <span className="writing-file-browser-error">失败</span>
                ) : null}
              </button>
              {file.status !== 'uploading' ? (
                <button
                  type="button"
                  className="writing-file-browser-remove"
                  aria-label={`Delete ${file.name}`}
                  onClick={() => void removeWritingFile(file.fileId)}
                >
                  <X size={12} />
                </button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </aside>
  );
};

export default WritingFileBrowser;
