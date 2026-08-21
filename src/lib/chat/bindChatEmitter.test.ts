import { EventEmitter } from 'events';
import { describe, expect, it } from 'vitest';
import { STOPPED_PLACEHOLDER } from './abortedReply';
import { bindChatEmitterToWriter } from './bindChatEmitter';

type CloseError = TypeError & { code?: string };

function createMockWriter() {
  let closed = false;
  const writes: string[] = [];
  const decoder = new TextDecoder();

  const writer = {
    write: async (chunk: Uint8Array) => {
      if (closed) {
        throw Object.assign(
          new TypeError('Invalid state: WritableStream is closed'),
          { code: 'ERR_INVALID_STATE' },
        ) as CloseError;
      }
      writes.push(decoder.decode(chunk));
    },
    close: async () => {
      if (closed) {
        throw Object.assign(
          new TypeError('Invalid state: Failure to close WritableStream'),
          { code: 'ERR_INVALID_STATE' },
        ) as CloseError;
      }
      closed = true;
    },
  } as unknown as WritableStreamDefaultWriter<Uint8Array>;

  return {
    writer,
    writes,
    isClosed: () => closed,
  };
}

async function flush() {
  for (let i = 0; i < 12; i++) await Promise.resolve();
}

function parseWrites(writes: string[]) {
  return writes
    .join('')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

describe('bindChatEmitterToWriter abort handling', () => {
  it('does not reject when abort fires after the writer is already closed', async () => {
    const rejections: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      rejections.push(reason);
    };
    process.on('unhandledRejection', onUnhandled);

    try {
      const stream = new EventEmitter();
      const { writer } = createMockWriter();
      const persistAssistant: Array<{ content: string; aborted: boolean }> = [];
      const ac = new AbortController();

      bindChatEmitterToWriter({
        stream,
        writer,
        encoder: new TextEncoder(),
        signal: ac.signal,
        chatId: 'chat-1',
        userId: 'user-1',
        createMessageId: () => 'asst-1',
        persistAssistant: (row) => {
          persistAssistant.push({
            content: row.content,
            aborted: row.aborted,
          });
        },
        persistSources: () => {},
      });

      stream.emit('end');
      await flush();
      ac.abort();
      await flush();

      expect(rejections).toEqual([]);
      expect(persistAssistant).toHaveLength(1);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('persists partial text once when abort and end both fire', async () => {
    const stream = new EventEmitter();
    const { writer, writes } = createMockWriter();
    const persistAssistant: Array<{ content: string; aborted: boolean }> = [];
    const ac = new AbortController();

    bindChatEmitterToWriter({
      stream,
      writer,
      encoder: new TextEncoder(),
      signal: ac.signal,
      chatId: 'chat-1',
      userId: 'user-1',
      createMessageId: () => 'asst-1',
      persistAssistant: (row) => {
        persistAssistant.push({
          content: row.content,
          aborted: row.aborted,
        });
      },
      persistSources: () => {},
    });

    stream.emit(
      'data',
      JSON.stringify({ type: 'response', data: 'partial answer' }),
    );
    ac.abort();
    stream.emit('end');
    await flush();

    expect(persistAssistant).toEqual([
      { content: 'partial answer', aborted: true },
    ]);
    expect(parseWrites(writes).some((row) => row.type === 'error')).toBe(false);
  });

  it('persists (stopped) when the user aborts before any assistant text', async () => {
    const stream = new EventEmitter();
    const { writer } = createMockWriter();
    const persistAssistant: Array<{ content: string; aborted: boolean }> = [];
    const ac = new AbortController();

    bindChatEmitterToWriter({
      stream,
      writer,
      encoder: new TextEncoder(),
      signal: ac.signal,
      chatId: 'chat-1',
      userId: 'user-1',
      createMessageId: () => 'asst-1',
      persistAssistant: (row) => {
        persistAssistant.push({
          content: row.content,
          aborted: row.aborted,
        });
      },
      persistSources: () => {},
    });

    ac.abort();
    stream.emit('end');
    await flush();

    expect(persistAssistant).toEqual([
      { content: STOPPED_PLACEHOLDER, aborted: true },
    ]);
  });

  it('writes messageEnd and persists non-aborted text on a clean end', async () => {
    const stream = new EventEmitter();
    const { writer, writes, isClosed } = createMockWriter();
    const persistAssistant: Array<{ content: string; aborted: boolean }> = [];

    bindChatEmitterToWriter({
      stream,
      writer,
      encoder: new TextEncoder(),
      signal: new AbortController().signal,
      chatId: 'chat-1',
      userId: 'user-1',
      createMessageId: () => 'asst-1',
      persistAssistant: (row) => {
        persistAssistant.push({
          content: row.content,
          aborted: row.aborted,
        });
      },
      persistSources: () => {},
    });

    stream.emit('data', JSON.stringify({ type: 'response', data: 'hello' }));
    stream.emit('end');
    await flush();

    expect(persistAssistant).toEqual([{ content: 'hello', aborted: false }]);
    expect(parseWrites(writes)).toEqual([
      { type: 'message', data: 'hello', messageId: 'asst-1' },
      { type: 'messageEnd' },
    ]);
    expect(isClosed()).toBe(true);
  });

  it('does not persist until the pi-ai run emits end after abort', async () => {
    const stream = new EventEmitter();
    const { writer } = createMockWriter();
    const persistAssistant: Array<{ content: string; aborted: boolean }> = [];
    const ac = new AbortController();

    bindChatEmitterToWriter({
      stream,
      writer,
      encoder: new TextEncoder(),
      signal: ac.signal,
      chatId: 'chat-1',
      userId: 'user-1',
      createMessageId: () => 'asst-1',
      persistAssistant: (row) => {
        persistAssistant.push({
          content: row.content,
          aborted: row.aborted,
        });
      },
      persistSources: () => {},
    });

    stream.emit(
      'data',
      JSON.stringify({ type: 'response', data: 'partial' }),
    );
    ac.abort();
    await flush();
    expect(persistAssistant).toHaveLength(0);

    stream.emit('end');
    await flush();
    expect(persistAssistant).toEqual([
      { content: 'partial', aborted: true },
    ]);
  });

  it('keeps accumulating assistant text after abort until end', async () => {
    const stream = new EventEmitter();
    const { writer, writes } = createMockWriter();
    const persistAssistant: Array<{ content: string; aborted: boolean }> = [];
    const ac = new AbortController();

    bindChatEmitterToWriter({
      stream,
      writer,
      encoder: new TextEncoder(),
      signal: ac.signal,
      chatId: 'chat-1',
      userId: 'user-1',
      createMessageId: () => 'asst-1',
      persistAssistant: (row) => {
        persistAssistant.push({
          content: row.content,
          aborted: row.aborted,
        });
      },
      persistSources: () => {},
    });

    stream.emit('data', JSON.stringify({ type: 'response', data: 'hel' }));
    ac.abort();
    stream.emit('data', JSON.stringify({ type: 'response', data: 'lo' }));
    stream.emit('end');
    await flush();

    expect(persistAssistant).toEqual([{ content: 'hello', aborted: true }]);
    expect(
      parseWrites(writes)
        .filter((row) => row.type === 'message')
        .map((row) => row.data),
    ).toEqual(['hel']);
  });

  it('skips further stream writes after abort', async () => {
    const stream = new EventEmitter();
    const { writer, writes } = createMockWriter();
    const ac = new AbortController();

    bindChatEmitterToWriter({
      stream,
      writer,
      encoder: new TextEncoder(),
      signal: ac.signal,
      chatId: 'chat-1',
      userId: 'user-1',
      createMessageId: () => 'asst-1',
      persistAssistant: () => {},
      persistSources: () => {},
    });

    stream.emit('data', JSON.stringify({ type: 'response', data: 'before' }));
    ac.abort();
    stream.emit('data', JSON.stringify({ type: 'response', data: 'after' }));
    await flush();

    const payloads = parseWrites(writes).filter((row) => row.type === 'message');
    expect(payloads.map((row) => row.data)).toEqual(['before']);
  });
});

describe('bindChatEmitterToWriter write queue', () => {
  it('does not drop assistant text when close races with in-flight writes', async () => {
    let closed = false;
    let closing = false;
    const writes: string[] = [];
    const decoder = new TextDecoder();
    const writer = {
      write: async (chunk: Uint8Array) => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        if (closed || closing) {
          throw Object.assign(
            new TypeError('Invalid state: WritableStream is closed'),
            { code: 'ERR_INVALID_STATE' },
          );
        }
        writes.push(decoder.decode(chunk));
      },
      close: async () => {
        closing = true;
        closed = true;
      },
    } as unknown as WritableStreamDefaultWriter<Uint8Array>;

    const stream = new EventEmitter();
    bindChatEmitterToWriter({
      stream,
      writer,
      encoder: new TextEncoder(),
      signal: new AbortController().signal,
      chatId: 'chat-1',
      userId: 'user-1',
      createMessageId: () => 'asst-1',
      persistAssistant: () => {},
      persistSources: () => {},
    });

    stream.emit('data', JSON.stringify({ type: 'response', data: 'Hello!' }));
    stream.emit('end');
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(parseWrites(writes)).toEqual([
      { type: 'message', data: 'Hello!', messageId: 'asst-1' },
      { type: 'messageEnd' },
    ]);
  });
});

describe('bindChatEmitterToWriter tool_execution', () => {
  it('keeps the compact summary when a huge tool result is truncated', async () => {
    const stream = new EventEmitter();
    const { writer, writes } = createMockWriter();
    const ac = new AbortController();

    bindChatEmitterToWriter({
      stream,
      writer,
      encoder: new TextEncoder(),
      signal: ac.signal,
      chatId: 'chat-1',
      userId: 'user-1',
      createMessageId: () => 'asst-1',
      persistAssistant: () => {},
      persistSources: () => {},
    });

    stream.emit(
      'data',
      JSON.stringify({
        type: 'tool_execution',
        data: {
          id: 't1',
          name: 'fs_read',
          state: 'COMPLETED',
          summary: 'Read wiki/SCHEMA.md',
          resultPreview: { body: 'x'.repeat(90_000) },
        },
      }),
    );
    await flush();

    const toolEvents = parseWrites(writes).filter(
      (row) => row.type === 'tool_execution',
    );
    expect(toolEvents).toHaveLength(1);
    expect(toolEvents[0].data.summary).toBe('Read wiki/SCHEMA.md');
    expect(toolEvents[0].data.resultPreview).toMatchObject({ truncated: true });
  });
});
