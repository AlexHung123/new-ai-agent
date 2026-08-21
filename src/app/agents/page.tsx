'use client';

import { useChat } from '@/lib/hooks/useChat';
import Image from 'next/image';
import { focusModes } from '@/lib/agents';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { initializeAuthToken, getAuthHeaders } from '@/lib/utils/auth';

const AgentsPage = () => {
  const { setFocusMode } = useChat();
  const searchParams = useSearchParams();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredModes, setFilteredModes] = useState(focusModes);
  const [tokenReady, setTokenReady] = useState(false);

  // Initialize token from URL on component mount
  useEffect(() => {
    initializeAuthToken(searchParams);
    setTokenReady(true);
  }, [searchParams]);

  useEffect(() => {
    // Wait for token to be initialized before fetching permissions
    if (!tokenReady) {
      return;
    }

    const fetchPermissions = async () => {
      try {
        const response = await fetch(`/itms/ai/api/permissions`, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          console.error(
            'Failed to fetch permissions:',
            response.status,
            response.statusText,
          );
          setUserPermissions([]);
          setFilteredModes([]);
          return;
        }

        const data = await response.json();
        setUserPermissions(data.permissions || []);

        // Filter agents based on permissions
        const filtered = focusModes.filter((mode) => {
          if (!mode.permissionCode) {
            return true; // Show agents without permission requirements
          }
          return data.permissions?.includes(mode.permissionCode);
        });

        console.log('Filtered modes:', filtered);

        setFilteredModes(filtered);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        // On error, set permissions to empty array and show no agents
        setUserPermissions([]);
        setFilteredModes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [tokenReady]);

  const handleSelect = (key: string) => {
    const mode = focusModes.find((item) => item.key === key);
    if (mode?.kind === 'tool' && mode.href) {
      window.location.href = `/itms/ai${mode.href}`;
      return;
    }

    setFocusMode(key);
    // Use window.location to force a full page reload and start fresh
    window.location.href = '/itms/ai/';
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-black/60 dark:text-white/60">Loading agents...</p>
        </div>
      </div>
    );
  }

  if (filteredModes.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-black/60 dark:text-white/60">
            No agents available for your account.
          </p>
          <p className="mt-2 text-sm text-black/40 dark:text-white/40">
            Please contact your administrator for access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full">
      {/* Decorative Background Elements */}
      <div className="pointer-events-none fixed -left-40 -top-40 z-0 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[100px] dark:bg-blue-900/20" />
      <div className="pointer-events-none fixed -right-40 top-40 z-0 h-[500px] w-[500px] rounded-full bg-purple-400/10 blur-[100px] dark:bg-purple-900/20" />

      <div className="relative z-10 mx-auto w-full pb-24 pt-6 md:pt-10">
        <div className="mb-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-3 text-4xl font-bold tracking-tight text-black dark:text-white md:text-5xl"
          >
            Choose Your AI Agent
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto max-w-2xl text-base text-black/60 dark:text-white/60 md:text-lg"
          >
            Please select a specialized AI agent as your assistant.
          </motion.p>
        </div>

        <div className="overflow-x-auto py-6">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex w-max min-w-full flex-nowrap justify-center gap-6"
          >
            {filteredModes.map((mode) => (
              <motion.button
                key={mode.key}
                variants={item}
                onClick={() => handleSelect(mode.key)}
                whileHover={{ scale: 1.02, translateY: -5 }}
                whileTap={{ scale: 0.98 }}
                className="group relative flex w-[18rem] shrink-0 flex-col overflow-hidden rounded-3xl border border-white/50 bg-white/80 text-left shadow-lg backdrop-blur-sm transition-all hover:border-blue-200 hover:shadow-2xl dark:border-white/10 dark:bg-gray-900/80 dark:hover:border-blue-500/30"
              >
              <div className="relative h-52 w-full overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative h-full w-full transition-transform duration-700 ease-out group-hover:scale-105">
                  <Image
                    src={mode.image}
                    alt={mode.title}
                    fill
                    sizes="288px"
                    className="object-contain"
                    priority
                  />
                </div>

                <div className="absolute bottom-4 right-4 z-20 translate-y-10 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400">
                    <ArrowRight size={22} />
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#24A0ED] transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-400 dark:group-hover:bg-blue-500 dark:group-hover:text-white">
                    <mode.icon size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-black dark:text-white">
                    {mode.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-black/60 dark:text-white/60">
                  {mode.description}
                </p>
              </div>
            </motion.button>
          ))}
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AgentsPage;
