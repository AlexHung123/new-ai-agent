export type KnowledgeSearchMode = 'search' | 'vsearch' | 'query';

export type KnowledgeFileMeta = {
  id: string;
  original_filename: string;
  inbox_relpath: string;
  markdown_relpath: string;
  size_bytes: number;
  task_id?: string | null;
  created_at?: string;
  content_type?: string;
};

export type KnowledgeTreeNode = {
  type: 'dir' | 'file';
  name: string;
  path: string;
  children?: KnowledgeTreeNode[];
  file?: KnowledgeFileMeta;
};

export type KnowledgeTask = {
  id: string;
  user_id: string;
  kind: string;
  file_id: string;
  status: string;
  stage: string | null;
  last_error: string | null;
  created_at?: string;
  updated_at?: string;
  started_at?: string | null;
  finished_at?: string | null;
};

export type KnowledgeSearchHit = {
  docid?: string;
  score?: number;
  file: string;
  line?: number;
  title?: string;
  context?: string;
  snippet?: string;
};

export type DochubConfig = {
  baseUrl: string;
  timeoutMs: number;
  uploadTimeoutMs: number;
  maxUploadBytes: number;
};
