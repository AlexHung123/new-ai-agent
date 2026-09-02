import crypto from 'crypto';
import type { EventEmitter } from 'events';
import { assistantContentAfterAbort } from './abortedReply';

export type PersistAssistantRow = {
  content: string;
  chatId: string;
  userId: string;
  messageId: string;
  aborted: boolean;
};

export type PersistSourcesRow = {
  sources: unknown;
  chatId: string;
  userId: string;
  messageId: string;
};

export type BindChatEmitterOptions = {
  stream: EventEmitter;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  encoder: { encode: (input: string) => Uint8Array };
  signal: AbortSignal;
  chatId: string;
  userId: string;
  createMessageId?: () => string;
  persistAssistant: (row: PersistAssistantRow) => unknown;
  persistSources: (row: PersistSourcesRow) => unknown;
};

export function bindChatEmitterToWriter(options: BindChatEmitterOptions) {
  const {
    stream,
    writer,
    encoder,
    signal,
    chatId,
    userId,
    persistAssistant,
    persistSources,
  } = options;
  const createMessageId =
    options.createMessageId ??
    (() => crypto.randomBytes(7).toString('hex'));

  let receivedMessage = '';
  let finished = false;
  let closed = false;
  let writeChain = Promise.resolve();
  const aiMessageId = createMessageId();

  const enqueueWrite = (op: () => Promise<void>) => {
    writeChain = writeChain.then(op).catch(() => {
      closed = true;
    });
  };

  const closeWriter = () => {
    enqueueWrite(async () => {
      if (closed) return;
      closed = true;
      await writer.close();
    });
  };

  const writeBytes = (bytes: Uint8Array) => {
    enqueueWrite(async () => {
      if (closed) return;
      await writer.write(bytes);
    });
  };

  const writeChunk = (payload: unknown) => {
    if (closed || signal.aborted || finished) return;
    writeBytes(encoder.encode(`${JSON.stringify(payload)}\n`));
  };

  const persistAssistantOnce = (aborted: boolean) => {
    const content = aborted
      ? assistantContentAfterAbort(receivedMessage)
      : receivedMessage;
    void Promise.resolve(
      persistAssistant({
        content,
        chatId,
        userId,
        messageId: aiMessageId,
        aborted,
      }),
    ).catch((err) => {
      console.error('Failed to persist assistant message:', err);
    });
  };

  const finish = (aborted: boolean) => {
    if (finished) return;
    finished = true;

    // Client Stop / tab close → skip further SSE writes (client is gone) but
    // still persist the partial assistant reply, matching pi-rag.
    const clientGone = aborted || signal.aborted || closed;
    if (!clientGone) {
      writeBytes(encoder.encode(`${JSON.stringify({ type: 'messageEnd' })}\n`));
    }

    persistAssistantOnce(aborted || signal.aborted);
    closeWriter();
  };

  stream.on('data', (data) => {
    if (finished) return;
    let parsedData: { type?: string; data?: unknown };
    try {
      parsedData =
        typeof data === 'string' ||
        (typeof Buffer !== 'undefined' && Buffer.isBuffer(data))
          ? JSON.parse(String(data).trim())
          : (data as { type?: string; data?: unknown });
    } catch (err) {
      console.warn('[bindChatEmitter] skip invalid SSE payload', err);
      return;
    }
    if (parsedData.type === 'response') {
      writeChunk({
        type: 'message',
        data: parsedData.data,
        messageId: aiMessageId,
      });
      receivedMessage += parsedData.data;
    } else if (parsedData.type === 'sources') {
      writeChunk({
        type: 'sources',
        data: parsedData.data,
        messageId: aiMessageId,
      });

      void Promise.resolve(
        persistSources({
          sources: parsedData.data,
          chatId,
          userId,
          messageId: createMessageId(),
        }),
      ).catch((err) => {
        console.error('Failed to persist source message:', err);
      });
    } else if (parsedData.type === 'progress') {
      writeChunk({
        type: 'progress',
        data: parsedData.data,
      });
    } else if (parsedData.type === 'tool_execution') {
      const toolData =
        parsedData.data &&
        typeof parsedData.data === 'object' &&
        !Array.isArray(parsedData.data)
          ? (parsedData.data as Record<string, unknown>)
          : {};
      let safeToolData: Record<string, unknown> = toolData;
      try {
        const encoded = JSON.stringify(toolData);
        if (encoded.length > 80_000) {
          safeToolData = {
            id: toolData.id,
            name: toolData.name,
            state: toolData.state,
            durationMs: toolData.durationMs,
            inputPreview: toolData.inputPreview,
            summary: toolData.summary,
            resultPreview: {
              truncated: true,
              note: 'Tool result omitted from stream (too large)',
            },
          };
        }
      } catch {
        safeToolData = {
          id: toolData.id,
          name: toolData.name,
          state: toolData.state,
          summary: toolData.summary,
          resultPreview: { truncated: true },
        };
      }
      writeChunk({
        type: 'tool_execution',
        data: safeToolData,
      });
    } else if (parsedData.type === 'ppt') {
      writeChunk({
        type: 'ppt',
        data: parsedData.data,
      });
    } else if (
      parsedData.type === 'tool_error' ||
      parsedData.type === 'monitor_error'
    ) {
      writeChunk({
        type: parsedData.type,
        data: parsedData.data,
      });
    }
  });
  stream.on('end', () => {
    finish(signal.aborted);
  });
  stream.on('error', (data) => {
    if (finished || signal.aborted) {
      finish(signal.aborted);
      return;
    }
    try {
      const parsedData = JSON.parse(data);
      writeChunk({
        type: 'error',
        data: parsedData.data,
      });
    } catch {
      writeChunk({
        type: 'error',
        data: 'Stream error',
      });
    }
    closeWriter();
    finished = true;
  });
}
