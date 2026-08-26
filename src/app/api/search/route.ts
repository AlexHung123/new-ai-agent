import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { MetaSearchAgentType } from '@/lib/search/metaSearchAgent';
import { searchHandlers } from '@/lib/search';
import {
  loadConfiguredChatModel,
  NoopEmbeddings,
} from '@/lib/models/configuredChatModel';
import {
  documentRootAbs,
  resolveDocument,
} from '@/lib/documents/catalog';
import { resolveBoundDocument } from '@/lib/documents/resolveBoundDocument';
import { runWithDocumentTurn } from '@/lib/search/shared/runtime/documentTurnContext';

interface ChatRequestBody {
  optimizationMode: 'speed' | 'balanced';
  focusMode: string;
  query: string;
  history: Array<[string, string]>;
  stream?: boolean;
  systemInstructions?: string;
  documentId?: string;
}

export const POST = async (req: Request) => {
  try {
    const body: ChatRequestBody = await req.json();

    if (!body.focusMode || !body.query) {
      return Response.json(
        { message: 'Missing focus mode or query' },
        { status: 400 },
      );
    }

    body.history = body.history || [];
    body.optimizationMode = body.optimizationMode || 'balanced';
    body.stream = body.stream || false;

    // Live turns use 'human'; reloaded chats may use 'user'.
    const history: BaseMessage[] = body.history.map((msg) => {
      const role = (msg[0] || '').toLowerCase();
      return role === 'human' || role === 'user'
        ? new HumanMessage({ content: msg[1] })
        : new AIMessage({ content: msg[1] });
    });

    const llm = loadConfiguredChatModel();
    const embeddings = new NoopEmbeddings();

    const searchHandler: MetaSearchAgentType = searchHandlers[body.focusMode];

    if (!searchHandler) {
      return Response.json({ message: 'Invalid focus mode' }, { status: 400 });
    }

    const runSearch = () =>
      searchHandler.searchAndAnswer(
        body.query,
        history,
        llm,
        embeddings,
        body.optimizationMode,
        [],
        body.systemInstructions || '',
      );

    const bound = resolveBoundDocument({
      focusMode: body.focusMode,
      chatExists: false,
      bodyDocumentId: body.documentId,
    });
    if (bound.status === 'error') {
      return Response.json({ message: bound.message }, { status: 400 });
    }

    let emitter;
    if (bound.status === 'ok') {
      const slot = resolveDocument(bound.documentId);
      if (!slot) {
        return Response.json(
          {
            message: bound.documentId
              ? 'Unknown or unavailable document'
              : 'Select a document',
          },
          { status: 400 },
        );
      }
      emitter = await runWithDocumentTurn(
        {
          id: slot.id,
          title: slot.title,
          rootAbs: documentRootAbs(slot),
        },
        runSearch,
      );
    } else {
      emitter = await runSearch();
    }

    if (!body.stream) {
      return new Promise(
        (
          resolve: (value: Response) => void,
          reject: (value: Response) => void,
        ) => {
          let message = '';
          let sources: any[] = [];

          emitter.on('data', (data: string) => {
            try {
              const parsedData = JSON.parse(data);
              if (parsedData.type === 'response') {
                message += parsedData.data;
              } else if (parsedData.type === 'sources') {
                sources = parsedData.data;
              }
            } catch (error) {
              reject(
                Response.json(
                  { message: 'Error parsing data' },
                  { status: 500 },
                ),
              );
            }
          });

          emitter.on('end', () => {
            resolve(Response.json({ message, sources }, { status: 200 }));
          });

          emitter.on('error', (error: any) => {
            reject(
              Response.json(
                { message: 'Search error', error },
                { status: 500 },
              ),
            );
          });
        },
      );
    }

    const encoder = new TextEncoder();

    const abortController = new AbortController();
    const { signal } = abortController;

    const stream = new ReadableStream({
      start(controller) {
        let sources: any[] = [];

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: 'init',
              data: 'Stream connected',
            }) + '\n',
          ),
        );

        signal.addEventListener('abort', () => {
          emitter.removeAllListeners();

          try {
            controller.close();
          } catch (error) {}
        });

        emitter.on('data', (data: string) => {
          if (signal.aborted) return;

          try {
            const parsedData = JSON.parse(data);

            if (parsedData.type === 'response') {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'response',
                    data: parsedData.data,
                  }) + '\n',
                ),
              );
            } else if (parsedData.type === 'sources') {
              sources = parsedData.data;
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'sources',
                    data: sources,
                  }) + '\n',
                ),
              );
            }
          } catch (error) {
            controller.error(error);
          }
        });

        emitter.on('end', () => {
          if (signal.aborted) return;

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'done',
              }) + '\n',
            ),
          );
          controller.close();
        });

        emitter.on('error', (error: any) => {
          if (signal.aborted) return;

          controller.error(error);
        });
      },
      cancel() {
        abortController.abort();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error(`Error in getting search results: ${err.message}`);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};
