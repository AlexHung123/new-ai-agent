'use client';

import { useEffect, useRef } from 'react';
import MessageInput from './MessageInput';
import MessageBox from './MessageBox';
import MessageBoxLoading from './MessageBoxLoading';
import { useChat } from '@/lib/hooks/useChat';
import { findDisplayFocusMode } from '@/lib/agents';
import { isScrollAtTail } from '@/lib/chat/scroll';
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

  const listRef = useRef<HTMLDivElement | null>(null);
  const stickToBottom = useRef(true);

  const isNearBottom = () => {
    const el = listRef.current;
    if (!el) return true;
    return isScrollAtTail(el.scrollTop, el.clientHeight, el.scrollHeight);
  };

  const scrollToEnd = (behavior: ScrollBehavior = 'auto') => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      stickToBottom.current = isNearBottom();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (chatTurns.length === 1) {
      document.title = `${chatTurns[0].content.substring(0, 30)} - iTMS`;
    }

    if (chatTurns[chatTurns.length - 1]?.role === 'user') {
      stickToBottom.current = true;
      setTimeout(() => scrollToEnd('smooth'), 100);
      return;
    }

    if (stickToBottom.current) scrollToEnd('auto');
  }, [chatTurns]);

  useEffect(() => {
    if (!loading) return;
    if (!stickToBottom.current) return;
    scrollToEnd('auto');
  }, [loading, agentProcess?.steps.length, agentProcess?.status]);

  return (
    <div className="wiki-chat">
      <div ref={listRef} className="message-list">
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
      </div>
      <div className="wiki-chat-composer-dock">
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
    </div>
  );
};

export default Chat;
