# Agent PPT Design

Date: 2026-09-03  
Status: **Implemented (partial)** — pipeline, sticky outline, page plans, theme HTML, editable pptx export. Optional model-written HTML/SVG and screenshot fallback are out of scope for v1.  
Scope: New chat agent `agentPpt`. Offline. Uploads via anydoc. Stage-gated tools. Deterministic Bento render. PptxGenJS export of native Office shapes.

Narrative plan (Chinese, product + comparisons): [docs/ppt-agent/README.md](../../ppt-agent/README.md)  
Layout catalog: [docs/ppt-agent/layouts.html](../../ppt-agent/layouts.html)

## 1. Goal

Users describe a deck (and optionally upload Word/PDF). The agent must not jump to decoration. It walks:

`discover → outline → plan → design → export`

and delivers an **editable `.pptx`** (shapes + text boxes), plus HTML/JSON from the same `page_plan` JSON.

### 1.1 Outcomes

1. Agents page shows **Agent PPT** (`chatGuideAgent:execute`, same as Writing).
2. Uploads reuse the Writing library (anydoc → Markdown → `fs_*`).
3. Explicit `Stage`; tools reject the wrong stage.
4. Outline is sticky notes the user can reorder / delete / add.
5. Each page locks a layout enum + cards. Design only sets `themeId`.
6. Preview is CSS Grid from JSON. Export is PptxGenJS from the same JSON.

### 1.2 Non-goals

| Out of scope | Why |
|--------------|-----|
| Web search | Deployment has no outbound internet |
| CubeSandbox / E2B | Tools already run in-process |
| Model-authored HTML/SVG as the default | No visual self-check; Flash invents coordinates |
| `mixed` grid | Highest malformation rate |
| Screenshot-in-slide export | Not editable; image has no Playwright/fonts |
| Model-written exporters | Fixed script only |
| Company `.potx` / slide masters | v1 is Bento cards as shapes |

### 1.3 Locked decisions

1. Product: one agent (`agentPpt`), not a full PPT editor.
2. Persistence: `ppt_decks` keyed by `chatId` (jsonb deck + denormalized `stage`).
3. Facts: uploads + confirmed brief only. No invented numbers.
4. Layouts: the ten enums in `src/lib/ppt/layouts.ts`. KPI = `three_col` + `role: stat`. Close page reuses `cover`.
5. Themes: `navy-bento` \| `slate-paper` \| `forest-board`. No raw hex from the model.
6. Dual track: HTML preview and pptx share `listDeckPlans` + theme tokens.
7. pptx: PptxGenJS, 10"×5.625", `Microsoft YaHei`, 6-digit hex without `#`.
8. Permission: reuse `chatGuideAgent:execute` until a dedicated code exists.
9. Optional later: model HTML with schema + token whitelist + fallback to the deterministic renderer.

---

## 2. Product shape

| Field | Value |
|-------|--------|
| `key` | `agentPpt` |
| `title` | Agent PPT |
| `permissionCode` | `chatGuideAgent:execute` |
| `image` | `/itms/ai/agent-ppt.jpg` |
| Session agent id | `ppt-chat-agent-${chatId}` |

UI: chat + sticky wall + wireframe / themed slide. `ask_user` is a form, not 20 chat questions. SSE event `type: "ppt"` carries `{ deck }`.

API:

- `GET/PUT /itms/ai/api/ppt/deck?chatId=`
- `GET /itms/ai/api/ppt/export?chatId=&format=json\|html\|pptx`

---

## 3. Tools

`ask_user`, `commit_brief`, `commit_outline`, `patch_outline`, `commit_page_plan`, `get_page_plan`, `get_deck`, `set_theme`, `advance_stage`, `export_deck`, plus Writing `fs_ls` / `fs_read` / `fs_grep` / `fs_find`.

Gates: `src/lib/ppt/stage.ts`.

---

## 4. File map

See the table in [docs/ppt-agent/README.md](../../ppt-agent/README.md) §10. Migration: `drizzle/pg/0004_ppt_decks.sql`.
