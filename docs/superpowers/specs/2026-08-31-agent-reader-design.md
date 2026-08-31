# Agent Reader Design

Date: 2026-08-31  
Status: **Implemented (MVP)**  
Scope: Add chat Agent **Reader**. One conversation is bound to one uploaded PDF. Users read the PDF on the left, ask on the right, and can send a text selection as context.

Related:

- Agent Document: `docs/superpowers/specs/2026-08-20-agent-document-design.md`
- Agent Writing file conversion: `src/lib/writing/`
- Agentero reading workflow (reference only): vault paper unit, selection chips, sidecar marks

## 1. Goal

Users pick **Agent Reader**, upload or reopen a PDF, then read it while asking questions. The agent answers from extracted Markdown (`fs_*` chrooted to that file). Selection on the PDF is appended to the user turn as a quoted passage with a page number.

### 1.1 Outcomes

1. Agents page shows **Agent Reader** when the user has `chatReaderAgent:execute`.
2. Empty Reader chat shows an upload/picker until a PDF is bound.
3. Bound chat: left PDF (pdf.js text layer), right existing Chat / composer.
4. One chat → one PDF. Change PDF only before the first message; after insert, `chats.documentId` is the file id and is immutable.
5. Extracted text lives under `data/reading-attachments/{user}/{fileId}/workspace/`. Original PDF is kept for preview.
6. Highlights and ask-from-selection persist in `{fileId}/marks.json` (not in the PDF bytes).

### 1.2 Non-goals

| Out of scope | Why |
|--------------|-----|
| ACP / BYOA / Tauri EmbedPDF | This app already uses `pi-agent-core` |
| Visual crop, layout analysis, citation graph | Agentero-only depth; later |
| Office formats in Reader | Writing already converts those |
| Editing NOTES.md / wiki | Ask-only |
| Shared library across users | Per-user disk store |

### 1.3 Locked decisions

1. Product: one Agent (`agentReader`) plus a PDF picker, not a new app shell.
2. Binding: reuse `chats.documentId` as the reading file id when `focusMode = agentReader`.
3. Tools: the same read-only `fs_ls` / `fs_read` / `fs_grep` / `fs_find` as Document/Writing.
4. Conversion: reuse `@firecrawl/anydoc` via `convertAttachment`.
5. Permission: `chatReaderAgent:execute`.
6. Selection: client prefixes the user message; no extra chat-body field.

---

## 2. Product shape

Empty unbound chat: upload PDF or pick a previously uploaded file.

Bound: split pane. Suggestion chips on empty transcript: Summarize / Key points / Terms. PDF selection floating menu: Highlight / Ask.

Follow-up (this branch):

- Highlight and ask marks are painted on the pdf.js text layer for the current page (quote match). Clicking a mark in the list jumps to that page and emphasizes the overlay.
- Selecting text immediately shows a composer chip (`p.N` + quote). Chip jumps to the page; X removes it. Send is allowed with only a chip (defaults to “Explain this passage.”).
- `p. 3` / `page 12` / `第 7 頁` in Reader answers and user turns are buttons that set `readerPage`.

Ask sends:

```text
Selected text from {name} (page N):
> quote

{question or "Explain this passage."}
```

---

## 3. Data

```text
data/reading-attachments/{ownerDir}/
  manifest.json
  {fileId}/
    original.pdf
    marks.json
    workspace/
      INDEX.md
      page-01.md   # <!-- page: 1 -->  (pdf.js per-page text)
      page-02.md
      part-01.md   # fallback only: anydoc blob, no page markers
```

Upload extracts with pdf.js `getTextContent` per page and stamps `<!-- page: N -->`. Empty pages are kept so numbers stay aligned. If pdf.js yields no text, fall back to `@firecrawl/anydoc` as unpaged Markdown and tell the model not to invent page numbers.

`READING_FILES_ROOT` overrides the root (tests).

Marks:

```ts
type ReaderMark = {
  id: string;
  kind: 'highlight' | 'ask';
  page: number;
  quote: string;
  question?: string;
  createdAt: string;
};
```
