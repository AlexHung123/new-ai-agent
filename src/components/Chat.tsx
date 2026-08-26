'use client';

import { useEffect, useRef, useState } from 'react';
import MessageInput from './MessageInput';
import MessageBox from './MessageBox';
import MessageBoxLoading from './MessageBoxLoading';
import { useChat } from '@/lib/hooks/useChat';
import { findDisplayFocusMode } from '@/lib/agents';
import WritingFileBrowser from './WritingFileBrowser';
import Link from 'next/link';

const Chat = () => {
  const {
    sections,
    chatTurns,
    loading,
    messageAppeared,
    progress,
    rewrite,
    agentProcess,
    focusMode,
  } = useChat();
  const currentAgent = findDisplayFocusMode(focusMode);
  const isToolChat = currentAgent?.kind === 'tool';

  const columnRef = useRef<HTMLDivElement | null>(null);
  const messageEnd = useRef<HTMLDivElement | null>(null);
  const [dock, setDock] = useState({ width: 0, left: 0 });

  useEffect(() => {
    const updateDock = () => {
      if (!columnRef.current) return;
      const rect = columnRef.current.getBoundingClientRect();
      setDock({ width: rect.width, left: rect.left });
    };

    updateDock();
    window.addEventListener('resize', updateDock);
    return () => window.removeEventListener('resize', updateDock);
  }, [sections.length]);

  useEffect(() => {
    const scroll = (behavior: ScrollBehavior = 'auto') => {
      messageEnd.current?.scrollIntoView({ behavior });
    };

    if (chatTurns.length === 1) {
      document.title = `${chatTurns[0].content.substring(0, 30)} - iTMS`;
    }

    const messageEndBottom =
      messageEnd.current?.getBoundingClientRect().bottom ?? 0;

    const distanceFromMessageEnd = window.innerHeight - messageEndBottom;

    if (distanceFromMessageEnd >= -100) {
      scroll('auto');
    }

    if (chatTurns[chatTurns.length - 1]?.role === 'user') {
      setTimeout(() => scroll('smooth'), 100);
    }
  }, [chatTurns]);

  useEffect(() => {
    if (loading) {
      setTimeout(
        () => messageEnd.current?.scrollIntoView({ behavior: 'smooth' }),
        100,
      );
    }
  }, [loading]);

  return (
    <div className="wiki-chat">
      {focusMode === 'agentWriting' ? (
        <div className="writing-file-browser-chat">
          <WritingFileBrowser />
        </div>
      ) : null}
      <div ref={columnRef} className="message-list">
        {sections.map((section, i) => {
          const isLast = i === sections.length - 1;

          return (
            <MessageBox
              key={section.userMessage.messageId}
              section={section}
              sectionIndex={i}
              isLast={isLast}
              loading={loading}
              rewrite={rewrite}
            />
          );
        })}
        {loading && !messageAppeared && !agentProcess && (
          <MessageBoxLoading progress={progress} />
        )}
        <div ref={messageEnd} className="h-0" />
      </div>
      {dock.width > 0 && (
        <div
          className="wiki-chat-composer-dock"
          style={{ width: dock.width, left: dock.left }}
        >
          {isToolChat ? (
            <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/70 dark:border-white/10 dark:bg-gray-950 dark:text-white/70">
              {currentAgent?.href ? (
                <Link
                  href={currentAgent.href}
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Generate more speech
                </Link>
              ) : (
                'This history item cannot be continued as a chat.'
              )}
            </div>
          ) : (
            <MessageInput />
          )}
        </div>
      )}
    </div>
  );
};

export default Chat;
