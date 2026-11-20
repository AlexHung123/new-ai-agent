'use client';

import KnowledgeListing from '@/components/knowledge/KnowledgeListing';
import KnowledgeTree from '@/components/knowledge/KnowledgeTree';
import {
  KNOWLEDGE_ACCEPT,
  KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE,
  isAllowedKnowledgeFilename,
} from '@/lib/knowledge/convert';
import { childrenAtPath } from '@/lib/knowledge/tree';
import {
  buildRelativePath,
  joinKnowledgePath,
  sanitizePathSegment,
} from '@/lib/knowledge/paths';
import type {
  KnowledgeSearchHit,
  KnowledgeSearchMode,
  KnowledgeTask,
  KnowledgeTreeNode,
} from '@/lib/knowledge/types';
import { getAuthBearerHeaders, getAuthHeaders } from '@/lib/utils/auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const TREE_URL = '/itms/ai/api/knowledge/tree';
const FOLDERS_URL = '/itms/ai/api/knowledge/folders';
const FILES_URL = '/itms/ai/api/knowledge/files';

export default function KnowledgeFileManager() {
  const [tree, setTree] = useState<KnowledgeTreeNode>({
    type: 'dir',
    name: '',
    path: '',
    children: [],
  });
  const [currentPath, setCurrentPath] = useState('');
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [tasks, setTasks] = useState<Record<string, KnowledgeTask>>({});
  const [searchDraft, setSearchDraft] = useState('');
  const [searchMode, setSearchMode] = useState<KnowledgeSearchMode>('search');
  const [hits, setHits] = useState<KnowledgeSearchHit[] | null>(null);
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
    setTree(body.tree || { type: 'dir', name: '', path: '', children: [] });
  }, []);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  useEffect(() => {
    const pending = Object.values(tasks).filter(
      (task) => task.status !== 'succeeded' && task.status !== 'failed',
    );
    if (pending.length === 0) return;
    const timer = window.setInterval(async () => {
      for (const task of pending) {
        const started = startedAt.current[task.id] || Date.now();
        startedAt.current[task.id] = started;
        if (Date.now() - started > 120_000) continue;
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
    setCurrentPath(path);
  };

  const uploadFiles = async (folderPath: string, list: FileList | File[]) => {
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

  return (
    <div className="knowledge-manager">
      {bannerError ? <p className="knowledge-banner">{bannerError}</p> : null}
      <div className="knowledge-toolbar">
        <button type="button" onClick={() => setNewFolderOpen(true)}>
          New folder
        </button>
        {newFolderOpen ? (
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
        ) : null}
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Upload
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
        <form
          className="knowledge-search-form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <input
            className="knowledge-search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Search knowledge"
            aria-label="Search knowledge"
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
      </div>
      <div className="knowledge-panes">
        <nav className="knowledge-tree">
          <button
            type="button"
            className={
              currentPath === ''
                ? 'knowledge-tree-item is-active'
                : 'knowledge-tree-item'
            }
            onClick={() => setCurrentPath('')}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (event.dataTransfer.files?.length) {
                void uploadFiles('', event.dataTransfer.files);
              }
            }}
          >
            My files
          </button>
          <KnowledgeTree
            node={tree}
            currentPath={currentPath}
            onSelect={setCurrentPath}
            onDropFiles={(path, files) => void uploadFiles(path, files)}
          />
        </nav>
        <KnowledgeListing
          items={items}
          hits={hits}
          searching={false}
          tasks={tasks}
          onOpenDir={setCurrentPath}
          onOpenFile={() => undefined}
          onDropFiles={(files) => void uploadFiles(currentPath, files)}
        />
      </div>
    </div>
  );
}
