'use client';

import { formatTimeDifference } from '@/lib/utils';
import {
  getAuthHeaders,
  initializeAuthToken,
} from '@/lib/utils/auth';
import { parseAdminChatQuery } from '@/lib/auth/adminChatQuery';
import { Shield } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { findDisplayFocusMode } from '@/lib/agents';

export interface AdminChat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
  userId: string;
  dpId?: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function adminQueryHref(next: { q: string; page: number; pageSize: number }) {
  const params = new URLSearchParams();
  if (next.q) params.set('q', next.q);
  if (next.page > 1) params.set('page', String(next.page));
  if (next.pageSize !== 10) params.set('pageSize', String(next.pageSize));
  const search = params.toString();
  return search ? `/admin?${search}` : '/admin';
}

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = useMemo(
    () =>
      parseAdminChatQuery({
        q: searchParams.get('q'),
        page: searchParams.get('page'),
        pageSize: searchParams.get('pageSize'),
      }),
    [searchParams],
  );
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(query.page);
  const [pageCount, setPageCount] = useState(1);
  const [pageSize, setPageSize] = useState(query.pageSize);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [draftQ, setDraftQ] = useState(query.q);

  useEffect(() => {
    initializeAuthToken(searchParams);
    setTokenReady(true);
  }, [searchParams]);

  useEffect(() => {
    setDraftQ(query.q);
  }, [query.q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextQ = draftQ.trim();
      if (nextQ === query.q) {
        return;
      }
      router.replace(
        adminQueryHref({ q: nextQ, page: 1, pageSize: query.pageSize }),
      );
    }, 300);
    return () => window.clearTimeout(handle);
  }, [draftQ, query.q, query.pageSize, router]);

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

        const params = new URLSearchParams();
        if (query.q) params.set('q', query.q);
        params.set('page', String(query.page));
        params.set('pageSize', String(query.pageSize));

        const chatsRes = await fetch(
          `/itms/ai/api/admin/chats?${params.toString()}`,
          {
            method: 'GET',
            headers: getAuthHeaders(),
          },
        );

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
        setTotal(typeof data.total === 'number' ? data.total : 0);
        setPage(typeof data.page === 'number' ? data.page : query.page);
        setPageSize(
          typeof data.pageSize === 'number' ? data.pageSize : query.pageSize,
        );
        setPageCount(
          typeof data.pageCount === 'number' ? data.pageCount : 1,
        );
      } catch {
        setError('Failed to load chats.');
        setChats([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [tokenReady, router, query.q, query.page, query.pageSize]);

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(total, page * pageSize);

  if (loading && chats.length === 0 && !error) {
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
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {!error && (
        <div className="flex flex-col gap-4 pb-20 lg:pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="search"
              value={draftQ}
              onChange={(event) => setDraftQ(event.target.value)}
              placeholder="Search title, user, or agent"
              className="w-full rounded-lg border border-light-200 bg-light-secondary px-3 py-2 text-sm dark:border-dark-200 dark:bg-dark-secondary dark:text-white sm:max-w-sm"
              aria-label="Search chats"
            />
            <label className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70">
              Per page
              <select
                value={pageSize}
                onChange={(event) => {
                  router.replace(
                    adminQueryHref({
                      q: query.q,
                      page: 1,
                      pageSize: Number(event.target.value),
                    }),
                  );
                }}
                className="rounded-lg border border-light-200 bg-light-secondary px-2 py-1.5 text-sm dark:border-dark-200 dark:bg-dark-secondary dark:text-white"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-light-200 bg-light-secondary text-black/70 dark:border-dark-200 dark:bg-dark-secondary dark:text-white/70">
                  <th className="px-3 py-2.5 text-left font-semibold">Title</th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold">
                    User
                  </th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold">
                    Agent
                  </th>
                  <th className="whitespace-nowrap px-3 py-2.5 text-left font-semibold">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {chats.length === 0 ? (
                  <tr>
                    <td
                      className="px-3 py-8 text-center text-black/70 dark:text-white/70"
                      colSpan={4}
                    >
                      No chats found.
                    </td>
                  </tr>
                ) : (
                  chats.map((chat) => {
                    const agent = findDisplayFocusMode(chat.focusMode);
                    return (
                      <tr
                        key={chat.id}
                        className="border-b border-light-200 dark:border-dark-200"
                      >
                        <td className="max-w-xl truncate px-3 py-2.5 font-medium text-black dark:text-white">
                          {chat.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-black/70 dark:text-white/70">
                          {chat.dpId ?? chat.userId}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-black/70 dark:text-white/70">
                          <span className="inline-flex items-center gap-1.5">
                            {agent ? <agent.icon size={15} /> : null}
                            {agent?.title ?? chat.focusMode}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-black/70 dark:text-white/70">
                          {formatTimeDifference(new Date(), chat.createdAt)} Ago
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-black/70 dark:text-white/70">
              {total === 0
                ? '0 chats'
                : `${rangeStart}–${rangeEnd} of ${total}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  router.replace(
                    adminQueryHref({
                      q: query.q,
                      page: page - 1,
                      pageSize,
                    }),
                  )
                }
                className="rounded-lg border border-light-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-dark-200"
              >
                Previous
              </button>
              <span className="text-sm text-black/70 dark:text-white/70">
                Page {page} of {pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() =>
                  router.replace(
                    adminQueryHref({
                      q: query.q,
                      page: page + 1,
                      pageSize,
                    }),
                  )
                }
                className="rounded-lg border border-light-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-dark-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
