# Admin User Flag and Chat List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate an Admin sidebar tab and a metadata-only list of all users’ chats behind `adminUserIds` in `data/config.json`.

**Architecture:** Server-only admin ID list in config. Pure helpers decide admin. `GET /api/permissions` returns `isAdmin` for the UI. `GET /api/admin/chats` is the only all-users list and always calls `requireAdmin`. Owner chat routes stay owner-only. Config GET/POST never expose or write `adminUserIds`.

**Tech Stack:** Next.js 15 (basePath `/itms/ai`), Drizzle/Postgres `chats` table, Vitest, JWT `x-user-id` middleware.

**Spec:** `docs/superpowers/specs/2026-08-21-admin-user-flag-design.md`

Tests: `npx vitest run <file>`. Do not commit `data/config.json` (gitignored).

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/auth/isAdminUser.ts` | Normalize IDs, `isAdminUser`, `requireAdmin` |
| `src/lib/auth/isAdminUser.test.ts` | Unit tests for those helpers |
| `src/lib/config/publicConfig.ts` | Strip / forbid `adminUserIds` on the public config API |
| `src/lib/config/publicConfig.test.ts` | Unit tests for strip / forbid |
| `src/lib/auth/adminChatList.ts` | Map a chat row to admin list fields only |
| `src/lib/auth/adminChatList.test.ts` | Assert `files` / `documentId` are omitted |
| `src/app/api/config/route.ts` | Use public helpers on GET/POST |
| `src/app/api/permissions/route.ts` | Add `isAdmin` |
| `src/app/api/admin/chats/route.ts` | Admin list API |
| `src/middleware.ts` | Protect `/api/admin` |
| `src/components/Sidebar.tsx` | Conditional Admin tab |
| `src/app/admin/layout.tsx` | Page title |
| `src/app/admin/page.tsx` | List UI (no links, no delete) |
| `data/config.json` | Operator adds `adminUserIds` locally (not committed) |

---

### Task 1: Admin ID helpers

**Files:**
- Create: `src/lib/auth/isAdminUser.ts`
- Test: `src/lib/auth/isAdminUser.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/auth/isAdminUser.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  isAdminUserId,
  normalizeAdminUserIds,
  requireAdmin,
} from './isAdminUser';

describe('normalizeAdminUserIds', () => {
  it('returns empty for missing, null, and non-arrays', () => {
    expect(normalizeAdminUserIds(undefined)).toEqual([]);
    expect(normalizeAdminUserIds(null)).toEqual([]);
    expect(normalizeAdminUserIds({ '0': '1' })).toEqual([]);
  });

  it('coerces entries to trimmed strings and drops blanks', () => {
    expect(normalizeAdminUserIds([1, '42', ' 7 ', '', '  '])).toEqual([
      '1',
      '42',
      '7',
    ]);
  });
});

describe('isAdminUserId', () => {
  const admins = ['1', '42'];

  it('matches string or numeric userId against the list', () => {
    expect(isAdminUserId('1', admins)).toBe(true);
    expect(isAdminUserId(42, admins)).toBe(true);
    expect(isAdminUserId('99', admins)).toBe(false);
  });

  it('returns false for blank userId', () => {
    expect(isAdminUserId(null, admins)).toBe(false);
    expect(isAdminUserId(undefined, admins)).toBe(false);
    expect(isAdminUserId('', admins)).toBe(false);
    expect(isAdminUserId('  ', admins)).toBe(false);
  });
});

describe('requireAdmin', () => {
  const admins = ['1'];

  it('returns 401 when userId is missing', async () => {
    const denied = requireAdmin(null, admins);
    expect(denied).not.toBeNull();
    expect(denied!.status).toBe(401);
    await expect(denied!.json()).resolves.toEqual({
      message: 'Unauthorized - Authentication required',
    });
  });

  it('returns 403 without listing admin ids when the user is not admin', async () => {
    const denied = requireAdmin('99', admins);
    expect(denied).not.toBeNull();
    expect(denied!.status).toBe(403);
    const body = await denied!.json();
    expect(body).toEqual({ message: 'Forbidden' });
    expect(JSON.stringify(body)).not.toContain('adminUserIds');
    expect(JSON.stringify(body)).not.toContain('1');
  });

  it('returns null for an admin userId', () => {
    expect(requireAdmin('1', admins)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/auth/isAdminUser.test.ts`

Expected: FAIL with cannot find module `./isAdminUser` (or named export missing).

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/auth/isAdminUser.ts`:

```ts
import configManager from '@/lib/config';

export function normalizeAdminUserIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry) => String(entry).trim())
    .filter((entry) => entry.length > 0);
}

export function isAdminUserId(
  userId: string | number | null | undefined,
  adminUserIds: readonly string[],
): boolean {
  if (userId == null) {
    return false;
  }

  const id = String(userId).trim();
  if (!id) {
    return false;
  }

  return adminUserIds.includes(id);
}

export function getAdminUserIds(): string[] {
  return normalizeAdminUserIds(configManager.getConfig('adminUserIds', []));
}

export function isAdminUser(
  userId: string | number | null | undefined,
): boolean {
  return isAdminUserId(userId, getAdminUserIds());
}

export function requireAdmin(
  userId: string | number | null | undefined,
  adminUserIds: readonly string[] = getAdminUserIds(),
): Response | null {
  if (userId == null || !String(userId).trim()) {
    return Response.json(
      { message: 'Unauthorized - Authentication required' },
      { status: 401 },
    );
  }

  if (!isAdminUserId(userId, adminUserIds)) {
    return Response.json({ message: 'Forbidden' }, { status: 403 });
  }

  return null;
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/lib/auth/isAdminUser.test.ts`

Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/isAdminUser.ts src/lib/auth/isAdminUser.test.ts
git commit -m "feat: add isAdminUser helpers from config adminUserIds"
```

---

### Task 2: Public config helpers

**Files:**
- Create: `src/lib/config/publicConfig.ts`
- Test: `src/lib/config/publicConfig.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/config/publicConfig.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isForbiddenConfigKey, publicConfigValues } from './publicConfig';

describe('publicConfigValues', () => {
  it('omits adminUserIds without mutating the input', () => {
    const input = {
      version: 1,
      adminUserIds: ['1', '42'],
      preferences: { theme: 'dark' },
      personalization: { systemInstructions: 'be brief' },
    };

    const published = publicConfigValues(input);

    expect(published).toEqual({
      version: 1,
      preferences: { theme: 'dark' },
      personalization: { systemInstructions: 'be brief' },
    });
    expect(published).not.toHaveProperty('adminUserIds');
    expect(input.adminUserIds).toEqual(['1', '42']);
    expect(published.preferences).not.toBe(input.preferences);
  });
});

describe('isForbiddenConfigKey', () => {
  it('blocks adminUserIds and nested paths', () => {
    expect(isForbiddenConfigKey('adminUserIds')).toBe(true);
    expect(isForbiddenConfigKey('adminUserIds.0')).toBe(true);
    expect(isForbiddenConfigKey('theme')).toBe(false);
    expect(isForbiddenConfigKey('preferences.theme')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/config/publicConfig.test.ts`

Expected: FAIL with cannot find module `./publicConfig`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/config/publicConfig.ts`:

```ts
export function publicConfigValues<T extends Record<string, unknown>>(
  config: T,
): T {
  const clone = JSON.parse(JSON.stringify(config)) as T;
  delete (clone as Record<string, unknown>).adminUserIds;
  return clone;
}

export function isForbiddenConfigKey(key: string): boolean {
  return key === 'adminUserIds' || key.startsWith('adminUserIds.');
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/lib/config/publicConfig.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/config/publicConfig.ts src/lib/config/publicConfig.test.ts
git commit -m "feat: strip adminUserIds from public config values"
```

---

### Task 3: Wire config HTTP API

**Files:**
- Modify: `src/app/api/config/route.ts`

- [ ] **Step 1: Strip GET values and reject POST of adminUserIds**

Replace `src/app/api/config/route.ts` with:

```ts
import configManager from '@/lib/config';
import {
  isForbiddenConfigKey,
  publicConfigValues,
} from '@/lib/config/publicConfig';
import { NextRequest, NextResponse } from 'next/server';

type SaveConfigBody = {
  key: string;
  value: string;
};

export const GET = async (req: NextRequest) => {
  try {
    const values = publicConfigValues(
      configManager.getCurrentConfig() as Record<string, unknown>,
    );
    const fields = configManager.getUIConfigSections();

    return NextResponse.json({
      values,
      fields,
    });
  } catch (err) {
    console.error('Error in getting config: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const body: SaveConfigBody = await req.json();

    if (isForbiddenConfigKey(body.key)) {
      return Response.json({ message: 'Forbidden' }, { status: 403 });
    }

    if (!body.key || !body.value) {
      return Response.json(
        {
          message: 'Key and value are required.',
        },
        {
          status: 400,
        },
      );
    }

    configManager.updateConfig(body.key, body.value);

    return Response.json(
      {
        message: 'Config updated successfully.',
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error('Error in getting config: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
```

Check POST before the empty-key 400 so `adminUserIds` cannot be probed with a missing value either.

- [ ] **Step 2: Re-run helper tests (no route unit file)**

Run: `npx vitest run src/lib/config/publicConfig.test.ts src/lib/auth/isAdminUser.test.ts`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/config/route.ts
git commit -m "feat: hide and lock adminUserIds on config API"
```

---

### Task 4: Return isAdmin from permissions

**Files:**
- Modify: `src/app/api/permissions/route.ts`

- [ ] **Step 1: Add isAdmin next to the existing permission list**

Replace `src/app/api/permissions/route.ts` with:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { prismaSecondary } from '@/lib/postgres/db';
import { isAdminUser } from '@/lib/auth/isAdminUser';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 },
      );
    }

    const permissions = await prismaSecondary.$queryRawUnsafe<
      { cap_permission_code: string }[]
    >(
      `
        SELECT cap_permission_code
        FROM cap_user cu 
        INNER JOIN cap_user_role_m curm ON cu.id = curm.cap_user_id 
        INNER JOIN cap_role_permission_m crpm ON crpm.cap_role_id = curm.cap_role_id 
        WHERE crpm.cap_permission_code IN (
          'chatSfcAgent:execute',
          'chatGuideAgent:execute',
          'chatSurveyAgent:execute',
          'chatDocumentAgent:execute',
          'chatVoiceAgent:execute'
        ) 
        AND cu.id = $1
      `,
      parseInt(userId),
    );

    const permissionCodes = permissions.map((p) => p.cap_permission_code);

    return NextResponse.json({
      permissions: permissionCodes,
      isAdmin: isAdminUser(userId),
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 },
    );
  }
}
```

Do not catch iTMS errors and return `isAdmin: false` with 200. Keep the 500.

- [ ] **Step 2: Run existing agent tests plus admin helpers**

Run: `npx vitest run src/lib/agents.test.ts src/lib/auth/isAdminUser.test.ts`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/permissions/route.ts
git commit -m "feat: return isAdmin on permissions API"
```

---

### Task 5: Admin chats list API

**Files:**
- Create: `src/lib/auth/adminChatList.ts`
- Test: `src/lib/auth/adminChatList.test.ts`
- Create: `src/app/api/admin/chats/route.ts`
- Modify: `src/middleware.ts`

- [ ] **Step 1: Write the failing mapper test**

Create `src/lib/auth/adminChatList.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { toAdminChatListItem } from './adminChatList';

describe('toAdminChatListItem', () => {
  it('keeps list metadata and drops files and documentId', () => {
    const item = toAdminChatListItem({
      id: 'chat-1',
      title: 'How to file SPR',
      userId: '9',
      focusMode: 'agentDocument',
      createdAt: 'Mon Aug 21 2026',
      documentId: 'spr',
      files: [{ name: 'secret.pdf', fileId: 'f1' }],
    });

    expect(item).toEqual({
      id: 'chat-1',
      title: 'How to file SPR',
      userId: '9',
      focusMode: 'agentDocument',
      createdAt: 'Mon Aug 21 2026',
    });
    expect(item).not.toHaveProperty('files');
    expect(item).not.toHaveProperty('documentId');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/auth/adminChatList.test.ts`

Expected: FAIL with cannot find module `./adminChatList`.

- [ ] **Step 3: Write the mapper**

Create `src/lib/auth/adminChatList.ts`:

```ts
export type AdminChatListItem = {
  id: string;
  title: string;
  userId: string;
  focusMode: string;
  createdAt: string;
};

export function toAdminChatListItem(chat: {
  id: string;
  title: string;
  userId: string;
  focusMode: string;
  createdAt: string;
  documentId?: string | null;
  files?: unknown;
}): AdminChatListItem {
  return {
    id: chat.id,
    title: chat.title,
    userId: chat.userId,
    focusMode: chat.focusMode,
    createdAt: chat.createdAt,
  };
}
```

- [ ] **Step 4: Run mapper tests**

Run: `npx vitest run src/lib/auth/adminChatList.test.ts`

Expected: PASS.

- [ ] **Step 5: Add the route**

Create `src/app/api/admin/chats/route.ts`:

```ts
import db from '@/lib/db';
import { toAdminChatListItem } from '@/lib/auth/adminChatList';
import { requireAdmin } from '@/lib/auth/isAdminUser';

export const GET = async (req: Request) => {
  try {
    const userId = req.headers.get('x-user-id');
    const denied = requireAdmin(userId);
    if (denied) {
      return denied;
    }

    const rows = await db.query.chats.findMany();
    const chats = rows.map(toAdminChatListItem).reverse();

    return Response.json({ chats }, { status: 200 });
  } catch (err) {
    console.error('Error in getting admin chats: ', err);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
```

Do not add `?all=1` to `GET /api/chats`. Do not change `src/app/api/chats/route.ts` or `src/app/api/chats/[id]/route.ts`.

- [ ] **Step 6: Protect `/api/admin` in middleware**

Replace `src/middleware.ts` with:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth/verifyTokenEdge';

const PROTECTED_ROUTES = [
  '/api/chat',
  '/api/chats',
  '/api/permissions',
  '/api/documents',
  '/api/voice',
  '/api/admin',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  let token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    token = request.nextUrl.searchParams.get('token') || undefined;
  }

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication token required' },
      { status: 401 },
    );
  }

  try {
    const verified = await verifyTokenEdge(token);

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', verified.userId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired authentication token' },
      { status: 401 },
    );
  }
}

export const config = {
  matcher: [
    '/api/chat/:path*',
    '/api/chats/:path*',
    '/api/permissions/:path*',
    '/api/documents/:path*',
    '/api/documents',
    '/api/voice/:path*',
    '/api/admin/:path*',
  ],
};
```

Do not set `x-is-admin`. Overwrite only `x-user-id` as today.

- [ ] **Step 7: Run helper tests**

Run: `npx vitest run src/lib/auth/adminChatList.test.ts src/lib/auth/isAdminUser.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth/adminChatList.ts src/lib/auth/adminChatList.test.ts src/app/api/admin/chats/route.ts src/middleware.ts
git commit -m "feat: add requireAdmin chats list API"
```

---

### Task 6: Admin sidebar tab

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Fetch isAdmin and append the tab only when true**

`isAdmin` starts `false` so the tab never flashes for non-admins. Initialize the JWT from the URL before the permissions fetch so the first iframe load with `?token=` works (Agents page does this; Sidebar wraps every page).

Replace `src/components/Sidebar.tsx` with:

```tsx
'use client';

import { cn } from '@/lib/utils';
import { getAuthHeaders, initializeAuthToken } from '@/lib/utils/auth';
import {
  BookOpenText,
  Home,
  Search,
  SquarePen,
  Settings,
  Plus,
  ArrowLeft,
  LayoutGrid,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useSelectedLayoutSegments } from 'next/navigation';
import React, { useEffect, useState, type ReactNode } from 'react';
import Layout from './Layout';
import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';

const VerticalIconContainer = ({ children }: { children: ReactNode }) => {
  return <div className="flex flex-col items-center w-full">{children}</div>;
};

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const segments = useSelectedLayoutSegments();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    initializeAuthToken(searchParams);

    const loadAdmin = async () => {
      try {
        const response = await fetch('/itms/ai/api/permissions', {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          setIsAdmin(false);
          return;
        }
        const data = await response.json();
        setIsAdmin(data.isAdmin === true);
      } catch {
        setIsAdmin(false);
      }
    };

    void loadAdmin();
  }, [searchParams]);

  const navLinks = [
    {
      icon: LayoutGrid,
      href: '/agents',
      active: segments.includes('agents'),
      label: 'Agents',
    },
    {
      icon: BookOpenText,
      href: '/library',
      active: segments.includes('library'),
      label: 'History',
    },
    ...(isAdmin
      ? [
          {
            icon: Shield,
            href: '/admin',
            active: segments.includes('admin'),
            label: 'Admin',
          },
        ]
      : []),
  ];

  return (
    <div>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-[72px] lg:flex-col border-r border-light-200 dark:border-dark-200">
        <div className="flex grow flex-col items-center gap-y-5 overflow-y-auto py-8 shadow-sm shadow-light-200/10 dark:shadow-black/25" style={{ backgroundColor: '#0071CD' }}>
          <div className="flex-1 flex items-center w-full">
            <VerticalIconContainer>
              {navLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className={cn(
                    'relative flex flex-col items-center justify-center space-y-0.5 cursor-pointer w-full py-3 transition duration-200',
                    link.active
                      ? 'bg-[#5BA8D9] text-white'
                      : 'text-white/70 hover:bg-white/10',
                  )}
                >
                  <link.icon
                    size={25}
                    className="m-1.5"
                  />
                  <p className="text-xs font-bold">
                    {link.label}
                  </p>
                </Link>
              ))}
            </VerticalIconContainer>
          </div>

        </div>
      </div>

      <div className="fixed bottom-0 w-full z-50 flex flex-row items-center gap-x-6 px-4 py-4 shadow-sm lg:hidden" style={{ backgroundColor: '#0071CD' }}>
        {navLinks.map((link, i) => (
          <Link
            href={link.href}
            key={i}
            className={cn(
              'relative flex flex-col items-center space-y-1 text-center w-full py-2 rounded-lg transition duration-200',
              link.active
                ? 'bg-[#5BA8D9] text-white'
                : 'text-white/70 hover:bg-white/10',
            )}
          >
            <link.icon />
            <p className="text-sm font-bold">{link.label}</p>
          </Link>
        ))}
      </div>

      <Layout>{children}</Layout>
    </div>
  );
};

export default Sidebar;
```

Desktop and mobile both map `navLinks`, so both hide Admin when `isAdmin` is false.

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: show Admin sidebar tab for admin users"
```

---

### Task 7: Admin list page

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Add layout metadata**

Create `src/app/admin/layout.tsx`:

```tsx
import { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Admin - AI Agent',
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};

export default Layout;
```

- [ ] **Step 2: Add the list page**

Create `src/app/admin/page.tsx`. Copy History layout, but: redirect when not admin, load `/itms/ai/api/admin/chats`, show `userId`, title is not a `Link`, no `DeleteChat`.

```tsx
'use client';

import { cn, formatTimeDifference } from '@/lib/utils';
import {
  getAuthHeaders,
  initializeAuthToken,
} from '@/lib/utils/auth';
import { ClockIcon, Shield, User } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { focusModes } from '@/lib/agents';

export interface AdminChat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
  userId: string;
}

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    initializeAuthToken(searchParams);
    setTokenReady(true);
  }, [searchParams]);

  useEffect(() => {
    if (!tokenReady) {
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const permissionsRes = await fetch('/itms/ai/api/permissions', {
          headers: getAuthHeaders(),
        });

        if (!permissionsRes.ok) {
          router.replace('/agents');
          return;
        }

        const permissionsBody = await permissionsRes.json();
        if (permissionsBody.isAdmin !== true) {
          router.replace('/agents');
          return;
        }

        const chatsRes = await fetch('/itms/ai/api/admin/chats', {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (chatsRes.status === 403) {
          router.replace('/agents');
          return;
        }

        if (!chatsRes.ok) {
          setError('Failed to load chats.');
          setChats([]);
          return;
        }

        const data = await chatsRes.json();
        setChats(Array.isArray(data.chats) ? data.chats : []);
      } catch {
        setError('Failed to load chats.');
        setChats([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [tokenReady, router]);

  if (loading) {
    return (
      <div className="flex flex-row items-center justify-center min-h-screen">
        <svg
          aria-hidden="true"
          className="w-8 h-8 text-light-200 fill-light-secondary dark:text-[#202020] animate-spin dark:fill-[#ffffff3b]"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100.003 78.2051 78.1951 100.003 50.5908 100C22.9765 99.9972 0.997224 78.018 1 50.4037C1.00281 22.7993 22.8108 0.997224 50.4251 1C78.0395 1.00281 100.018 22.8108 100 50.4251ZM9.08164 50.594C9.06312 73.3997 27.7909 92.1272 50.5966 92.1457C73.4023 92.1642 92.1298 73.4365 92.1483 50.6308C92.1669 27.8251 73.4392 9.0973 50.6335 9.07878C27.8278 9.06026 9.10003 27.787 9.08164 50.594Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4037 97.8624 35.9116 96.9801 33.5533C95.1945 28.8227 92.871 24.3692 90.0681 20.348C85.6237 14.1775 79.4473 9.36872 72.0454 6.45794C64.6435 3.54717 56.3134 2.65431 48.3133 3.89319C45.869 4.27179 44.3768 6.77534 45.014 9.20079C45.6512 11.6262 48.1343 13.0956 50.5786 12.717C56.5073 11.8281 62.5542 12.5399 68.0406 14.7911C73.527 17.0422 78.2187 20.7487 81.5841 25.4923C83.7976 28.5886 85.4467 32.059 86.4416 35.7474C87.1273 38.1189 89.5423 39.6781 91.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col pt-4">
        <div className="flex items-center">
          <Shield />
          <h1 className="text-3xl font-medium p-2">Admin</h1>
        </div>
        <hr className="border-t border-[#2B2C2C] my-4 w-full" />
      </div>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
      {!error && chats.length === 0 && (
        <div className="flex flex-row items-center justify-center min-h-screen">
          <p className="text-black/70 dark:text-white/70 text-sm">
            No chats found.
          </p>
        </div>
      )}
      {chats.length > 0 && (
        <div className="flex flex-col pb-20 lg:pb-2">
          {chats.map((chat, i) => {
            const agent = focusModes.find((m) => m.key === chat.focusMode);
            return (
              <div
                className={cn(
                  'flex flex-col space-y-4 py-6',
                  i !== chats.length - 1
                    ? 'border-b border-white-200 dark:border-dark-200'
                    : '',
                )}
                key={chat.id}
              >
                <p className="text-black dark:text-white lg:text-xl font-medium truncate">
                  {chat.title}
                </p>
                <div className="flex flex-row items-center justify-between w-full">
                  <div className="flex flex-row items-center space-x-4">
                    {agent && (
                      <div className="flex flex-row items-center space-x-1 lg:space-x-1.5 text-black/70 dark:text-white/70">
                        <agent.icon size={15} />
                        <p className="text-xs">{agent.title}</p>
                      </div>
                    )}
                    <div className="flex flex-row items-center space-x-1 lg:space-x-1.5 text-black/70 dark:text-white/70">
                      <User size={15} />
                      <p className="text-xs">{chat.userId}</p>
                    </div>
                    <div className="flex flex-row items-center space-x-1 lg:space-x-1.5 text-black/70 dark:text-white/70">
                      <ClockIcon size={15} />
                      <p className="text-xs">
                        {formatTimeDifference(new Date(), chat.createdAt)} Ago
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Page;
```

Do not import `Link` or `DeleteChat`. Do not navigate to `/c/{id}`.

- [ ] **Step 3: Run unit tests**

Run: `npx vitest run src/lib/auth/isAdminUser.test.ts src/lib/auth/adminChatList.test.ts src/lib/config/publicConfig.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/layout.tsx src/app/admin/page.tsx
git commit -m "feat: add admin page listing all chat metadata"
```

---

### Task 8: Operator config and verification

**Files:**
- Local only: `data/config.json` (gitignored — do not `git add`)

- [ ] **Step 1: Add admin IDs on the running instance**

Edit local `data/config.json` and add a top-level array of JWT `id` strings. Example shape (use real operator IDs, not these placeholders, on the server):

```json
"adminUserIds": ["1"]
```

Restart `next dev` / the Node process so `ConfigManager` reloads. Missing, `[]`, or a non-array still means no admins.

- [ ] **Step 2: Run the full unit suite**

Run: `npx vitest run`

Expected: PASS (existing tests plus the three new files).

- [ ] **Step 3: Browser / curl checks (do not claim done until these pass)**

Use a valid JWT in `Authorization: Bearer <token>`.

1. User **not** in `adminUserIds`: Agents and History tabs only (desktop and a mobile-width window). `/itms/ai/admin` ends on Agents. `GET /itms/ai/api/admin/chats` → 403 `{ "message": "Forbidden" }`.
2. User **in** the list: Admin tab visible. `/itms/ai/admin` lists chats with other `userId`s. Titles are not links. No trash control.
3. `GET /itms/ai/api/config` JSON `values` has no `adminUserIds`.
4. `POST /itms/ai/api/config` with `{ "key": "adminUserIds", "value": "[\"9\"]" }` → 403.
5. History `/itms/ai/library` still lists only the caller’s chats. Opening someone else’s `/itms/ai/c/{id}` still 403s.

No commit for `data/config.json`.
