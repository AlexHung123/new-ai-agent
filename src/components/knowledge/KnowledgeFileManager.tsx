'use client';

import KnowledgeListing from '@/components/knowledge/KnowledgeListing';
import KnowledgePreview from '@/components/knowledge/KnowledgePreview';
import KnowledgeTree from '@/components/knowledge/KnowledgeTree';
import {
  KNOWLEDGE_ACCEPT,
  KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE,
  isAllowedKnowledgeFilename,
} from '@/lib/knowledge/filenames';
import {
  childrenAtPath,
  fileCountInNode,
  fileTaskIds,
  findFileForSearchHit,
  nodeAtPath,
} from '@/lib/knowledge/tree';
import {
  folderAvatarColor,
  folderInitial,
  formatStorageBytes,
  type KnowledgeStorageUsage,
} from '@/lib/knowledge/storage';
import {
  buildRelativePath,
  joinKnowledgePath,
  sanitizePathSegment,
} from '@/lib/knowledge/paths';
import type {
  KnowledgeFileMeta,
  KnowledgeSearchHit,
  KnowledgeSearchMode,
  KnowledgeTask,
  KnowledgeTreeNode,
} from '@/lib/knowledge/types';
import { getAuthBearerHeaders, getAuthHeaders } from '@/lib/utils/auth';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { toast } from 'sonner';

const TREE_URL = '/itms/ai/api/knowledge/tree';
const FOLDERS_URL = '/itms/ai/api/knowledge/folders';
const FILES_URL = '/itms/ai/api/knowledge/files';

const EMPTY_TREE: KnowledgeTreeNode = {
  type: 'dir',
  name: '',
  path: '',
  children: [],
};

function StorageBar({ storage }: { storage: KnowledgeStorageUsage | null }) {
  if (!storage) return null;
  const tone =
    storage.remainingBytes <= 0 || storage.usageRatio >= 0.95
      ? ' knowledge-storage-bar-critical'
      : storage.usageRatio >= 0.8
        ? ' knowledge-storage-bar-warn'
        : '';
  return (
    <div className={`knowledge-storage-bar${tone}`}>
      <div className="knowledge-storage-bar-head">
        <span className="knowledge-storage-bar-label">Storage</span>
        <span className="knowledge-storage-bar-values">
          {formatStorageBytes(storage.usedBytes)} /{' '}
          {formatStorageBytes(storage.quotaBytes)}
          <span className="knowledge-storage-bar-remaining">
            · {formatStorageBytes(storage.remainingBytes)} free
          </span>
        </span>
      </div>
      <div className="knowledge-storage-track" aria-hidden>
        <div
          className="knowledge-storage-fill"
          style={{
            width: `${Math.min(100, Math.round(storage.usageRatio * 100))}%`,
          }}
        />
      </div>
      <p className="knowledge-storage-hint">
        Quota is the total for all your uploaded files combined, not a
        single-file limit.
      </p>
    </div>
  );
}

export default function KnowledgeFileManager() {
  const [tree, setTree] = useState<KnowledgeTreeNode>(EMPTY_TREE);
  const [storage, setStorage] = useState<KnowledgeStorageUsage | null>(null);
  const [currentPath, setCurrentPath] = useState('');
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [tasks, setTasks] = useState<Record<string, KnowledgeTask>>({});
  const [searchDraft, setSearchDraft] = useState('');
  const [searchMode, setSearchMode] = useState<KnowledgeSearchMode>('search');
  const [hits, setHits] = useState<KnowledgeSearchHit[] | null>(null);
  const [previewMarkdown, setPreviewMarkdown] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const startedAt = useRef<Record<string, number>>({});

  const loadTree = useCallback(async () => {
    const res = await fetch(TREE_URL, { headers: getAuthHeaders() });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBannerError(
        typeof body.message === 'string'
          ? body.message
          : 'Knowledge service is unavailable.',
      );
      return;
    }
    setBannerError(null);
    const nextTree = body.tree || EMPTY_TREE;
    setTree(nextTree);
    if (body.storage) setStorage(body.storage);
    const ids = fileTaskIds(nextTree);
    if (ids.length === 0) return;
    setTasks((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of ids) {
        if (!next[id]) {
          next[id] = {
            id,
            user_id: '',
            kind: '',
            file_id: '',
            status: 'pending',
            stage: null,
            last_error: null,
          };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  useEffect(() => {
    const pending = Object.values(tasks).filter(
      (task) =>
        task.status !== 'succeeded' &&
        task.status !== 'failed' &&
        task.status !== 'timed_out',
    );
    if (pending.length === 0) return;
    const timer = window.setInterval(async () => {
      for (const task of pending) {
        const started = startedAt.current[task.id] || Date.now();
        startedAt.current[task.id] = started;
        if (Date.now() - started > 120_000) {
          setTasks((prev) => {
            const current = prev[task.id];
            if (
              !current ||
              current.status === 'succeeded' ||
              current.status === 'failed' ||
              current.status === 'timed_out'
            ) {
              return prev;
            }
            return {
              ...prev,
              [task.id]: { ...current, status: 'timed_out' },
            };
          });
          continue;
        }
        const res = await fetch(
          `/itms/ai/api/knowledge/tasks/${encodeURIComponent(task.id)}`,
          { headers: getAuthHeaders() },
        );
        if (!res.ok) continue;
        const body = await res.json();
        if (body.task) {
          setTasks((prev) => ({ ...prev, [body.task.id]: body.task }));
        }
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [tasks]);

  const items = useMemo(
    () => childrenAtPath(tree, currentPath),
    [tree, currentPath],
  );

  const listingItems = useMemo(() => {
    const q = searchDraft.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, searchDraft]);

  const currentNode = useMemo(
    () => (currentPath ? nodeAtPath(tree, currentPath) : null),
    [tree, currentPath],
  );

  const clearPreview = () => {
    setPreviewMarkdown(null);
    setPreviewError(null);
    setPreviewTitle(null);
  };

  const selectFolder = (path: string) => {
    setCurrentPath(path);
    setHits(null);
    clearPreview();
  };

  const createFolder = async () => {
    const segment = sanitizePathSegment(newFolderName);
    if (!segment) return;
    const path = joinKnowledgePath(currentPath, segment);
    const res = await fetch(FOLDERS_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ path }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(
        typeof body.message === 'string' ? body.message : 'Could not create folder',
      );
      return;
    }
    setNewFolderName('');
    setNewFolderOpen(false);
    await loadTree();
    selectFolder(path);
  };

  const uploadFiles = async (folderPath: string, list: FileList | File[]) => {
    if (storage && storage.remainingBytes <= 0) {
      toast.error('Storage full — delete files or ask an admin to raise your quota');
      return;
    }
    const files = Array.from(list);
    for (const file of files) {
      if (!isAllowedKnowledgeFilename(file.name)) {
        toast.error(KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE);
        continue;
      }
      const form = new FormData();
      form.set('file', file, file.name);
      form.set('relative_path', buildRelativePath(folderPath, file.name));
      const res = await fetch(FILES_URL, {
        method: 'POST',
        headers: getAuthBearerHeaders(),
        body: form,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof body.message === 'string'
            ? body.message
            : 'Could not upload this file',
        );
        continue;
      }
      if (body.task?.id) {
        startedAt.current[body.task.id] = Date.now();
        setTasks((prev) => ({ ...prev, [body.task.id]: body.task }));
      }
    }
    await loadTree();
  };

  const onOpenFile = async (id: string, name?: string) => {
    setPreviewTitle(name || 'Preview');
    const res = await fetch(
      `/itms/ai/api/knowledge/files/${encodeURIComponent(id)}/content?tree=markdown`,
      { headers: getAuthHeaders() },
    );
    if (res.status === 404 || !res.ok) {
      setPreviewMarkdown(null);
      setPreviewError('File not found.');
      return;
    }
    setPreviewError(null);
    setPreviewMarkdown(await res.text());
  };

  const onDownload = async (file: KnowledgeFileMeta) => {
    const res = await fetch(
      `/itms/ai/api/knowledge/files/${encodeURIComponent(file.id)}/content?tree=inbox`,
      { headers: getAuthHeaders() },
    );
    if (!res.ok) {
      toast.error('Could not download this file');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.original_filename || 'download';
    link.click();
    URL.revokeObjectURL(url);
  };

  const onOpenHit = (hit: KnowledgeSearchHit) => {
    const meta = findFileForSearchHit(tree, hit);
    if (meta) {
      void onOpenFile(meta.id, hit.title || meta.original_filename);
      return;
    }
    clearPreview();
  };

  const runSearch = async (event: FormEvent) => {
    event.preventDefault();
    const query = searchDraft.trim();
    if (!query) {
      setHits(null);
      return;
    }
    const res = await fetch('/itms/ai/api/knowledge/search', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query, mode: searchMode, limit: 10 }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(
        typeof body.message === 'string' ? body.message : 'Search failed',
      );
      return;
    }
    setHits(Array.isArray(body.results) ? body.results : []);
  };

  const storageFull = Boolean(storage && storage.remainingBytes <= 0);

  const toolbarSearch = (
    <form
      className="knowledge-search-form"
      onSubmit={(event) => void runSearch(event)}
    >
      <input
        className="knowledge-search"
        value={searchDraft}
        onChange={(event) => {
          setSearchDraft(event.target.value);
          setHits(null);
        }}
        placeholder="Search"
        aria-label="Search"
      />
      <select
        className="knowledge-search-mode"
        value={searchMode}
        onChange={(event) =>
          setSearchMode(event.target.value as KnowledgeSearchMode)
        }
      >
        <option value="search">Keyword</option>
        <option value="vsearch">Semantic</option>
        <option value="query">Hybrid</option>
      </select>
    </form>
  );

  const newFolderForm = newFolderOpen ? (
    <form
      className="knowledge-new-folder"
      onSubmit={(event) => {
        event.preventDefault();
        void createFolder();
      }}
    >
      <input
        value={newFolderName}
        onChange={(event) => setNewFolderName(event.target.value)}
        placeholder="Folder name"
        aria-label="Folder name"
      />
      <button type="submit">Create</button>
    </form>
  ) : null;

  const uploadInput = (
    <>
      <button
        type="button"
        className="knowledge-btn"
        disabled={storageFull}
        title={
          storageFull
            ? 'Storage full — delete files or ask an admin to raise your quota'
            : 'Upload files'
        }
        onClick={() => fileInputRef.current?.click()}
      >
        + Add file
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={KNOWLEDGE_ACCEPT}
        className="knowledge-upload hidden"
        onChange={(event) => {
          if (event.target.files) void uploadFiles(currentPath, event.target.files);
          event.target.value = '';
        }}
      />
    </>
  );

  const listing = (
    <KnowledgeListing
      items={listingItems}
      hits={hits}
      searching={hits !== null}
      tasks={tasks}
      onOpenDir={selectFolder}
      onOpenFile={(id, name) => void onOpenFile(id, name)}
      onOpenHit={onOpenHit}
      onDownload={(file) => void onDownload(file)}
      onDropFiles={(files) => void uploadFiles(currentPath, files)}
    />
  );

  return (
    <div className="knowledge-manager">
      {bannerError ? <p className="knowledge-banner">{bannerError}</p> : null}
      <div className="knowledge-detail-layout">
        <aside className="knowledge-detail-rail">
          {currentNode ? (
            <div className="knowledge-detail-folder-card">
              <div
                className="knowledge-folder-avatar knowledge-folder-avatar-lg"
                style={{
                  background: folderAvatarColor(currentNode.name),
                }}
              >
                {folderInitial(currentNode.name)}
              </div>
              <div className="knowledge-detail-folder-info">
                <div className="knowledge-detail-folder-name">
                  {currentNode.name}
                </div>
                <div className="knowledge-detail-folder-meta">
                  {fileCountInNode(currentNode)} files
                </div>
              </div>
            </div>
          ) : null}
          <nav className="knowledge-tree" aria-label="Folder tree">
            <button
              type="button"
              className={
                currentPath === ''
                  ? 'knowledge-tree-item is-active'
                  : 'knowledge-tree-item'
              }
              onClick={() => selectFolder('')}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (event.dataTransfer.files?.length) {
                  void uploadFiles('', event.dataTransfer.files);
                }
              }}
            >
              Folders
            </button>
            <KnowledgeTree
              node={tree}
              currentPath={currentPath}
              onSelect={selectFolder}
              onDropFiles={(path, files) => void uploadFiles(path, files)}
            />
          </nav>
        </aside>
        <section className="knowledge-files-panel">
          <div className="knowledge-files-header">
            <div>
              <h2 className="knowledge-files-title">Files</h2>
              <p className="knowledge-files-subtitle">
                Browse folders in the tree. Drop files here or use Add file.
              </p>
            </div>
            <div className="knowledge-files-header-actions">
              {toolbarSearch}
              <button
                type="button"
                className="knowledge-btn-secondary"
                onClick={() => setNewFolderOpen(true)}
              >
                + Create folder
              </button>
              {newFolderForm}
              {uploadInput}
            </div>
          </div>
          <StorageBar storage={storage} />
          <div className="knowledge-detail-main">
            {listing}
          </div>
        </section>
      </div>
      <KnowledgePreview
        markdown={previewMarkdown}
        error={previewError}
        title={previewTitle}
        onClose={clearPreview}
      />
    </div>
  );
}
