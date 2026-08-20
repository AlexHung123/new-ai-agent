import crypto from 'crypto';
import eventEmitter from 'events';
import type { Document } from '@langchain/core/documents';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import db from '@/lib/db';
import { chats, messages as messagesSchema } from '@/lib/db/schema';
import { and, eq, gt } from 'drizzle-orm';
import { searchHandlers } from '@/lib/search';
import { z } from 'zod';
import { bindChatEmitterToWriter } from '@/lib/chat/bindChatEmitter';
import {
  loadConfiguredChatModel,
  NoopEmbeddings,
} from '@/lib/models/configuredChatModel';
import {
  documentRootAbs,
  resolveDocument,
} from '@/lib/documents/catalog';
import { resolveBoundDocument } from '@/lib/documents/resolveBoundDocument';
import {
  runWithDocumentTurn,
  type DocumentTurnContext,
} from '@/lib/search/shared/runtime/documentTurnContext';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const messageSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  chatId: z.string().min(1, 'Chat ID is required'),
  content: z.string().min(1, 'Message content is required'),
});

const bodySchema = z.object({
  message: messageSchema,
  // userId is now provided by middleware from verified token, not from client
  userId: z.string().optional(),
  optimizationMode: z.enum(['speed', 'balanced', 'quality'], {
    errorMap: () => ({
      message: 'Optimization mode must be one of: speed, balanced, quality',
    }),
  }),
  focusMode: z.string().min(1, 'Focus mode is required'),
  history: z
    .array(
      z.tuple([z.string(), z.string()], {
        errorMap: () => ({
          message: 'History items must be tuples of two strings',
        }),
      }),
    )
    .optional()
    .default([]),
  systemInstructions: z.string().nullable().optional().default(''),
  sfcExactMatch: z.boolean().optional(),
  sfcTrainingRelated: z.boolean().optional(),
  documentId: z.string().optional(),
});

type Message = z.infer<typeof messageSchema>;
type Body = z.infer<typeof bodySchema>;

export type RatingItem = { count: number; value: string };
export type FreeTextItem = { answer: string };

export type Group = RatingItem[] | FreeTextItem[];

export type Survey = Record<string, Group>;

export type RatingsOnly = Record<string, RatingItem[]>;
export type FreeTextOnly = Record<string, FreeTextItem[]>;

const safeValidateBody = (data: unknown) => {
  const result = bodySchema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    };
  }

  return {
    success: true,
    data: result.data,
  };
};

function unavailableDocumentEmitter() {
  const emitter = new eventEmitter();
  queueMicrotask(() => {
    emitter.emit(
      'data',
      JSON.stringify({
        type: 'response',
        data: 'This document is currently unavailable.',
      }),
    );
    emitter.emit('end');
  });
  return emitter;
}

const handleHistorySave = async (
  message: Message,
  humanMessageId: string,
  focusMode: string,
  userId: string,
  documentId?: string | null,
) => {
  const chat = await db.query.chats.findFirst({
    where: eq(chats.id, message.chatId),
  });

  if (!chat) {
    await db
      .insert(chats)
      .values({
        id: message.chatId,
        title: message.content,
        userId: userId,
        createdAt: new Date().toString(),
        focusMode: focusMode,
        documentId: documentId ?? null,
        files: [],
      })
      .execute();
  }

  const messageExists = await db.query.messages.findFirst({
    where: eq(messagesSchema.messageId, humanMessageId),
  });

  if (!messageExists) {
    await db
      .insert(messagesSchema)
      .values({
        content: message.content,
        chatId: message.chatId,
        userId: userId,
        messageId: humanMessageId,
        role: 'user',
        createdAt: new Date().toString(),
      })
      .execute();
  } else {
    await db
      .delete(messagesSchema)
      .where(
        and(
          gt(messagesSchema.id, messageExists.id),
          eq(messagesSchema.chatId, message.chatId),
        ),
      )
      .execute();
  }
};

export const POST = async (req: Request) => {
  try {
    // Get userId from middleware (verified from token)
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return Response.json(
        { message: 'Unauthorized - Authentication required' },
        { status: 401 },
      );
    }

    let reqBody: Body;
    try {
      reqBody = (await req.json()) as Body;
    } catch (e) {
      return Response.json(
        { message: 'Invalid request body' },
        { status: 400 },
      );
    }

    const parseBody = safeValidateBody(reqBody);
    if (!parseBody.success) {
      return Response.json(
        { message: 'Invalid request body', error: parseBody.error },
        { status: 400 },
      );
    }

    const body = parseBody.data as Body;
    const { message } = body;

    if (message.content === '') {
      return Response.json(
        {
          message: 'Please provide a message to process',
        },
        { status: 400 },
      );
    }

    const llm = loadConfiguredChatModel();
    const embedding = new NoopEmbeddings();

    const humanMessageId =
      message.messageId ?? crypto.randomBytes(7).toString('hex');
    // Frontend live turns use 'human'; reloaded chats may use 'user'.
    const history: BaseMessage[] = body.history.map((msg) => {
      const role = (msg[0] || '').toLowerCase();
      if (role === 'human' || role === 'user') {
        return new HumanMessage({
          content: msg[1],
        });
      }
      return new AIMessage({
        content: msg[1],
      });
    });

    const handler = searchHandlers[body.focusMode];

    if (!handler) {
      return Response.json(
        {
          message: 'Invalid focus mode',
        },
        { status: 400 },
      );
    }

    const existingChat = await db.query.chats.findFirst({
      where: eq(chats.id, message.chatId),
    });
    const bound = resolveBoundDocument({
      focusMode: body.focusMode,
      chatExists: Boolean(existingChat),
      existingDocumentId: existingChat?.documentId,
      bodyDocumentId: body.documentId,
    });
    if (bound.status === 'error') {
      return Response.json({ message: bound.message }, { status: 400 });
    }

    let documentTurn: DocumentTurnContext | undefined;
    if (bound.status === 'ok') {
      const slot = resolveDocument(bound.documentId);
      if (!slot) {
        if (!existingChat) {
          return Response.json(
            { message: 'Unknown or unavailable document' },
            { status: 400 },
          );
        }
      } else {
        documentTurn = {
          id: slot.id,
          title: slot.title,
          rootAbs: documentRootAbs(slot),
        };
      }
    }

    const runSearch = () =>
      handler.searchAndAnswer(
        message.content,
        history,
        llm,
        embedding,
        body.optimizationMode,
        [],
        body.systemInstructions as string,
        req.signal,
        body.sfcExactMatch,
        body.sfcTrainingRelated,
        req,
      );

    const stream =
      bound.status === 'ok' && !documentTurn
        ? unavailableDocumentEmitter()
        : documentTurn
          ? await runWithDocumentTurn(documentTurn, runSearch)
          : await runSearch();

    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    bindChatEmitterToWriter({
      stream,
      writer,
      encoder,
      signal: req.signal,
      chatId: message.chatId,
      userId,
      persistAssistant: ({ content, messageId }) =>
        db
          .insert(messagesSchema)
          .values({
            content,
            chatId: message.chatId,
            userId,
            messageId,
            role: 'assistant',
            createdAt: new Date().toString(),
          })
          .execute(),
      persistSources: ({ sources, messageId }) =>
        db
          .insert(messagesSchema)
          .values({
            chatId: message.chatId,
            userId,
            messageId,
            role: 'source',
            sources: sources as Document[],
            createdAt: new Date().toString(),
          })
          .execute(),
    });
    handleHistorySave(
      message,
      humanMessageId,
      body.focusMode,
      userId,
      bound.status === 'ok' ? bound.documentId : null,
    );

    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (err) {
    console.error('An error occurred while processing chat request:', err);
    return Response.json(
      { message: 'An error occurred while processing chat request' },
      { status: 500 },
    );
  }
};
