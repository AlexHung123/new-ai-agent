import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, serial, text } from 'drizzle-orm/pg-core';
import type { PptDeckState } from '@/lib/ppt/types';
import { Document } from '@langchain/core/documents';

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  role: text('type', { enum: ['assistant', 'user', 'source'] }).notNull(),
  chatId: text('chatId').notNull(),
  userId: text('userId').notNull(),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  messageId: text('messageId').notNull(),
  content: text('content'),
  sources: jsonb('sources')
    .$type<Document[]>()
    .default(sql`'[]'::jsonb`),
});

export type ChatFile = {
  name: string;
  fileId: string;
  status?: 'ready' | 'failed';
  relDir?: string;
  parts?: number;
  charCount?: number;
  format?: string;
  error?: string;
};

export const chats = pgTable('chats', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  userId: text('userId').notNull(),
  createdAt: text('createdAt').notNull(),
  focusMode: text('focusMode').notNull(),
  documentId: text('documentId'),
  files: jsonb('files')
    .$type<ChatFile[]>()
    .default(sql`'[]'::jsonb`),
});

export const pptDecks = pgTable(
  'ppt_decks',
  {
    chatId: text('chatId').primaryKey(),
    userId: text('userId').notNull(),
    stage: text('stage').notNull(),
    deck: jsonb('deck').$type<PptDeckState>().notNull(),
    updatedAt: text('updatedAt').notNull(),
  },
  (table) => ({
    userIdIdx: index('ppt_decks_userId_idx').on(table.userId),
  }),
);

export const userFiles = pgTable(
  'user_files',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    name: text('name').notNull(),
    mimeType: text('mimeType'),
    sizeBytes: integer('sizeBytes').notNull().default(0),
    status: text('status').notNull(),
    format: text('format'),
    relDir: text('relDir'),
    parts: integer('parts').notNull().default(0),
    charCount: integer('charCount').notNull().default(0),
    error: text('error'),
    createdAt: text('createdAt').notNull(),
  },
  (table) => ({
    userIdIdx: index('user_files_userId_idx').on(table.userId),
  }),
);

export const sfcQuestionM = pgTable('sfc_question_m', {
  id: integer('id').primaryKey(),
  year: text('year').notNull(),
  answerNo: text('answerNo').notNull(),
  questionNo: text('questionNo').notNull(),
  enLink: text('enLink'),
  tcLink: text('tcLink'),
});
