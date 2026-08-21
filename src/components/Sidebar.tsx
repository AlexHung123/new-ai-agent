'use client';

import { cn } from '@/lib/utils';
import { getAuthHeaders, initializeAuthToken } from '@/lib/utils/auth';
import {
  BookOpenText,
  LayoutGrid,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useSelectedLayoutSegments } from 'next/navigation';
import React, { useEffect, useState, type ReactNode } from 'react';
import Layout from './Layout';

const VerticalIconContainer = ({ children }: { children: ReactNode }) => {
  return <div className="flex flex-col items-center w-full">{children}</div>;
};

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const segments = useSelectedLayoutSegments();
  const searchParams = useSearchParams();
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

      <Layout wide={segments.includes('agents')}>{children}</Layout>
    </div>
  );
};

export default Sidebar;
