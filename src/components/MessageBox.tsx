'use client';

import React, { memo } from 'react';
import Markdown, { MarkdownToJSX } from 'markdown-to-jsx';
import Copy from './MessageActions/Copy';
import Rewrite from './MessageActions/Rewrite';
import MessageSources from './MessageSources';
import ThinkBox from './ThinkBox';
import AgentProcessPanel from './AgentProcessPanel';
import { useChat, Section } from '@/lib/hooks/useChat';
import { findDisplayFocusMode } from '@/lib/agents';
import { injectPageCiteMarkup } from '@/lib/reading/pageCitations';
import { PageCiteButton, PageCiteText } from './PageCiteText';

const ThinkTagProcessor = ({
  children,
  thinkingEnded,
}: {
  children: React.ReactNode;
  thinkingEnded: boolean;
}) => {
  return (
    <ThinkBox content={children as string} thinkingEnded={thinkingEnded} />
  );
};

function formatMessageTime(value: Date | string | undefined): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PageCiteOverride = ({
  page,
  children,
}: {
  page?: string | number;
  children?: React.ReactNode;
}) => {
  const { setReaderPage } = useChat();
  const n = Number(page);
  if (!Number.isFinite(n) || n < 1) return <>{children}</>;
  return (
    <PageCiteButton page={n} onJump={setReaderPage}>
      {children}
    </PageCiteButton>
  );
};

const MemoizedMessageContent = memo(
  ({
    content,
    thinkingEnded,
    enablePageCites,
  }: {
    content: string;
    thinkingEnded: boolean;
    enablePageCites?: boolean;
  }) => {
    const markdownOverrides: MarkdownToJSX.Options = {
      overrides: {
        think: {
          component: ThinkTagProcessor,
          props: {
            thinkingEnded: thinkingEnded,
          },
        },
        pageref: {
          component: PageCiteOverride,
        },
      },
    };

    const rendered = enablePageCites ? injectPageCiteMarkup(content) : content;

    return (
      <Markdown
        className="content markdown"
        options={markdownOverrides}
      >
        {rendered}
      </Markdown>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      prevProps.thinkingEnded === nextProps.thinkingEnded &&
      prevProps.enablePageCites === nextProps.enablePageCites
    );
  },
);

MemoizedMessageContent.displayName = 'MemoizedMessageContent';

const MessageBox = memo(
  ({
    section,
    isLast,
    loading,
    rewrite,
  }: {
    section: Section;
    sectionIndex: number;
    isLast: boolean;
    loading: boolean;
    rewrite: (messageId: string) => void;
  }) => {
    const parsedMessage = section.parsedAssistantMessage || '';
    const thinkingEnded = section.thinkingEnded;
    const { agentProcess, focusMode, setReaderPage } = useChat();
    const timestamp = formatMessageTime(section.userMessage.createdAt);
    const hideRewrite = findDisplayFocusMode(focusMode)?.kind === 'tool';
    const enablePageCites = focusMode === 'agentReader';

    return (
      <div
        className="message-turn"
        data-message-id={section.userMessage.messageId}
      >
        <div className="message user">
          <div className="message-user-wrap">
            <div className="message-bubble">
              <div className="content">
                {enablePageCites ? (
                  <PageCiteText
                    text={section.userMessage.content}
                    onJump={setReaderPage}
                  />
                ) : (
                  section.userMessage.content
                )}
              </div>
            </div>
            {timestamp ? (
              <time
                className="message-time"
                dateTime={
                  section.userMessage.createdAt instanceof Date
                    ? section.userMessage.createdAt.toISOString()
                    : String(section.userMessage.createdAt)
                }
                suppressHydrationWarning
              >
                {timestamp}
              </time>
            ) : null}
          </div>
        </div>

        {(isLast && agentProcess) || section.assistantMessage ? (
          <div className="message assistant">
            <div className="message-body">
              {isLast && agentProcess ? (
                <AgentProcessPanel process={agentProcess} />
              ) : null}

              {section.assistantMessage && (
                <>
                  <MemoizedMessageContent
                    content={parsedMessage}
                    thinkingEnded={thinkingEnded}
                    enablePageCites={enablePageCites}
                  />

                  {loading && isLast ? null : (
                    <div className="flex flex-row items-center justify-between w-full text-black dark:text-white py-3 -mx-2">
                      <div className="flex flex-row items-center space-x-1">
                        {hideRewrite ? null : (
                          <Rewrite
                            rewrite={rewrite}
                            messageId={section.assistantMessage.messageId}
                          />
                        )}
                        {section.sourceMessage &&
                          section.sourceMessage.sources.length > 0 && (
                            <MessageSources
                              sources={section.sourceMessage.sources}
                            />
                          )}
                      </div>
                      <div className="flex flex-row items-center space-x-1">
                        <Copy
                          initialMessage={section.assistantMessage.content}
                          section={section}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);

MessageBox.displayName = 'MessageBox';

export default MessageBox;
