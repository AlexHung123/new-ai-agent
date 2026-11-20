# Agent Knowledge File Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Knowledge sidebar page where a signed-in user creates nested folders, uploads documents (converted to Markdown on this server), and searches a per-user Dochub/QMD library.

**Architecture:** Thin authenticated proxy. The browser calls only `/itms/ai/api/knowledge/*` with the existing JWT. Next.js middleware sets `x-user-id`. Server converts uploads, then calls Dochub with `X-User-Id`. QMD MCP stays on the Mac.

**Tech Stack:** Next.js 15 (basePath `/itms/ai`), Vitest, `@firecrawl/anydoc` via existing `convertAttachment`, `markdown-to-jsx`, lucide-react `FolderOpen`.

**Spec:** `docs/superpowers/specs/2026-11-20-agent-knowledge-design.md`

## Global Constraints

- Browser never fetches Dochub (`192.168.1.56:8787`) or QMD MCP; only `/itms/ai/api/knowledge/*` with Bearer JWT.
- Dochub `X-User-Id` is the JWT user id from middleware `x-user-id` (string, e.g. `"1"`). Ignore any client-supplied user id in JSON or form fields.
- Do not add delete/rename, empty-file create, an agent chat tool, `GET /api/knowledge/files`, or an iTMS permission.
- Do not change Agent Writing’s allow-list (`isAllowedWritingFilename` stays office/PDF).
- Default Dochub base URL `http://192.168.1.56:8787`; max upload `33554432` bytes (32 MiB); search default `mode=search`, `limit=10`.
- New folder uses an inline name field, not `window.prompt`.
- Sidebar order: Agents, History, Knowledge, Admin (Admin still `isAdmin` only).
- Tests: `npx vitest run <file>`. No Playwright unless the user asks (`AGENTS.md`).
- Do not commit `data/config.json`, `tsconfig.tsbuildinfo`, `__pycache__`, or `data/documents/sfc/wiki/_ingest`.
- On Windows PowerShell, write commit messages with UTF-8 **without BOM**:

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: short subject`n", $utf8)
git add <files>
git commit -F $msg
Remove-Item $msg
```

## Review Focus

- Filename `../../evil.pdf` in an upload: `relative_path` last segment / `displayFilename` must yield `evil.pdf` under the chosen folder, never a `..` path. Owned by Task 1 and Task 6.
- JSON body `{ "path": "docs", "userId": "alice" }` while `x-user-id` is `1`: Dochub must see `X-User-Id: 1`. Owned by Task 5 and Task 6.
- Dochub upload HTTP 202 is success, not an error. Owned by Task 5.
- Search hit `qmd://markdown/missing.md` with no tree match: listing still renders title/snippet; preview does not throw. Owned by Task 4 and Task 9.
- Empty `dochub.baseUrl` (`""`): API 503 `{ message: "Knowledge service is unavailable." }`. Owned by Task 2 and Task 5.

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/knowledge/types.ts` | Tree, file, task, search, config types |
| `src/lib/knowledge/paths.ts` | Path sanitizing, join, `relative_path`, markdown filename |
| `src/lib/knowledge/paths.test.ts` | Path unit tests |
| `src/lib/knowledge/config.ts` | `resolveDochubConfig` / `getDochubConfig` / `isDochubConfigured` |
| `src/lib/knowledge/config.test.ts` | Config unit tests |
| `src/lib/knowledge/convert.ts` | Knowledge allow-list + convert |
| `src/lib/knowledge/convert.test.ts` | Convert unit tests |
| `src/lib/knowledge/search.ts` | Search body normalize + QMD path strip |
| `src/lib/knowledge/search.test.ts` | Search helper tests |
| `src/lib/knowledge/tree.ts` | Walk tree, children at path, match search hit |
| `src/lib/knowledge/tree.test.ts` | Tree helper tests |
| `src/lib/knowledge/taskStatus.ts` | Indexing / embedding / failed badge |
| `src/lib/knowledge/taskStatus.test.ts` | Badge tests |
| `src/lib/knowledge/errors.ts` | `DochubError`, unavailable copy |
| `src/lib/knowledge/dochubClient.ts` | Server HTTP client |
| `src/lib/knowledge/dochubClient.test.ts` | Client tests (mock fetch) |
| `src/lib/knowledge/http.ts` | `userIdFrom`, 401 helper, error → Response |
| `src/app/api/knowledge/tree/route.ts` | `GET` tree |
| `src/app/api/knowledge/folders/route.ts` | `POST` folder |
| `src/app/api/knowledge/files/route.ts` | `POST` upload |
| `src/app/api/knowledge/files/[id]/content/route.ts` | `GET` content |
| `src/app/api/knowledge/tasks/[id]/route.ts` | `GET` task |
| `src/app/api/knowledge/search/route.ts` | `POST` search |
| `src/lib/knowledge/knowledgeRoutes.test.ts` | Route handler tests |
| `src/middleware.ts` | Protect `/api/knowledge` |
| `src/lib/config/publicConfig.ts` | Strip / forbid `dochub` |
| `src/lib/config/publicConfig.test.ts` | Secret-key tests |
| `src/components/Sidebar.tsx` | Knowledge nav + wide layout |
| `src/lib/chat/sidebarNav.test.ts` | Sidebar contract |
| `src/app/knowledge/layout.tsx` | Title |
| `src/app/knowledge/page.tsx` | Page chrome + manager |
| `src/components/knowledge/KnowledgeFileManager.tsx` | Toolbar + panes + data loading |
| `src/components/knowledge/KnowledgeTree.tsx` | Folder tree |
| `src/components/knowledge/KnowledgeListing.tsx` | Folder listing / search hits |
| `src/components/knowledge/KnowledgePreview.tsx` | Markdown preview |
| `src/app/globals.css` | `.knowledge-*` |
| `src/lib/knowledge/knowledgeUi.test.ts` | UI contract tests |

---

### Task 1: Path helpers and shared types

**Files:**
- Create: `src/lib/knowledge/types.ts`
- Create: `src/lib/knowledge/paths.ts`
- Test: `src/lib/knowledge/paths.test.ts`

**Interfaces:**
- Consumes: `displayFilename` from `src/lib/writing/types.ts`
- Produces:
  - `sanitizePathSegment(name: string): string | null`
  - `joinKnowledgePath(parent: string, name: string): string`
  - `isSafeRelativePath(path: string): boolean`
  - `buildRelativePath(folderPath: string, filename: string): string`
  - `markdownName(filename: string): string`
  - types `KnowledgeTreeNode`, `KnowledgeFileMeta`, `KnowledgeTask`, `KnowledgeSearchHit`, `KnowledgeSearchMode`, `DochubConfig`

- [ ] **Step 1: Write the failing test**

Create `src/lib/knowledge/paths.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildRelativePath,
  isSafeRelativePath,
  joinKnowledgePath,
  markdownName,
  sanitizePathSegment,
} from './paths';

describe('sanitizePathSegment', () => {
  it('trims and accepts a simple folder name', () => {
    expect(sanitizePathSegment('  2024  ')).toBe('2024');
  });

  it('rejects empty, dots, slashes, and control characters', () => {
    expect(sanitizePathSegment('')).toBeNull();
    expect(sanitizePathSegment('   ')).toBeNull();
    expect(sanitizePathSegment('.')).toBeNull();
    expect(sanitizePathSegment('..')).toBeNull();
    expect(sanitizePathSegment('a/b')).toBeNull();
    expect(sanitizePathSegment('a\\b')).toBeNull();
    expect(sanitizePathSegment('a\nb')).toBeNull();
  });
});

describe('isSafeRelativePath', () => {
  it('accepts nested folder paths', () => {
    expect(isSafeRelativePath('contracts/2024')).toBe(true);
    expect(isSafeRelativePath('Report.PDF')).toBe(true);
  });

  it('rejects traversal, absolute, backslash, and empty paths', () => {
    expect(isSafeRelativePath('')).toBe(false);
    expect(isSafeRelativePath('/abs')).toBe(false);
    expect(isSafeRelativePath('foo/../bar')).toBe(false);
    expect(isSafeRelativePath('a\\b')).toBe(false);
    expect(isSafeRelativePath('contracts/2024/../../etc/passwd')).toBe(false);
  });
});

describe('joinKnowledgePath and buildRelativePath', () => {
  it('joins from root and from a parent', () => {
    expect(joinKnowledgePath('', '2024')).toBe('2024');
    expect(joinKnowledgePath('contracts', '2024')).toBe('contracts/2024');
  });

  it('builds an upload relative_path from a folder and filename', () => {
    expect(buildRelativePath('', 'Report.PDF')).toBe('Report.PDF');
    expect(buildRelativePath('contracts/2024', 'report.pdf')).toBe(
      'contracts/2024/report.pdf',
    );
  });

  it('strips directory components from the filename so .. cannot escape', () => {
    expect(buildRelativePath('docs', '../../evil.pdf')).toBe('docs/evil.pdf');
    expect(isSafeRelativePath(buildRelativePath('docs', '../../evil.pdf'))).toBe(
      true,
    );
  });
});

describe('markdownName', () => {
  it('replaces the extension with .md', () => {
    expect(markdownName('report.pdf')).toBe('report.md');
    expect(markdownName('notes.md')).toBe('notes.md');
    expect(markdownName('file')).toBe('file.md');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/knowledge/paths.test.ts`

Expected: FAIL with cannot find module `./paths`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/knowledge/types.ts`:

```ts
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
```

Create `src/lib/knowledge/paths.ts`:

```ts
import { displayFilename } from '@/lib/writing/types';

const MAX_SEGMENT = 200;
const MAX_PATH = 500;

export function sanitizePathSegment(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (trimmed === '.' || trimmed === '..') return null;
  if (trimmed.length > MAX_SEGMENT) return null;
  if (/[/\\]/.test(trimmed)) return null;
  if (/[\u0000-\u001f]/.test(trimmed)) return null;
  return trimmed;
}

export function joinKnowledgePath(parent: string, name: string): string {
  if (!parent) return name;
  if (!name) return parent;
  return `${parent}/${name}`;
}

export function isSafeRelativePath(path: string): boolean {
  if (typeof path !== 'string' || !path || path.length > MAX_PATH) return false;
  if (path.startsWith('/') || path.includes('\\')) return false;
  const parts = path.split('/');
  return parts.every((part) => sanitizePathSegment(part) === part);
}

export function buildRelativePath(folderPath: string, filename: string): string {
  const base = displayFilename(filename);
  if (folderPath && !isSafeRelativePath(folderPath)) {
    return base;
  }
  return joinKnowledgePath(folderPath, base);
}

export function markdownName(filename: string): string {
  const base = displayFilename(filename);
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return `${base}.md`;
  return `${base.slice(0, dot)}.md`;
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/lib/knowledge/paths.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: add knowledge path sanitizers`n", $utf8)
git add src/lib/knowledge/types.ts src/lib/knowledge/paths.ts src/lib/knowledge/paths.test.ts
git commit -F $msg
Remove-Item $msg
```

---

### Task 2: Dochub config and public-config strip

**Files:**
- Create: `src/lib/knowledge/config.ts`
- Test: `src/lib/knowledge/config.test.ts`
- Modify: `src/lib/config/publicConfig.ts`
- Modify: `src/lib/config/publicConfig.test.ts`

**Interfaces:**
- Consumes: `DochubConfig` from `src/lib/knowledge/types.ts`; `configManager.getConfig` for `getDochubConfig` only
- Produces:
  - `DEFAULT_DOCHUB_BASE_URL = 'http://192.168.1.56:8787'`
  - `DEFAULT_DOCHUB_TIMEOUT_MS = 60_000`
  - `DEFAULT_DOCHUB_UPLOAD_TIMEOUT_MS = 120_000`
  - `DEFAULT_DOCHUB_MAX_UPLOAD_BYTES = 33_554_432`
  - `UNAVAILABLE_MESSAGE = 'Knowledge service is unavailable.'` (re-export from errors in Task 5; for this task put the string in `config.ts` as `DOCHUB_UNAVAILABLE_MESSAGE`)
  - `resolveDochubConfig(raw: unknown): DochubConfig`
  - `isDochubConfigured(config: DochubConfig): boolean`
  - `getDochubConfig(): DochubConfig`
  - `publicConfigValues` omits `dochub`; `isForbiddenConfigKey('dochub')` and `'dochub.baseUrl'` are true

- [ ] **Step 1: Write the failing tests**

Create `src/lib/knowledge/config.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DOCHUB_BASE_URL,
  DEFAULT_DOCHUB_MAX_UPLOAD_BYTES,
  isDochubConfigured,
  resolveDochubConfig,
} from './config';

describe('resolveDochubConfig', () => {
  it('uses LAN defaults when the section is missing', () => {
    const config = resolveDochubConfig(undefined);
    expect(config.baseUrl).toBe(DEFAULT_DOCHUB_BASE_URL);
    expect(config.timeoutMs).toBe(60_000);
    expect(config.uploadTimeoutMs).toBe(120_000);
    expect(config.maxUploadBytes).toBe(DEFAULT_DOCHUB_MAX_UPLOAD_BYTES);
    expect(isDochubConfigured(config)).toBe(true);
  });

  it('strips a trailing slash on baseUrl', () => {
    const config = resolveDochubConfig({
      baseUrl: 'http://192.168.1.56:8787/',
    });
    expect(config.baseUrl).toBe('http://192.168.1.56:8787');
  });

  it('treats an empty baseUrl as unconfigured', () => {
    const config = resolveDochubConfig({ baseUrl: '   ' });
    expect(config.baseUrl).toBe('');
    expect(isDochubConfigured(config)).toBe(false);
  });
});
```

Add to `src/lib/config/publicConfig.test.ts` inside the existing describes (or a new `it`):

```ts
  it('omits dochub without mutating the input', () => {
    const input = {
      version: 1,
      adminUserIds: ['1'],
      bypassPermissionCheck: false,
      dochub: { baseUrl: 'http://192.168.1.56:8787' },
      preferences: { theme: 'dark' },
      personalization: { systemInstructions: 'be brief' },
    };
    const published = publicConfigValues(input);
    expect(published).not.toHaveProperty('dochub');
    expect(input.dochub.baseUrl).toBe('http://192.168.1.56:8787');
  });

  it('blocks dochub and nested paths', () => {
    expect(isForbiddenConfigKey('dochub')).toBe(true);
    expect(isForbiddenConfigKey('dochub.baseUrl')).toBe(true);
  });
```

Update the existing `omits adminUserIds` expectation: if you add `dochub` only in the new test, leave the original object unchanged.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/knowledge/config.test.ts src/lib/config/publicConfig.test.ts`

Expected: FAIL — missing `./config`; `isForbiddenConfigKey('dochub')` is false.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/knowledge/config.ts`:

```ts
import configManager from '@/lib/config';
import type { DochubConfig } from './types';

export const DEFAULT_DOCHUB_BASE_URL = 'http://192.168.1.56:8787';
export const DEFAULT_DOCHUB_TIMEOUT_MS = 60_000;
export const DEFAULT_DOCHUB_UPLOAD_TIMEOUT_MS = 120_000;
export const DEFAULT_DOCHUB_MAX_UPLOAD_BYTES = 32 * 1024 * 1024;
export const DOCHUB_UNAVAILABLE_MESSAGE =
  'Knowledge service is unavailable.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.trim();
}

function parsePositiveInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

export function resolveDochubConfig(raw: unknown): DochubConfig {
  const section = isRecord(raw) ? raw : {};
  const provided = Object.prototype.hasOwnProperty.call(section, 'baseUrl');
  const trimmed = provided ? (readString(section.baseUrl) ?? '') : undefined;

  return {
    baseUrl: (trimmed ?? DEFAULT_DOCHUB_BASE_URL).replace(/\/+$/, ''),
    timeoutMs: parsePositiveInt(section.timeoutMs) ?? DEFAULT_DOCHUB_TIMEOUT_MS,
    uploadTimeoutMs:
      parsePositiveInt(section.uploadTimeoutMs) ??
      DEFAULT_DOCHUB_UPLOAD_TIMEOUT_MS,
    maxUploadBytes:
      parsePositiveInt(section.maxUploadBytes) ??
      DEFAULT_DOCHUB_MAX_UPLOAD_BYTES,
  };
}

export function isDochubConfigured(config: DochubConfig): boolean {
  return Boolean(config.baseUrl.trim());
}

export function getDochubConfig(): DochubConfig {
  return resolveDochubConfig(configManager.getConfig('dochub', undefined));
}
```

When `baseUrl` is provided as whitespace, `readString` returns `''`, `trimmed` is `''`, `'' ?? DEFAULT` stays `''` because `??` only skips null/undefined. `replace` on `''` stays `''`. Good.

Modify `src/lib/config/publicConfig.ts` — add `'dochub'` to `SECRET_CONFIG_KEYS`:

```ts
const SECRET_CONFIG_KEYS = [
  'adminUserIds',
  'bypassPermissionCheck',
  'dochub',
] as const;
```

`isForbiddenConfigKey` already matches `key === secret || key.startsWith(`${secret}.`)`, so `dochub.baseUrl` is covered.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/lib/knowledge/config.test.ts src/lib/config/publicConfig.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: add dochub config and hide it from public config`n", $utf8)
git add src/lib/knowledge/config.ts src/lib/knowledge/config.test.ts src/lib/config/publicConfig.ts src/lib/config/publicConfig.test.ts
git commit -F $msg
Remove-Item $msg
```

Do not stage `data/config.json`. Defaults work without editing the file.

---

### Task 3: Knowledge convert

**Files:**
- Create: `src/lib/knowledge/convert.ts`
- Test: `src/lib/knowledge/convert.test.ts`

**Interfaces:**
- Consumes: `convertAttachment` from `src/lib/writing/convert.ts`; `isOfficeFilename`, `fileExtension` from `src/lib/writing/types.ts`; `DEFAULT_DOCHUB_MAX_UPLOAD_BYTES` from `./config`
- Produces:
  - `KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE` (exact spec copy)
  - `isAllowedKnowledgeFilename(filename: string): boolean`
  - `isKnowledgeTextFilename(filename: string): boolean`
  - `KNOWLEDGE_ACCEPT` string for `<input accept>`
  - `convertKnowledgeAttachment(bytes: Uint8Array, filename: string, options?: { maxBytes?: number }): Promise<ConvertResult>` where `ConvertResult` is the same union as writing (`ok: true, markdown, format` | `ok: false, error, code?`)

- [ ] **Step 1: Write the failing test**

Create `src/lib/knowledge/convert.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE,
  convertKnowledgeAttachment,
} from './convert';

describe('convertKnowledgeAttachment', () => {
  it('accepts markdown and text as utf-8', async () => {
    const md = await convertKnowledgeAttachment(
      Buffer.from('# Hello\n\nworld'),
      'notes.md',
    );
    expect(md.ok).toBe(true);
    if (md.ok) {
      expect(md.markdown).toContain('# Hello');
      expect(md.format).toBe('md');
    }

    const txt = await convertKnowledgeAttachment(
      Buffer.from('hello'),
      'notes.txt',
    );
    expect(txt.ok).toBe(true);
    if (txt.ok) expect(txt.markdown).toBe('hello');
  });

  it('strips a utf-8 BOM from markdown', async () => {
    const result = await convertKnowledgeAttachment(
      Buffer.from([0xef, 0xbb, 0xbf, 0x23, 0x20, 0x48]),
      'notes.md',
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.markdown.startsWith('# H')).toBe(true);
  });

  it('rejects empty text', async () => {
    const result = await convertKnowledgeAttachment(
      Buffer.from('   \n'),
      'notes.md',
    );
    expect(result.ok).toBe(false);
  });

  it('rejects zip and images with the knowledge type message', async () => {
    const zip = await convertKnowledgeAttachment(Buffer.from('x'), 'pack.zip');
    expect(zip.ok).toBe(false);
    if (!zip.ok) expect(zip.error).toBe(KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE);

    const png = await convertKnowledgeAttachment(
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      'photo.png',
    );
    expect(png.ok).toBe(false);
  });

  it('rejects files over maxBytes', async () => {
    const result = await convertKnowledgeAttachment(
      Buffer.from('hello world'),
      'notes.md',
      { maxBytes: 4 },
    );
    expect(result.ok).toBe(false);
  });

  it('converts a small csv through convertAttachment', async () => {
    const result = await convertKnowledgeAttachment(
      Buffer.from('name,qty\nwidget,2\n'),
      'items.csv',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.format).toBe('csv');
      expect(result.markdown.toLowerCase()).toMatch(/widget/);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/knowledge/convert.test.ts`

Expected: FAIL with cannot find module `./convert`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/knowledge/convert.ts`:

```ts
import {
  convertAttachment,
  type ConvertResult,
} from '@/lib/writing/convert';
import {
  fileExtension,
  isOfficeFilename,
} from '@/lib/writing/types';
import { DEFAULT_DOCHUB_MAX_UPLOAD_BYTES } from './config';

const TEXT_EXT = new Set(['md', 'markdown', 'txt']);

export const KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE =
  'This file type is not supported. Attach Word, PowerPoint, Excel, OpenDocument, RTF, EPUB, CSV, PDF, Markdown, or text files.';

export const KNOWLEDGE_ACCEPT = [
  ...['doc', 'docx', 'docm', 'ppt', 'pps', 'pot', 'pptx', 'pptm', 'ppsx', 'ppsm',
    'xls', 'xlsx', 'xlsm', 'xlsb', 'odt', 'ods', 'odp', 'rtf', 'epub', 'csv', 'pdf',
    'md', 'markdown', 'txt'],
].map((ext) => `.${ext}`).join(',');

export function isKnowledgeTextFilename(filename: string): boolean {
  return TEXT_EXT.has(fileExtension(filename));
}

export function isAllowedKnowledgeFilename(filename: string): boolean {
  return isOfficeFilename(filename) || isKnowledgeTextFilename(filename);
}

function decodeUtf8(bytes: Uint8Array): string {
  let buf = Buffer.from(bytes);
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    buf = buf.subarray(3);
  }
  return buf.toString('utf8');
}

export async function convertKnowledgeAttachment(
  bytes: Uint8Array,
  filename: string,
  options?: { maxBytes?: number },
): Promise<ConvertResult> {
  const maxBytes = options?.maxBytes ?? DEFAULT_DOCHUB_MAX_UPLOAD_BYTES;
  if (bytes.byteLength > maxBytes) {
    return { ok: false, error: 'This file is too large.' };
  }
  if (!isAllowedKnowledgeFilename(filename)) {
    return { ok: false, error: KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE };
  }
  if (isKnowledgeTextFilename(filename)) {
    const markdown = decodeUtf8(bytes);
    if (!markdown.trim()) {
      return { ok: false, error: 'This file is empty.' };
    }
    return { ok: true, markdown, format: fileExtension(filename) || 'txt' };
  }
  return convertAttachment(bytes, filename);
}
```

Do not edit `src/lib/writing/types.ts` or `convert.ts`.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/lib/knowledge/convert.test.ts`

Expected: PASS. Also run `npx vitest run src/lib/writing/convert.test.ts` and expect the existing “rejects markdown” writing test to still PASS.

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: convert knowledge uploads to markdown`n", $utf8)
git add src/lib/knowledge/convert.ts src/lib/knowledge/convert.test.ts
git commit -F $msg
Remove-Item $msg
```

---

### Task 4: Search, tree walk, and ingest badge helpers

**Files:**
- Create: `src/lib/knowledge/search.ts`
- Test: `src/lib/knowledge/search.test.ts`
- Create: `src/lib/knowledge/tree.ts`
- Test: `src/lib/knowledge/tree.test.ts`
- Create: `src/lib/knowledge/taskStatus.ts`
- Test: `src/lib/knowledge/taskStatus.test.ts`

**Interfaces:**
- Consumes: types from `./types`
- Produces:
  - `normalizeSearchRequest(body: unknown): { ok: true; query: string; mode: KnowledgeSearchMode; limit: number } | { ok: false; message: string }`
  - `stripQmdMarkdownPath(file: string): string`
  - `nodeAtPath(root: KnowledgeTreeNode, path: string): KnowledgeTreeNode | null`
  - `childrenAtPath(root: KnowledgeTreeNode, path: string): KnowledgeTreeNode[]`
  - `findFileForSearchHit(root: KnowledgeTreeNode, hit: KnowledgeSearchHit): KnowledgeFileMeta | null`
  - `ingestBadge(task: { status: string; stage?: string | null } | null | undefined): 'indexing' | 'embedding' | 'failed' | null`

- [ ] **Step 1: Write the failing tests**

`src/lib/knowledge/search.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeSearchRequest, stripQmdMarkdownPath } from './search';

describe('normalizeSearchRequest', () => {
  it('defaults mode to search and limit to 10', () => {
    expect(normalizeSearchRequest({ query: '  quarterly  ' })).toEqual({
      ok: true,
      query: 'quarterly',
      mode: 'search',
      limit: 10,
    });
  });

  it('accepts vsearch and query modes', () => {
    expect(normalizeSearchRequest({ query: 'q', mode: 'vsearch', limit: 5 })).toMatchObject({
      ok: true,
      mode: 'vsearch',
      limit: 5,
    });
    expect(normalizeSearchRequest({ query: 'q', mode: 'query' })).toMatchObject({
      ok: true,
      mode: 'query',
    });
  });

  it('rejects empty query, unknown mode, and out-of-range limit', () => {
    expect(normalizeSearchRequest({ query: '   ' }).ok).toBe(false);
    expect(normalizeSearchRequest({ query: 'q', mode: 'Search' }).ok).toBe(false);
    expect(normalizeSearchRequest({ query: 'q', limit: 0 }).ok).toBe(false);
    expect(normalizeSearchRequest({ query: 'q', limit: 51 }).ok).toBe(false);
  });
});

describe('stripQmdMarkdownPath', () => {
  it('strips the qmd markdown prefix', () => {
    expect(
      stripQmdMarkdownPath('qmd://markdown/contracts/2024/report.md'),
    ).toBe('contracts/2024/report.md');
  });

  it('returns a non-qmd path unchanged', () => {
    expect(stripQmdMarkdownPath('contracts/2024/report.md')).toBe(
      'contracts/2024/report.md',
    );
  });
});
```

`src/lib/knowledge/tree.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { KnowledgeTreeNode } from './types';
import {
  childrenAtPath,
  findFileForSearchHit,
  nodeAtPath,
} from './tree';

const tree: KnowledgeTreeNode = {
  type: 'dir',
  name: '',
  path: '',
  children: [
    {
      type: 'dir',
      name: 'contracts',
      path: 'contracts',
      children: [
        {
          type: 'dir',
          name: '2024',
          path: 'contracts/2024',
          children: [
            {
              type: 'file',
              name: 'report.pdf',
              path: 'contracts/2024/report.pdf',
              file: {
                id: 'file-1',
                original_filename: 'report.pdf',
                inbox_relpath: 'contracts/2024/report.pdf',
                markdown_relpath: 'contracts/2024/report.md',
                size_bytes: 16,
                task_id: 'task-1',
              },
            },
          ],
        },
      ],
    },
  ],
};

describe('tree walk', () => {
  it('returns children of a nested folder, files after dirs at root of that folder', () => {
    const kids = childrenAtPath(tree, 'contracts/2024');
    expect(kids.map((n) => n.name)).toEqual(['report.pdf']);
    expect(nodeAtPath(tree, 'contracts')?.type).toBe('dir');
  });

  it('matches a search hit to the file meta via markdown_relpath', () => {
    const meta = findFileForSearchHit(tree, {
      file: 'qmd://markdown/contracts/2024/report.md',
      title: 'report',
      snippet: 'planning',
    });
    expect(meta?.id).toBe('file-1');
  });

  it('returns null when the hit path is not in the tree', () => {
    expect(
      findFileForSearchHit(tree, {
        file: 'qmd://markdown/missing.md',
        title: 'missing',
        snippet: 'nope',
      }),
    ).toBeNull();
  });
});
```

`src/lib/knowledge/taskStatus.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ingestBadge } from './taskStatus';

describe('ingestBadge', () => {
  it('maps pending update, embed, success, and failure', () => {
    expect(
      ingestBadge({ status: 'pending', stage: 'qmd_update' }),
    ).toBe('indexing');
    expect(
      ingestBadge({ status: 'pending', stage: 'qmd_embed' }),
    ).toBe('embedding');
    expect(
      ingestBadge({ status: 'succeeded', stage: 'qmd_embed' }),
    ).toBeNull();
    expect(
      ingestBadge({ status: 'failed', stage: 'qmd_update', last_error: 'boom' }),
    ).toBe('failed');
    expect(ingestBadge(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/knowledge/search.test.ts src/lib/knowledge/tree.test.ts src/lib/knowledge/taskStatus.test.ts`

Expected: FAIL with missing modules.

- [ ] **Step 3: Write minimal implementation**

`src/lib/knowledge/search.ts`:

```ts
import type { KnowledgeSearchMode } from './types';

const MODES = new Set<KnowledgeSearchMode>(['search', 'vsearch', 'query']);

export function normalizeSearchRequest(
  body: unknown,
):
  | { ok: true; query: string; mode: KnowledgeSearchMode; limit: number }
  | { ok: false; message: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'query is required' };
  }
  const record = body as Record<string, unknown>;
  const query = typeof record.query === 'string' ? record.query.trim() : '';
  if (!query) return { ok: false, message: 'query is required' };

  const modeRaw = record.mode === undefined ? 'search' : record.mode;
  if (typeof modeRaw !== 'string' || !MODES.has(modeRaw as KnowledgeSearchMode)) {
    return { ok: false, message: 'mode must be search, vsearch, or query' };
  }

  let limit = 10;
  if (record.limit !== undefined) {
    if (typeof record.limit !== 'number' || !Number.isInteger(record.limit)) {
      return { ok: false, message: 'limit must be an integer from 1 to 50' };
    }
    limit = record.limit;
  }
  if (limit < 1 || limit > 50) {
    return { ok: false, message: 'limit must be an integer from 1 to 50' };
  }

  return { ok: true, query, mode: modeRaw as KnowledgeSearchMode, limit };
}

export function stripQmdMarkdownPath(file: string): string {
  const prefix = 'qmd://markdown/';
  if (file.startsWith(prefix)) return file.slice(prefix.length);
  return file;
}
```

`src/lib/knowledge/tree.ts`:

```ts
import { stripQmdMarkdownPath } from './search';
import type {
  KnowledgeFileMeta,
  KnowledgeSearchHit,
  KnowledgeTreeNode,
} from './types';

export function nodeAtPath(
  root: KnowledgeTreeNode,
  path: string,
): KnowledgeTreeNode | null {
  if (!path) return root;
  const parts = path.split('/');
  let current: KnowledgeTreeNode | undefined = root;
  for (const part of parts) {
    current = (current.children || []).find((child) => child.name === part);
    if (!current) return null;
  }
  return current;
}

export function childrenAtPath(
  root: KnowledgeTreeNode,
  path: string,
): KnowledgeTreeNode[] {
  const node = nodeAtPath(root, path);
  if (!node) return [];
  const children = node.children || [];
  const dirs = children.filter((child) => child.type === 'dir');
  const files = children.filter((child) => child.type !== 'dir');
  return [...dirs, ...files];
}

function walkFiles(
  node: KnowledgeTreeNode,
  visit: (file: KnowledgeFileMeta) => void,
): void {
  if (node.type === 'file' && node.file) visit(node.file);
  for (const child of node.children || []) walkFiles(child, visit);
}

export function findFileForSearchHit(
  root: KnowledgeTreeNode,
  hit: KnowledgeSearchHit,
): KnowledgeFileMeta | null {
  const rel = stripQmdMarkdownPath(hit.file || '');
  if (!rel) return null;
  let found: KnowledgeFileMeta | null = null;
  walkFiles(root, (file) => {
    if (found) return;
    if (file.markdown_relpath === rel || file.inbox_relpath === rel) {
      found = file;
    }
  });
  return found;
}
```

`src/lib/knowledge/taskStatus.ts`:

```ts
export type IngestBadge = 'indexing' | 'embedding' | 'failed' | null;

export function ingestBadge(
  task:
    | { status: string; stage?: string | null }
    | null
    | undefined,
): IngestBadge {
  if (!task) return null;
  if (task.status === 'failed') return 'failed';
  if (task.status === 'succeeded') return null;
  if (task.stage === 'qmd_embed') return 'embedding';
  return 'indexing';
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/lib/knowledge/search.test.ts src/lib/knowledge/tree.test.ts src/lib/knowledge/taskStatus.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: add knowledge search and tree helpers`n", $utf8)
git add src/lib/knowledge/search.ts src/lib/knowledge/search.test.ts src/lib/knowledge/tree.ts src/lib/knowledge/tree.test.ts src/lib/knowledge/taskStatus.ts src/lib/knowledge/taskStatus.test.ts
git commit -F $msg
Remove-Item $msg
```

---

### Task 5: Dochub HTTP client

**Files:**
- Create: `src/lib/knowledge/errors.ts`
- Create: `src/lib/knowledge/dochubClient.ts`
- Test: `src/lib/knowledge/dochubClient.test.ts`

**Interfaces:**
- Consumes: `DochubConfig`, tree/task types; `DOCHUB_UNAVAILABLE_MESSAGE` from `./config`
- Produces:
  - `class DochubError extends Error { status: number; code?: string }`
  - `type DochubDeps = { fetch?: typeof fetch; config?: DochubConfig }`
  - `getTree(userId: string, deps?: DochubDeps)`
  - `createFolder(userId: string, path: string, deps?: DochubDeps)`
  - `uploadFile(userId: string, input: { original: Uint8Array; originalName: string; originalType?: string; markdown: string; relativePath: string }, deps?: DochubDeps)`
  - `getTask(userId: string, taskId: string, deps?: DochubDeps)`
  - `getFileContent(userId: string, fileId: string, tree: 'markdown' | 'inbox', deps?: DochubDeps)`
  - `search(userId: string, input: { query: string; mode: KnowledgeSearchMode; limit: number }, deps?: DochubDeps)`
  - Never sets `Authorization` on Dochub. Always sets `X-User-Id` to the `userId` argument. Treats HTTP 202 as success.

- [ ] **Step 1: Write the failing test**

Create `src/lib/knowledge/dochubClient.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DochubError } from './errors';
import {
  createFolder,
  getTree,
  search,
  uploadFile,
} from './dochubClient';
import { DOCHUB_UNAVAILABLE_MESSAGE } from './config';

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const config = {
  baseUrl: 'http://dochub.test',
  timeoutMs: 1000,
  uploadTimeoutMs: 2000,
  maxUploadBytes: 1024,
};

describe('dochubClient', () => {
  it('sets X-User-Id from the argument and never sends Authorization', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(200, {
        user_id: '1',
        tree: { type: 'dir', name: '', path: '', children: [] },
      }),
    );
    await getTree('1', { fetch: fetchMock, config });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('X-User-Id')).toBe('1');
    expect(headers.get('Authorization')).toBeNull();
    expect(String(fetchMock.mock.calls[0][0])).toBe('http://dochub.test/v1/tree');
  });

  it('uses the userId argument even if a JSON body also names a user', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { path: 'docs' }));
    await createFolder('1', 'docs', { fetch: fetchMock, config });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('X-User-Id')).toBe('1');
    expect(init.body).toBe(JSON.stringify({ path: 'docs' }));
  });

  it('treats upload HTTP 202 as success and sends file, markdown, relative_path', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = init?.body as FormData;
      expect(body.get('relative_path')).toBe('contracts/2024/report.pdf');
      expect(body.get('file')).toBeInstanceOf(File);
      expect(body.get('markdown')).toBeInstanceOf(File);
      return jsonResponse(202, {
        file: { id: 'f1' },
        task: { id: 't1', status: 'pending' },
      });
    });
    const result = await uploadFile(
      '1',
      {
        original: new Uint8Array([1, 2, 3]),
        originalName: 'report.pdf',
        originalType: 'application/pdf',
        markdown: '# Report',
        relativePath: 'contracts/2024/report.pdf',
      },
      { fetch: fetchMock, config },
    );
    expect(result.file.id).toBe('f1');
    expect(result.task.id).toBe('t1');
  });

  it('maps a fetch throw to unavailable 503', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    await expect(getTree('1', { fetch: fetchMock, config })).rejects.toMatchObject({
      status: 503,
      message: DOCHUB_UNAVAILABLE_MESSAGE,
    });
  });

  it('throws DochubError with Dochub error/message on 4xx JSON', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(404, { error: 'not_found', message: 'file not found' }),
    );
    await expect(
      search('1', { query: 'q', mode: 'search', limit: 10 }, { fetch: fetchMock, config }),
    ).rejects.toBeInstanceOf(DochubError);
  });

  it('throws unavailable when baseUrl is empty', async () => {
    await expect(
      getTree('1', {
        fetch: vi.fn(),
        config: { ...config, baseUrl: '' },
      }),
    ).rejects.toMatchObject({
      status: 503,
      message: DOCHUB_UNAVAILABLE_MESSAGE,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/knowledge/dochubClient.test.ts`

Expected: FAIL with cannot find module `./dochubClient`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/knowledge/errors.ts`:

```ts
import { DOCHUB_UNAVAILABLE_MESSAGE } from './config';

export class DochubError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'DochubError';
    this.status = status;
    this.code = code;
  }
}

export function unavailableError(): DochubError {
  return new DochubError(503, DOCHUB_UNAVAILABLE_MESSAGE);
}
```

`src/lib/knowledge/dochubClient.ts`:

```ts
import {
  getDochubConfig,
  isDochubConfigured,
} from './config';
import { DochubError, unavailableError } from './errors';
import { markdownName } from './paths';
import type {
  DochubConfig,
  KnowledgeSearchMode,
  KnowledgeTask,
  KnowledgeTreeNode,
} from './types';

export type DochubDeps = {
  fetch?: typeof fetch;
  config?: DochubConfig;
};

function depsOf(deps?: DochubDeps): {
  fetch: typeof fetch;
  config: DochubConfig;
} {
  return {
    fetch: deps?.fetch ?? fetch,
    config: deps?.config ?? getDochubConfig(),
  };
}

function userHeaders(userId: string, extra?: Record<string, string>): Headers {
  const headers = new Headers(extra);
  headers.set('X-User-Id', userId);
  headers.delete('Authorization');
  return headers;
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function send(
  userId: string,
  path: string,
  init: RequestInit,
  timeoutMs: number,
  deps?: DochubDeps,
): Promise<unknown> {
  const { fetch: doFetch, config } = depsOf(deps);
  if (!isDochubConfigured(config)) throw unavailableError();
  const url = `${config.baseUrl}${path}`;
  const headers = userHeaders(
    userId,
    init.headers ? Object.fromEntries(new Headers(init.headers).entries()) : undefined,
  );
  try {
    const res = await doFetch(url, {
      ...init,
      headers,
      signal: init.signal ?? AbortSignal.timeout(timeoutMs),
    });
    const body = await readJson(res);
    if (res.status >= 400) {
      const rec = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
      throw new DochubError(
        res.status,
        typeof rec.message === 'string' ? rec.message : 'Dochub request failed',
        typeof rec.error === 'string' ? rec.error : undefined,
      );
    }
    return body;
  } catch (error) {
    if (error instanceof DochubError) throw error;
    throw unavailableError();
  }
}

export async function getTree(userId: string, deps?: DochubDeps): Promise<{
  user_id: string;
  tree: KnowledgeTreeNode;
}> {
  const { config } = depsOf(deps);
  return send(userId, '/v1/tree', { method: 'GET' }, config.timeoutMs, deps) as Promise<{
    user_id: string;
    tree: KnowledgeTreeNode;
  }>;
}

export async function createFolder(
  userId: string,
  path: string,
  deps?: DochubDeps,
): Promise<{ path: string }> {
  const { config } = depsOf(deps);
  return send(
    userId,
    '/v1/folders',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    },
    config.timeoutMs,
    deps,
  ) as Promise<{ path: string }>;
}

export async function uploadFile(
  userId: string,
  input: {
    original: Uint8Array;
    originalName: string;
    originalType?: string;
    markdown: string;
    relativePath: string;
  },
  deps?: DochubDeps,
): Promise<{ file: { id: string } & Record<string, unknown>; task: KnowledgeTask }> {
  const { config } = depsOf(deps);
  const form = new FormData();
  form.set(
    'file',
    new File([input.original], input.originalName, {
      type: input.originalType || 'application/octet-stream',
    }),
  );
  form.set(
    'markdown',
    new File([input.markdown], markdownName(input.originalName), {
      type: 'text/markdown',
    }),
  );
  form.set('relative_path', input.relativePath);
  return send(
    userId,
    '/v1/files',
    { method: 'POST', body: form },
    config.uploadTimeoutMs,
    deps,
  ) as Promise<{ file: { id: string } & Record<string, unknown>; task: KnowledgeTask }>;
}

export async function getTask(
  userId: string,
  taskId: string,
  deps?: DochubDeps,
): Promise<{ task: KnowledgeTask }> {
  const { config } = depsOf(deps);
  return send(
    userId,
    `/v1/tasks/${encodeURIComponent(taskId)}`,
    { method: 'GET' },
    config.timeoutMs,
    deps,
  ) as Promise<{ task: KnowledgeTask }>;
}

export async function getFileContent(
  userId: string,
  fileId: string,
  tree: 'markdown' | 'inbox',
  deps?: DochubDeps,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const { fetch: doFetch, config } = depsOf(deps);
  if (!isDochubConfigured(config)) throw unavailableError();
  try {
    const res = await doFetch(
      `${config.baseUrl}/v1/files/${encodeURIComponent(fileId)}/content?tree=${tree}`,
      {
        method: 'GET',
        headers: userHeaders(userId),
        signal: AbortSignal.timeout(config.timeoutMs),
      },
    );
    if (res.status >= 400) {
      const body = await readJson(res);
      const rec = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
      throw new DochubError(
        res.status,
        typeof rec.message === 'string' ? rec.message : 'file not found',
        typeof rec.error === 'string' ? rec.error : undefined,
      );
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return {
      bytes: buf,
      contentType: res.headers.get('content-type') || 'application/octet-stream',
    };
  } catch (error) {
    if (error instanceof DochubError) throw error;
    throw unavailableError();
  }
}

export async function search(
  userId: string,
  input: { query: string; mode: KnowledgeSearchMode; limit: number },
  deps?: DochubDeps,
): Promise<{ user_id: string; mode: string; query: string; results: unknown[] }> {
  const { config } = depsOf(deps);
  return send(
    userId,
    '/v1/search',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    config.timeoutMs,
    deps,
  ) as Promise<{ user_id: string; mode: string; query: string; results: unknown[] }>;
}
```

Note: `send` treats any status `< 400` as success, so **202 is success**.

Use `form.set('file', new File([input.original], input.originalName, { type: input.originalType || 'application/octet-stream' }))` and the same `File` constructor for markdown (`${stem}.md`, `text/markdown`) so `FormData.get` returns a `File` in Node 20+ / Vitest.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/lib/knowledge/dochubClient.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: add dochub HTTP client for knowledge`n", $utf8)
git add src/lib/knowledge/errors.ts src/lib/knowledge/dochubClient.ts src/lib/knowledge/dochubClient.test.ts
git commit -F $msg
Remove-Item $msg
```

---

### Task 6: Knowledge API routes and middleware

**Files:**
- Create: `src/lib/knowledge/http.ts`
- Create: `src/app/api/knowledge/tree/route.ts`
- Create: `src/app/api/knowledge/folders/route.ts`
- Create: `src/app/api/knowledge/files/route.ts`
- Create: `src/app/api/knowledge/files/[id]/content/route.ts`
- Create: `src/app/api/knowledge/tasks/[id]/route.ts`
- Create: `src/app/api/knowledge/search/route.ts`
- Test: `src/lib/knowledge/knowledgeRoutes.test.ts`
- Modify: `src/middleware.ts` — add `'/api/knowledge'` to `PROTECTED_ROUTES` and `'/api/knowledge/:path*'` to `matcher`

**Interfaces:**
- Consumes: `userId` from `x-user-id`; helpers from Tasks 1–5
- Produces: the six routes in the spec table. No `GET /api/knowledge/files`. POST folders ignores `body.userId`. POST files converts then uploads.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/knowledge/knowledgeRoutes.test.ts`. Mock the client module:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getTree = vi.fn();
const createFolder = vi.fn();
const uploadFile = vi.fn();
const getTask = vi.fn();
const getFileContent = vi.fn();
const search = vi.fn();

vi.mock('@/lib/knowledge/dochubClient', () => ({
  getTree,
  createFolder,
  uploadFile,
  getTask,
  getFileContent,
  search,
}));

import { GET as GET_TREE } from '@/app/api/knowledge/tree/route';
import { POST as POST_FOLDER } from '@/app/api/knowledge/folders/route';
import { POST as POST_FILE } from '@/app/api/knowledge/files/route';
import { GET as GET_CONTENT } from '@/app/api/knowledge/files/[id]/content/route';
import { GET as GET_TASK } from '@/app/api/knowledge/tasks/[id]/route';
import { POST as POST_SEARCH } from '@/app/api/knowledge/search/route';
import { readFileSync } from 'node:fs';
import path from 'node:path';

beforeEach(() => {
  getTree.mockReset();
  createFolder.mockReset();
  uploadFile.mockReset();
  getTask.mockReset();
  getFileContent.mockReset();
  search.mockReset();
});

function req(
  url: string,
  init?: RequestInit & { userId?: string | null },
): Request {
  const headers = new Headers(init?.headers);
  if (init?.userId) headers.set('x-user-id', init.userId);
  return new Request(url, { ...init, headers });
}

describe('knowledge routes', () => {
  it('returns 401 without x-user-id', async () => {
    const res = await GET_TREE(req('http://localhost/itms/ai/api/knowledge/tree'));
    expect(res.status).toBe(401);
    expect(getTree).not.toHaveBeenCalled();
  });

  it('GET tree forwards the middleware user id', async () => {
    getTree.mockResolvedValue({
      user_id: '1',
      tree: { type: 'dir', name: '', path: '', children: [] },
    });
    const res = await GET_TREE(
      req('http://localhost/itms/ai/api/knowledge/tree', { userId: '1' }),
    );
    expect(res.status).toBe(200);
    expect(getTree).toHaveBeenCalledWith('1');
  });

  it('POST folders uses x-user-id and ignores body.userId', async () => {
    createFolder.mockResolvedValue({ path: 'docs' });
    const res = await POST_FOLDER(
      req('http://localhost/itms/ai/api/knowledge/folders', {
        method: 'POST',
        userId: '1',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: 'docs', userId: 'alice' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(createFolder).toHaveBeenCalledWith('1', 'docs');
  });

  it('POST folders rejects traversal paths', async () => {
    const res = await POST_FOLDER(
      req('http://localhost/itms/ai/api/knowledge/folders', {
        method: 'POST',
        userId: '1',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: 'docs/../../etc' }),
      }),
    );
    expect(res.status).toBe(400);
    expect(createFolder).not.toHaveBeenCalled();
  });

  it('POST files converts markdown and uploads with relative_path', async () => {
    uploadFile.mockResolvedValue({
      file: { id: 'f1' },
      task: { id: 't1', status: 'pending' },
    });
    const form = new FormData();
    form.set(
      'file',
      new Blob(['# Hello\n'], { type: 'text/markdown' }),
      'notes.md',
    );
    form.set('relative_path', 'docs/notes.md');
    const res = await POST_FILE(
      req('http://localhost/itms/ai/api/knowledge/files', {
        method: 'POST',
        userId: '1',
        body: form,
      }),
    );
    expect(res.status).toBe(202);
    expect(uploadFile).toHaveBeenCalledTimes(1);
    const arg = uploadFile.mock.calls[0][1];
    expect(uploadFile.mock.calls[0][0]).toBe('1');
    expect(arg.relativePath).toBe('docs/notes.md');
    expect(arg.markdown).toContain('# Hello');
  });

  it('POST files rejects unsafe relative_path before Dochub', async () => {
    const form = new FormData();
    form.set('file', new Blob(['# Hello\n']), 'notes.md');
    form.set('relative_path', '../evil.md');
    const res = await POST_FILE(
      req('http://localhost/itms/ai/api/knowledge/files', {
        method: 'POST',
        userId: '1',
        body: form,
      }),
    );
    expect(res.status).toBe(400);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('POST search defaults mode and limit', async () => {
    search.mockResolvedValue({
      user_id: '1',
      mode: 'search',
      query: 'q',
      results: [],
    });
    const res = await POST_SEARCH(
      req('http://localhost/itms/ai/api/knowledge/search', {
        method: 'POST',
        userId: '1',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: 'q' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(search).toHaveBeenCalledWith('1', {
      query: 'q',
      mode: 'search',
      limit: 10,
    });
  });

  it('GET content defaults to markdown', async () => {
    getFileContent.mockResolvedValue({
      bytes: new TextEncoder().encode('# hi'),
      contentType: 'text/markdown',
    });
    const res = await GET_CONTENT(
      req('http://localhost/itms/ai/api/knowledge/files/abc/content', {
        userId: '1',
      }),
      { params: Promise.resolve({ id: 'abc' }) },
    );
    expect(res.status).toBe(200);
    expect(getFileContent).toHaveBeenCalledWith('1', 'abc', 'markdown');
    expect(await res.text()).toContain('# hi');
  });

  it('GET task forwards the id', async () => {
    getTask.mockResolvedValue({
      task: { id: 't1', status: 'succeeded', stage: 'qmd_embed' },
    });
    const res = await GET_TASK(
      req('http://localhost/itms/ai/api/knowledge/tasks/t1', { userId: '1' }),
      { params: Promise.resolve({ id: 't1' }) },
    );
    expect(res.status).toBe(200);
    expect(getTask).toHaveBeenCalledWith('1', 't1');
  });
});

describe('middleware matcher', () => {
  it('protects /api/knowledge', () => {
    const src = readFileSync(
      path.join(__dirname, '../../middleware.ts'),
      'utf8',
    );
    expect(src).toMatch(/'\/api\/knowledge'/);
    expect(src).toMatch(/\/api\/knowledge\/:path\*/);
  });
});
```

If `vi.mock` + importing routes in the same file is awkward under Vitest, split the mock into `vi.mock` before imports (as written). Do not add a `GET` list-files route; assert the files route file only exports `POST` in a contract line:

```ts
it('does not add GET /api/knowledge/files', () => {
  const src = readFileSync(
    path.join(__dirname, '../../app/api/knowledge/files/route.ts'),
    'utf8',
  );
  expect(src).not.toMatch(/export async function GET/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/knowledge/knowledgeRoutes.test.ts`

Expected: FAIL — missing route modules / middleware strings.

- [ ] **Step 3: Write minimal implementation**

`src/lib/knowledge/http.ts`:

```ts
import { NextResponse } from 'next/server';
import { DochubError } from './errors';
import { DOCHUB_UNAVAILABLE_MESSAGE } from './config';

export function userIdFrom(req: Request): string | null {
  const id = req.headers.get('x-user-id')?.trim() || '';
  return id || null;
}

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { message: 'Unauthorized - Authentication required' },
    { status: 401 },
  );
}

export function jsonFromUnknownError(error: unknown): NextResponse {
  if (error instanceof DochubError) {
    return NextResponse.json(
      { message: error.message, error: error.code },
      { status: error.status },
    );
  }
  return NextResponse.json(
    { message: DOCHUB_UNAVAILABLE_MESSAGE },
    { status: 503 },
  );
}
```

`src/app/api/knowledge/tree/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { getTree } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  try {
    const body = await getTree(userId);
    return NextResponse.json(body);
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
```

`src/app/api/knowledge/folders/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { createFolder } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';
import { isSafeRelativePath } from '@/lib/knowledge/paths';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }
  const path =
    body && typeof body === 'object' && 'path' in body
      ? String((body as { path?: unknown }).path || '')
      : '';
  if (!isSafeRelativePath(path)) {
    return NextResponse.json({ message: 'Invalid folder path' }, { status: 400 });
  }
  try {
    const result = await createFolder(userId, path);
    return NextResponse.json(result);
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
```

`src/app/api/knowledge/files/route.ts` — **POST only**:

```ts
import { NextResponse } from 'next/server';
import { convertKnowledgeAttachment } from '@/lib/knowledge/convert';
import { getDochubConfig } from '@/lib/knowledge/config';
import { uploadFile } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';
import { isSafeRelativePath } from '@/lib/knowledge/paths';
import { displayFilename } from '@/lib/writing/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { message: 'Expected multipart form data' },
      { status: 400 },
    );
  }
  const uploaded = form.get('file');
  if (!(uploaded instanceof File)) {
    return NextResponse.json({ message: 'file is required' }, { status: 400 });
  }
  const relativePath = String(form.get('relative_path') || '').trim();
  if (!isSafeRelativePath(relativePath)) {
    return NextResponse.json({ message: 'Invalid relative_path' }, { status: 400 });
  }
  const config = getDochubConfig();
  const bytes = new Uint8Array(await uploaded.arrayBuffer());
  if (bytes.byteLength > config.maxUploadBytes) {
    return NextResponse.json({ message: 'This file is too large.' }, { status: 413 });
  }
  const filename = displayFilename(relativePath);
  const converted = await convertKnowledgeAttachment(bytes, filename, {
    maxBytes: config.maxUploadBytes,
  });
  if (!converted.ok) {
    return NextResponse.json({ message: converted.error }, { status: 400 });
  }
  try {
    const result = await uploadFile(userId, {
      original: bytes,
      originalName: filename,
      originalType: uploaded.type || undefined,
      markdown: converted.markdown,
      relativePath,
    });
    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
```

`src/app/api/knowledge/files/[id]/content/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { getFileContent } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  const { id } = await context.params;
  const treeParam = new URL(req.url).searchParams.get('tree') || 'markdown';
  if (treeParam !== 'markdown' && treeParam !== 'inbox') {
    return NextResponse.json({ message: 'tree must be markdown or inbox' }, { status: 400 });
  }
  try {
    const { bytes, contentType } = await getFileContent(userId, id, treeParam);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type':
          treeParam === 'markdown'
            ? 'text/markdown; charset=utf-8'
            : contentType,
      },
    });
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
```

`src/app/api/knowledge/tasks/[id]/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { getTask } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  const { id } = await context.params;
  try {
    const body = await getTask(userId, id);
    return NextResponse.json(body);
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
```

`src/app/api/knowledge/search/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { search } from '@/lib/knowledge/dochubClient';
import { jsonFromUnknownError, unauthorized, userIdFrom } from '@/lib/knowledge/http';
import { normalizeSearchRequest } from '@/lib/knowledge/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) return unauthorized();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = normalizeSearchRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }
  try {
    const result = await search(userId, {
      query: parsed.query,
      mode: parsed.mode,
      limit: parsed.limit,
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonFromUnknownError(error);
  }
}
```

Modify `src/middleware.ts`:

- In `PROTECTED_ROUTES` add `'/api/knowledge',` after `'/api/wcms-content',`
- In `matcher` add `'/api/knowledge/:path*',`

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/lib/knowledge/knowledgeRoutes.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: add knowledge API proxy routes`n", $utf8)
git add src/lib/knowledge/http.ts src/lib/knowledge/knowledgeRoutes.test.ts src/app/api/knowledge src/middleware.ts
git commit -F $msg
Remove-Item $msg
```

---

### Task 7: Knowledge sidebar tab

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Test: `src/lib/chat/sidebarNav.test.ts`

**Interfaces:**
- Consumes: existing `navLinks` pattern
- Produces: Knowledge after History; `FolderOpen`; `href: '/knowledge'`; `wide` includes knowledge; Admin still last and still `isAdmin` only

- [ ] **Step 1: Write the failing test**

Create `src/lib/chat/sidebarNav.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('sidebar nav', () => {
  it('shows Knowledge after History and keeps Admin last', () => {
    const sidebar = readSrc('../../components/Sidebar.tsx');
    expect(sidebar).toMatch(/FolderOpen/);
    expect(sidebar).toMatch(/href: '\/knowledge'/);
    expect(sidebar).toMatch(/label: 'Knowledge'/);

    const historyAt = sidebar.indexOf("label: 'History'");
    const knowledgeAt = sidebar.indexOf("label: 'Knowledge'");
    const adminAt = sidebar.indexOf("label: 'Admin'");
    expect(historyAt).toBeGreaterThanOrEqual(0);
    expect(knowledgeAt).toBeGreaterThan(historyAt);
    expect(adminAt).toBeGreaterThan(knowledgeAt);

    expect(sidebar).toMatch(
      /wide=\{segments\.includes\('agents'\) \|\| segments\.includes\('knowledge'\)\}/,
    );
    expect(sidebar).toMatch(/isAdmin/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/chat/sidebarNav.test.ts`

Expected: FAIL — no `/knowledge` / `FolderOpen`.

- [ ] **Step 3: Write minimal implementation**

In `src/components/Sidebar.tsx`:

1. Import `FolderOpen` from `lucide-react` next to `BookOpenText`.
2. After the History object in `navLinks`, insert:

```ts
    {
      icon: FolderOpen,
      href: '/knowledge',
      active: segments.includes('knowledge'),
      label: 'Knowledge',
    },
```

3. Change `wide={segments.includes('agents')}` to:

```ts
        wide={segments.includes('agents') || segments.includes('knowledge')}
```

Leave the Admin spread after Knowledge.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/lib/chat/sidebarNav.test.ts src/lib/chat/chatLayout.test.ts`

Expected: PASS (`chatLayout.test.ts` still only checks `flush=`).

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: add Knowledge sidebar tab`n", $utf8)
git add src/components/Sidebar.tsx src/lib/chat/sidebarNav.test.ts
git commit -F $msg
Remove-Item $msg
```

---

### Task 8: File manager UI (folders, upload, drag-and-drop)

**Files:**
- Create: `src/app/knowledge/layout.tsx`
- Create: `src/app/knowledge/page.tsx`
- Create: `src/components/knowledge/KnowledgeFileManager.tsx`
- Create: `src/components/knowledge/KnowledgeTree.tsx`
- Create: `src/components/knowledge/KnowledgeListing.tsx`
- Modify: `src/app/globals.css` (append `.knowledge-*` rules)
- Test: `src/lib/knowledge/knowledgeUi.test.ts`

**Interfaces:**
- Consumes: `/itms/ai/api/knowledge/tree|folders|files|tasks/:id` with `getAuthHeaders()`; `childrenAtPath`, `buildRelativePath`, `joinKnowledgePath`, `sanitizePathSegment`, `KNOWLEDGE_ACCEPT`, `KNOWLEDGE_UNSUPPORTED_TYPE_MESSAGE`
- Produces: page at `/knowledge` with New folder (inline field), Upload, tree, listing, drag-and-drop. Search/preview wiring may be stubbed as props; Task 9 fills them. No `window.prompt`. No `192.168.1.56` in component files.

- [ ] **Step 1: Write the failing contract test**

Create `src/lib/knowledge/knowledgeUi.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function readSrc(...parts: string[]): string {
  return readFileSync(path.join(__dirname, ...parts), 'utf8');
}

describe('knowledge UI contracts', () => {
  it('has a Knowledge page titled like History', () => {
    const layout = readSrc('../../app/knowledge/layout.tsx');
    const page = readSrc('../../app/knowledge/page.tsx');
    expect(layout).toMatch(/Knowledge - AI Agent/);
    expect(page).toMatch(/FolderOpen/);
    expect(page).toMatch(/Knowledge/);
    expect(page).toMatch(/KnowledgeFileManager/);
  });

  it('uses an inline new-folder field, upload, and drag-and-drop', () => {
    const manager = readSrc('../../components/knowledge/KnowledgeFileManager.tsx');
    const tree = readSrc('../../components/knowledge/KnowledgeTree.tsx');
    const listing = readSrc('../../components/knowledge/KnowledgeListing.tsx');
    expect(manager).toMatch(/knowledge-new-folder/);
    expect(manager).not.toMatch(/window\.prompt/);
    expect(manager).toMatch(/knowledge-upload/);
    expect(manager).toMatch(/KNOWLEDGE_ACCEPT/);
    expect(manager).toMatch(/\/itms\/ai\/api\/knowledge\/tree/);
    expect(manager).toMatch(/\/itms\/ai\/api\/knowledge\/folders/);
    expect(manager).toMatch(/\/itms\/ai\/api\/knowledge\/files/);
    expect(manager).not.toMatch(/192\.168\.1\.56/);
    expect(tree).toMatch(/onDrop/);
    expect(listing).toMatch(/onDrop/);
    expect(listing).toMatch(/Create a folder or drop files here/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/knowledge/knowledgeUi.test.ts`

Expected: FAIL — files missing.

- [ ] **Step 3: Write minimal implementation**

`src/app/knowledge/layout.tsx`:

```tsx
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Knowledge - AI Agent',
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};

export default Layout;
```

`src/app/knowledge/page.tsx`:

```tsx
'use client';

import KnowledgeFileManager from '@/components/knowledge/KnowledgeFileManager';
import { initializeAuthToken } from '@/lib/utils/auth';
import { FolderOpen } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

const KnowledgePageInner = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    initializeAuthToken(searchParams);
  }, [searchParams]);

  return (
    <div>
      <div className="flex flex-col pt-4">
        <div className="flex items-center">
          <FolderOpen />
          <h1 className="text-3xl font-medium p-2">Knowledge</h1>
        </div>
        <hr className="border-t border-[#2B2C2C] my-4 w-full" />
      </div>
      <KnowledgeFileManager />
    </div>
  );
};

const Page = () => (
  <Suspense fallback={null}>
    <KnowledgePageInner />
  </Suspense>
);

export default Page;
```

`src/components/knowledge/KnowledgeTree.tsx`:

```tsx
'use client';

import type { KnowledgeTreeNode } from '@/lib/knowledge/types';

export default function KnowledgeTree({
  node,
  currentPath,
  onSelect,
  onDropFiles,
}: {
  node: KnowledgeTreeNode;
  currentPath: string;
  onSelect: (path: string) => void;
  onDropFiles: (path: string, files: FileList) => void;
}) {
  const folders = (node.children || []).filter((child) => child.type === 'dir');
  return (
    <ul className="knowledge-tree-list">
      {folders.map((folder) => (
        <li key={folder.path}>
          <button
            type="button"
            className={
              folder.path === currentPath
                ? 'knowledge-tree-item is-active'
                : 'knowledge-tree-item'
            }
            onClick={() => onSelect(folder.path)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (event.dataTransfer.files?.length) {
                onDropFiles(folder.path, event.dataTransfer.files);
              }
            }}
          >
            {folder.name}
          </button>
          {folder.children?.some((child) => child.type === 'dir') ? (
            <KnowledgeTree
              node={folder}
              currentPath={currentPath}
              onSelect={onSelect}
              onDropFiles={onDropFiles}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
```

`src/components/knowledge/KnowledgeListing.tsx`:

```tsx
'use client';

import type { KnowledgeSearchHit } from '@/lib/knowledge/types';
import type { KnowledgeTreeNode } from '@/lib/knowledge/types';
import { ingestBadge } from '@/lib/knowledge/taskStatus';
import type { KnowledgeTask } from '@/lib/knowledge/types';

export default function KnowledgeListing({
  items,
  hits,
  searching,
  tasks,
  onOpenDir,
  onOpenFile,
  onDropFiles,
}: {
  items: KnowledgeTreeNode[];
  hits: KnowledgeSearchHit[] | null;
  searching: boolean;
  tasks: Record<string, KnowledgeTask>;
  onOpenDir: (path: string) => void;
  onOpenFile: (id: string) => void;
  onDropFiles: (files: FileList) => void;
}) {
  return (
    <div
      className="knowledge-listing"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (event.dataTransfer.files?.length) onDropFiles(event.dataTransfer.files);
      }}
    >
      {searching && hits ? (
        hits.length === 0 ? (
          <p className="knowledge-empty">No matching files.</p>
        ) : (
          <ul className="knowledge-hit-list">
            {hits.map((hit, index) => (
              <li key={`${hit.file}-${index}`}>
                <button
                  type="button"
                  className="knowledge-hit"
                  data-hit-file={hit.file}
                  onClick={() => undefined}
                >
                  <strong>{hit.title || hit.file}</strong>
                  <span>{hit.snippet}</span>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : items.length === 0 ? (
        <p className="knowledge-empty">Create a folder or drop files here.</p>
      ) : (
        <ul className="knowledge-item-list">
          {items.map((item) => {
            const taskId = item.file?.task_id;
            const badge = taskId ? ingestBadge(tasks[taskId]) : null;
            return (
              <li key={item.path}>
                <button
                  type="button"
                  className="knowledge-item"
                  onClick={() =>
                    item.type === 'dir'
                      ? onOpenDir(item.path)
                      : item.file && onOpenFile(item.file.id)
                  }
                >
                  {item.name}
                  {badge === 'indexing' ? (
                    <span className="knowledge-badge">Indexing</span>
                  ) : null}
                  {badge === 'embedding' ? (
                    <span className="knowledge-badge">Embedding</span>
                  ) : null}
                  {badge === 'failed' ? (
                    <span className="knowledge-badge is-failed">Failed</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

Hit click is a no-op until Task 9; the button and `data-hit-file` must exist.

`src/components/knowledge/KnowledgeFileManager.tsx`:

JSON calls use `getAuthHeaders()`. Multipart upload uses `getAuthBearerHeaders()` so the browser can set the form boundary (do not send `Content-Type: application/json` on upload).

```tsx
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
      toast.error(typeof body.message === 'string' ? body.message : 'Could not create folder');
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
          typeof body.message === 'string' ? body.message : 'Could not upload this file',
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
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
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
```

Append to `src/app/globals.css`:

```css
.knowledge-manager {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: calc(100dvh - var(--chat-topbar-height) - 8rem);
  padding-bottom: var(--mobile-bottom-nav-height);
}

.knowledge-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.knowledge-panes {
  display: flex;
  min-height: 0;
  flex: 1;
  border: 1px solid var(--wiki-border);
  background: var(--wiki-surface);
}

.knowledge-tree {
  width: 240px;
  flex: 0 0 240px;
  overflow: auto;
  border-right: 1px solid var(--wiki-border);
  padding: 8px;
}

.knowledge-listing {
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 8px;
}

.knowledge-preview {
  display: none;
}

.knowledge-empty {
  color: var(--wiki-text-secondary);
  font-size: 14px;
  padding: 24px;
}

.knowledge-tree-item.is-active,
.knowledge-item:hover,
.knowledge-hit:hover {
  background: var(--wiki-surface-secondary);
}

.knowledge-badge.is-failed {
  color: #b42318;
}
```

Implement `KnowledgeFileManager` so the contract strings above match. Use `toast` from `sonner` for type errors, same as `WritingFileBrowser`.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/lib/knowledge/knowledgeUi.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: add knowledge file manager UI`n", $utf8)
git add src/app/knowledge src/components/knowledge src/app/globals.css src/lib/knowledge/knowledgeUi.test.ts
git commit -F $msg
Remove-Item $msg
```

---

### Task 9: Search, preview, and hit matching

**Files:**
- Create: `src/components/knowledge/KnowledgePreview.tsx`
- Modify: `src/components/knowledge/KnowledgeFileManager.tsx`
- Modify: `src/components/knowledge/KnowledgeListing.tsx`
- Modify: `src/app/globals.css` (show `.knowledge-preview` when open)
- Modify: `src/lib/knowledge/knowledgeUi.test.ts`

**Interfaces:**
- Consumes: `POST /itms/ai/api/knowledge/search`, `GET /itms/ai/api/knowledge/files/:id/content?tree=markdown`, `findFileForSearchHit`, `stripQmdMarkdownPath`
- Produces: Enter in search runs search; results replace the listing; unmatched hits still show; click matched hit or file loads Markdown preview via `markdown-to-jsx`. Empty query clears search. Preview hidden until a file is selected.

- [ ] **Step 1: Extend the failing contract tests**

Add to `src/lib/knowledge/knowledgeUi.test.ts`:

```ts
  it('searches through the app API and previews markdown', () => {
    const manager = readSrc('../../components/knowledge/KnowledgeFileManager.tsx');
    const listing = readSrc('../../components/knowledge/KnowledgeListing.tsx');
    const preview = readSrc('../../components/knowledge/KnowledgePreview.tsx');
    expect(manager).toMatch(/\/itms\/ai\/api\/knowledge\/search/);
    expect(manager).toMatch(/limit: 10/);
    expect(manager).toMatch(/vsearch/);
    expect(manager).toMatch(/content\?tree=markdown/);
    expect(manager).toMatch(/findFileForSearchHit/);
    expect(listing).toMatch(/onOpenHit/);
    expect(preview).toMatch(/markdown-to-jsx/);
    expect(preview).toMatch(/File not found/);
  });

  it('does not call Dochub or QMD from the browser', () => {
    const manager = readSrc('../../components/knowledge/KnowledgeFileManager.tsx');
    expect(manager).not.toMatch(/\/v1\/search/);
    expect(manager).not.toMatch(/qmd mcp/i);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/knowledge/knowledgeUi.test.ts`

Expected: FAIL — missing search URL / preview component.

- [ ] **Step 3: Write minimal implementation**

`src/components/knowledge/KnowledgePreview.tsx`:

```tsx
'use client';

import Markdown from 'markdown-to-jsx';

export default function KnowledgePreview({
  markdown,
  error,
}: {
  markdown: string | null;
  error: string | null;
}) {
  if (!markdown && !error) return null;
  return (
    <aside className="knowledge-preview is-open">
      {error ? (
        <p className="knowledge-preview-error">{error}</p>
      ) : (
        <div className="knowledge-preview-markdown content markdown">
          <Markdown>{markdown || ''}</Markdown>
        </div>
      )}
    </aside>
  );
}
```

Use error string `'File not found.'` when the content GET is 404.

In `KnowledgeListing`, add `onOpenHit: (hit: KnowledgeSearchHit) => void` and call it from the hit button `onClick`.

In `KnowledgeFileManager`, import `findFileForSearchHit` and `KnowledgePreview`. Add state `previewMarkdown: string | null` and `previewError: string | null`. Replace the search form `onSubmit` and listing/preview as follows:

```tsx
const runSearch = async (event: React.FormEvent) => {
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
    toast.error(typeof body.message === 'string' ? body.message : 'Search failed');
    return;
  }
  setHits(Array.isArray(body.results) ? body.results : []);
};

const onOpenFile = async (id: string) => {
  const res = await fetch(
    `/itms/ai/api/knowledge/files/${encodeURIComponent(id)}/content?tree=markdown`,
    { headers: getAuthHeaders() },
  );
  if (res.status === 404) {
    setPreviewMarkdown(null);
    setPreviewError('File not found.');
    return;
  }
  if (!res.ok) {
    setPreviewMarkdown(null);
    setPreviewError('File not found.');
    return;
  }
  setPreviewError(null);
  setPreviewMarkdown(await res.text());
};

const onOpenHit = (hit: KnowledgeSearchHit) => {
  const meta = findFileForSearchHit(tree, hit);
  if (meta) void onOpenFile(meta.id);
};
```

Pass `searching={hits !== null}`, `hits={hits}`, `onOpenHit={onOpenHit}`, `onOpenFile={(id) => void onOpenFile(id)}` into `KnowledgeListing`. Render `<KnowledgePreview markdown={previewMarkdown} error={previewError} />` as the third pane inside `.knowledge-panes`.

CSS:

```css
.knowledge-preview.is-open {
  display: block;
  width: 36%;
  overflow: auto;
  border-left: 1px solid var(--wiki-border);
  padding: 12px;
}
```

Mode select values stay `search`, `vsearch`, `query` with labels Keyword, Semantic, Hybrid. Default `search`.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/lib/knowledge/knowledgeUi.test.ts src/lib/chat/sidebarNav.test.ts src/lib/knowledge/knowledgeRoutes.test.ts src/lib/knowledge/paths.test.ts src/lib/knowledge/search.test.ts src/lib/knowledge/tree.test.ts src/lib/knowledge/convert.test.ts src/lib/knowledge/dochubClient.test.ts src/lib/config/publicConfig.test.ts`

Expected: all PASS.

- [ ] **Step 5: Commit**

```powershell
$msg = Join-Path $env:TEMP "commit-msg.txt"
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msg, "feat: add knowledge search and markdown preview`n", $utf8)
git add src/components/knowledge src/app/globals.css src/lib/knowledge/knowledgeUi.test.ts
git commit -F $msg
Remove-Item $msg
```

---

## Manual verification (after Task 9)

Not a commit. From repo root, with Next on `:3000` and Dochub on `192.168.1.56:8787`:

1. Open `/itms/ai/test-login`, confirm Knowledge tab after History.
2. Open Knowledge: empty tree, copy “Create a folder or drop files here.”
3. New folder `contracts`, then `2024` inside it.
4. Drop a small `.md` or PDF into `contracts/2024`. Badge Indexing, then the file remains.
5. Search a word from that file. Click the hit; preview shows Markdown.
6. Confirm DevTools network has no requests to `:8787` from the browser.
