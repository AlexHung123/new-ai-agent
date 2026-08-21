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
