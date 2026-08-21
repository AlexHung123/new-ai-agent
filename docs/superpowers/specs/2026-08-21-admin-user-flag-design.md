# Admin User Flag and Chat List Design

Date: 2026-08-21  
Status: **Draft**  
Scope: Add a server-side admin gate from `data/config.json`, expose `isAdmin` to the UI, show an **Admin** sidebar tab only to admins, and list every user’s chats (metadata only).

## 1. Goal

Operators name admin users in this app’s config. Those users see an Admin tab and a page of all chats (title, userId, agent, time). Non-admins never see the tab, cannot load the page, and cannot call the list API. Nobody can open another user’s transcript from this page.

### 1.1 Outcomes

1. `data/config.json` has `adminUserIds` (JWT `id` strings). Missing or empty list means no admins.
2. Server helper `isAdminUser` is the only reader of that list. `requireAdmin` returns 401/403 for later and current admin routes.
3. `GET /api/permissions` returns `{ permissions, isAdmin }` for the current user.
4. `GET /api/config` never includes `adminUserIds`. `POST /api/config` cannot change that key.
5. Sidebar shows **Admin** after Agents and History only when `isAdmin === true` (desktop and mobile).
6. `/admin` lists all chats newest-first in a table (title, userId, agent, time). Rows are not links. No delete. Direct visit by a non-admin redirects to `/agents`.

### 1.2 Non-goals

| Out of scope | Why |
|--------------|-----|
| Opening / viewing transcripts | Operator asked for list only. Owner routes stay owner-only. |
| Delete another user’s chat | Read-only monitor. History delete stays owner-only. |
| iTMS `is_admin` column or new permission code | Admin list lives in this app’s config. |
| Username / department lookup from `cap_user` | `chats.userId` is enough for this slice. |
| Admin UI to edit `adminUserIds` | Operators edit `data/config.json`. |
| Pagination / search / filter | Match History: one list, newest first. |
| Middleware `x-is-admin` header | Routes compute admin from verified `x-user-id`. |
| Live reload of `config.json` on disk | `ConfigManager` already loads at process start; same as other config keys. |

### 1.3 Locked decisions

1. Source of truth: `adminUserIds` array in `data/config.json` (not env, not iTMS).
2. Compare as strings. `"1"` and `1` in config both match JWT userId `"1"`.
3. UI learns admin status only from `GET /api/permissions` (`isAdmin` boolean). The ID list never goes to the client.
4. Admin tab + `/admin` list in this slice. No `/admin/chats/[id]` and no admin bypass on `GET /api/chats/:id` or `POST /api/chat`.
5. New API `GET /api/admin/chats` is the only way to list other users’ chats. Existing `GET /api/chats` stays own chats only.

---

## 2. Architecture

```
data/config.json          adminUserIds: ["1", "42"]
        │
        ▼
src/lib/auth/isAdminUser.ts
  normalizeAdminUserIds / isAdminUser / requireAdmin
        │
        ├── GET /api/permissions  → { permissions, isAdmin }
        ├── GET /api/admin/chats  → requireAdmin then all chats
        └── GET/POST /api/config  → strip / reject adminUserIds

Sidebar ──GET /api/permissions──► render Admin tab iff isAdmin
/admin   ──GET /api/permissions──► redirect if not admin
         ──GET /api/admin/chats──► list metadata
```

Identity is unchanged: parent JWT `id` → middleware `x-user-id`. Admin is not a JWT claim and not an iTMS role. Middleware does not set `x-is-admin`.

---

## 3. Components

### 3.1 Config

Add a top-level key (operators edit the file; do not commit real IDs in docs beyond the shape):

```json
{
  "version": 1,
  "adminUserIds": ["1", "42"]
}
```

- Type: array of strings (numbers coerced to string).
- Missing key, `null`, non-array, or `[]` → no admins.
- Blank entries ignored after trim.

### 3.2 Server helpers (`src/lib/auth/isAdminUser.ts`)

Pure functions (easy to unit test) plus thin wrappers that read config:

| Function | Behavior |
|----------|----------|
| `normalizeAdminUserIds(raw)` | If `raw` is not an array, `[]`. Else `String(entry).trim()`, drop empties. |
| `isAdminUserId(userId, adminUserIds)` | `false` if `userId` is null/undefined/blank. Else `adminUserIds.includes(String(userId).trim())`. |
| `getAdminUserIds()` | `normalizeAdminUserIds(configManager.getConfig('adminUserIds', []))`. |
| `isAdminUser(userId)` | `isAdminUserId(userId, getAdminUserIds())`. |
| `requireAdmin(userId)` | No `userId` → `Response` 401 `{ message: 'Unauthorized - Authentication required' }`. Not admin → `Response` 403 `{ message: 'Forbidden' }`. Admin → `null`. |

Callers: `if (denied) return denied;` after `requireAdmin(userId)`.

### 3.3 Config HTTP API

`GET /api/config` is unauthenticated today and returns the whole file. That must not include `adminUserIds`.

- Add `publicConfigValues(config)` that deep-clones and `delete`s `adminUserIds`.
- Add `isForbiddenConfigKey(key)`: `true` when `key` is `adminUserIds` or starts with `adminUserIds.`.
- GET uses `publicConfigValues(configManager.getCurrentConfig())`.
- POST: if `isForbiddenConfigKey(body.key)` → 403 `{ message: 'Forbidden' }`. Other keys unchanged.

Do not add `adminUserIds` to Settings UI fields.

### 3.4 Permissions HTTP API

`GET /api/permissions` (already behind middleware):

- Unchanged iTMS permission query.
- Add `isAdmin: isAdminUser(userId)`.
- Body: `{ permissions: string[], isAdmin: boolean }`.
- 401 when `x-user-id` missing (same as today).
- iTMS query failure: keep 500. Do not return a successful body with guessed `isAdmin`.

Existing clients that only read `permissions` keep working.

### 3.5 Admin chats HTTP API

`GET /api/admin/chats`:

- Add `/api/admin` to middleware `PROTECTED_ROUTES` and `matcher`.
- `userId` from `x-user-id`; `requireAdmin`; then `db.query.chats.findMany()` and reverse (same newest-first trick as `GET /api/chats`).
- JSON `{ chats: { id, title, userId, focusMode, createdAt }[] }`. Do not include `files` or `documentId`.
- 401/403 from `requireAdmin`. 500 on DB error with the same generic message as other chat routes.

### 3.6 Sidebar

`src/components/Sidebar.tsx`:

- On mount, `GET /itms/ai/api/permissions` with `getAuthHeaders()`.
- `isAdmin` defaults to `false` until a successful body with `isAdmin === true` (no flash of the tab for non-admins). Fetch error → stay `false`.
- `navLinks` always has Agents (`/agents`) and History (`/library`). Append Admin (`/admin`, lucide `Shield`) only when `isAdmin`.
- Desktop column and mobile bottom bar both use `navLinks`, so both hide the tab.

### 3.7 Admin page

`src/app/admin/page.tsx` (client page, layout title `Admin - AI Agent`):

- After token init (same pattern as Agents: `initializeAuthToken` then fetch):
  1. `GET /itms/ai/api/permissions`. If not ok or `isAdmin !== true`, `router.replace('/agents')`.
  2. Else `GET /itms/ai/api/admin/chats`. 403 → replace `/agents`. Other errors → inline error text.
  Browser fetches keep the `/itms/ai` prefix, matching Agents and History. Server route files stay under `src/app/api/...` (Next strips `basePath`).
- Heading **Admin**, then a table of all chats: **Title**, **User**, **Agent**, **Time**. Agent is icon + name from `focusModes` (fallback: `focusMode` key). Time is relative, same as History.
- Title is plain text, not a `Link` to `/c/{id}`. Rows are not clickable.
- No `DeleteChat`. Empty list shows one table row: “No chats found.”

---

## 4. Data flow

1. Operator sets `adminUserIds` in `data/config.json` and restarts the Node process (or otherwise reloads `ConfigManager`). Editing the file on disk without reload does not change who is admin.
2. Browser sends JWT. Middleware verifies and sets `x-user-id` only.
3. Sidebar and `/admin` call `GET /api/permissions`. Server computes `isAdmin` from config + userId.
4. Sidebar omits Admin unless `isAdmin`. `/admin` redirects non-admins to `/agents`.
5. `/admin` then calls `GET /api/admin/chats`. Server `requireAdmin` again, then lists all chat rows.
6. History (`/library`) and `GET /api/chats` / `GET /api/chats/:id` still require the chat `userId` to match the caller. Admins do not get a backdoor into transcripts in this slice.

---

## 5. Error handling

| Case | Behavior |
|------|----------|
| Missing / empty / non-array `adminUserIds` | No admins. Tab hidden. `/admin` redirects. List API 403. |
| UserId `"1"` vs config `1` | Match (string normalize). |
| Permissions 401 or network error | `isAdmin` false. Tab hidden. `/admin` redirects. |
| Permissions 500 | Same as error: not admin. |
| Non-admin `GET /api/admin/chats` | 403 `{ message: 'Forbidden' }`. |
| Unauthenticated admin API | 401 (middleware or `requireAdmin`). |
| Admin list DB failure | 500 `{ message: 'An error has occurred.' }`. |
| `GET /api/config` | Response values omit `adminUserIds`. |
| `POST /api/config` with key `adminUserIds` | 403. Other settings still save. |
| Non-admin opens `/admin` URL | Client redirect to `/agents`. API still 403. |

Do not enumerate whether a userId is in the admin list in error messages.

---

## 6. Testing

Vitest, same style as `src/lib/auth` / `src/lib/chat` tests. Prefer testing pure helpers; do not require a live DB for the flag.

### 6.1 `isAdminUser` (`src/lib/auth/isAdminUser.test.ts`)

- `normalizeAdminUserIds`: missing, `null`, object, mixed types (`1`, `"42"`, `" 7 "`, `""`) → string list without blanks.
- `isAdminUserId`: match, miss, blank userId, numeric userId vs string list.
- `requireAdmin`: 401 without userId, 403 for non-admin, `null` for admin. Assert status and that 403 body does not include `adminUserIds`.

`getAdminUserIds` / `isAdminUser` may stay thin wrappers; if tested, inject config or mock `getConfig`.

### 6.2 Config sanitization (`src/lib/config/publicConfig.test.ts`)

- `publicConfigValues` clone omits `adminUserIds` and does not mutate the input object.
- Nested `preferences` / `personalization` unchanged.
- `isForbiddenConfigKey`: `adminUserIds` and `adminUserIds.0` true; `theme` false.

### 6.3 Manual / browser (implementation verification, not a unit file)

- User not in list: no Admin tab on desktop and mobile width; `/itms/ai/admin` ends on Agents.
- User in list: tab visible; page lists chats including other `userId`s; titles are not links; no delete control.
- `GET /itms/ai/api/config` JSON has no `adminUserIds`.
- Non-admin `GET /itms/ai/api/admin/chats` with a valid token → 403.
- Owner History still lists only own chats.

---

## 7. Files

| Path | Change |
|------|--------|
| `data/config.json` | Add `adminUserIds` (operator; local/env file). |
| `src/lib/auth/isAdminUser.ts` | Create helpers. |
| `src/lib/auth/isAdminUser.test.ts` | Create tests. |
| `src/lib/config/publicConfig.ts` | Strip / forbid helpers. |
| `src/app/api/permissions/route.ts` | Add `isAdmin`. |
| `src/app/api/config/route.ts` | Strip on GET; forbid POST. |
| `src/app/api/admin/chats/route.ts` | Create list API. |
| `src/middleware.ts` | Protect `/api/admin`. |
| `src/components/Sidebar.tsx` | Fetch `isAdmin`; conditional Admin tab. |
| `src/app/admin/page.tsx` | Create list page. |
| `src/app/admin/layout.tsx` | Title metadata. |

No schema or iTMS permission-row changes.

---

## 8. Security notes

- Client `isAdmin` is display-only. Every admin data path must call `requireAdmin` on the server.
- Never send `adminUserIds` to the browser.
- Do not reuse `GET /api/chats` with a query flag such as `?all=1`; that is easy to forget to gate.
- `POST /api/chat` must not gain an admin bypass in this slice (would let an admin write into another user’s chat or attribute messages wrongly).
- Existing `GET /api/config` still returns other secrets (DB URLs, API keys) if they sit in `config.json`. That leak is pre-existing and out of scope; this work must not add `adminUserIds` to it.

---

## 9. Follow-ups (not this spec)

- Transcript viewer for admins.
- Username lookup from iTMS `cap_user`.
- Search, filter, pagination.
- Settings UI to manage `adminUserIds`.
- Optional iTMS permission instead of a config list.
