import { sql } from 'drizzle-orm';
import { integer, jsonb, pgTable, serial, text } from 'drizzle-orm/pg-core';
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

interface File {
  name: string;
  fileId: string;
}

export const chats = pgTable('chats', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  userId: text('userId').notNull(),
  createdAt: text('createdAt').notNull(),
  focusMode: text('focusMode').notNull(),
  documentId: text('documentId'),
  files: jsonb('files')
    .$type<File[]>()
    .default(sql`'[]'::jsonb`),
});

export const sfcQuestionM = pgTable('sfc_question_m', {
  id: integer('id').primaryKey(),
  year: text('year').notNull(),
  answerNo: text('answerNo').notNull(),
  questionNo: text('questionNo').notNull(),
  enLink: text('enLink'),
  tcLink: text('tcLink'),
});
