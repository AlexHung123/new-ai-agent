'use client';

import React from 'react';
import { Document } from '@langchain/core/documents';
import { AlertCircle } from 'lucide-react';
import NextError from 'next/error';
import { motion, AnimatePresence } from 'framer-motion';

import Navbar from './Navbar';
import Chat from './Chat';
import AgentCard from './AgentCard';
import EmptyChat from './EmptyChat';
import Loader from './ui/Loader';
import SettingsButtonMobile from './Settings/SettingsButtonMobile';
import { useChat } from '@/lib/hooks/useChat';

export interface BaseMessage {
  chatId: string;
  messageId: string;
  createdAt: Date;
}

export interface AssistantMessage extends BaseMessage {
  role: 'assistant';
  content: string;
  suggestions?: string[];
}

export interface UserMessage extends BaseMessage {
  role: 'user';
  content: string;
}

export interface SourceMessage extends BaseMessage {
  role: 'source';
  sources: Document[];
}

export interface SuggestionMessage extends BaseMessage {
  role: 'suggestion';
  suggestions: string[];
}

export type Message =
  | AssistantMessage
  | UserMessage
  | SourceMessage
  | SuggestionMessage;

export type ChatTurn = UserMessage | AssistantMessage;

export interface File {
  fileName: string;
  fileExtension: string;
  fileId: string;
}

const ChatWindow = () => {
  const { hasError, isReady, notFound, messages } = useChat();

  if (hasError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-light-primary p-4 text-center dark:bg-dark-primary">
        <div className="absolute right-5 top-5">
          <SettingsButtonMobile />
        </div>
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex w-full max-w-md flex-col items-center rounded-2xl border border-red-100 bg-red-50/50 p-8 shadow-sm backdrop-blur-sm dark:border-red-900/30 dark:bg-red-900/10"
        >
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Connection Failed
          </h2>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
            We couldn't connect to the server. Please check your internet connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Reload Page
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex min-h-screen flex-row items-center justify-center bg-light-primary dark:bg-dark-primary">
        <Loader />
      </div>
    );
  }

  if (notFound) {
    return <NextError statusCode={404} />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="chat-window"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative min-h-screen"
      >
        {messages.length > 0 ? (
          <>
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
                className="fixed left-20 top-24 z-30 ml-4 hidden xl:block"
            >
              <AgentCard />
            </motion.div>
            <Navbar />
            <Chat />
          </>
        ) : (
          <EmptyChat />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatWindow;