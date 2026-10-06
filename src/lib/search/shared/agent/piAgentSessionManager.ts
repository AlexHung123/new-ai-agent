import type { CompactableMessage } from './agentCompaction';
import { formatContextManageLog } from './agentCompaction';
import {
  compactionCheckpointFromGuard,
  type CompactionCheckpoint,
} from '../runtime/agentTranscriptCheckpoint';
import {
  resolveAndGuardHydrateMessages,
} from '../runtime/agentTranscriptHydrate';
import { isAgentTranscriptEnabled } from '../runtime/agentTranscriptSettings';
import type { AgentTranscriptStore } from '../runtime/agentTranscriptStore';
import type { TranscriptAgentMessage } from '../runtime/agentTranscriptCodec';
import type { PiSessionStore } from '../runtime/piSessionStore';

export function messagesHaveToolHistory(messages: unknown[]): boolean {
  for (const raw of messages || []) {
    if (!raw || typeof raw !== 'object') continue;
    const msg = raw as {
      role?: unknown;
      content?: unknown;
      toolCallId?: unknown;
    };
    const role = String(msg.role || '');
    if (role === 'toolResult' || role === 'tool') return true;
    if (typeof msg.toolCallId === 'string' && msg.toolCallId) return true;
    if (role === 'assistant' && Array.isArray(msg.content)) {
      const usedTool = msg.content.some((block) => {
        if (!block || typeof block !== 'object') return false;
        return (block as { type?: unknown }).type === 'toolCall';
      });
      if (usedTool) return true;
    }
  }
  return false;
}

export type PiTemplate = {
  id: string;
  systemPrompt: string;
  tools: string[];
};

export type NamedTool = {
  name: string;
  label?: string;
};

export function resolveToolLabel(
  tools: ReadonlyArray<NamedTool> | undefined,
  toolName: string,
): string | undefined {
  if (!toolName) return undefined;
  for (const tool of tools ?? []) {
    if (tool?.name !== toolName) continue;
    const label = typeof tool.label === 'string' ? tool.label.trim() : '';
    if (label) return label;
  }
  return undefined;
}

export type PooledAgent = {
  sessionId?: string;
  state: {
    systemPrompt: string;
    tools: NamedTool[];
    messages: unknown[];
    isStreaming: boolean;
    errorMessage?: string;
  };
  prompt: (input: string) => Promise<void>;
  subscribe: (
    listener: (event: any, signal?: AbortSignal) => void | Promise<void>,
  ) => () => void;
  abort: () => void;
  waitForIdle: () => Promise<void>;
};

export type AgentRuntimeExtras = PooledAgent & {
  __pendingCheckpoint?: CompactionCheckpoint | null;
  __compactedViewLength?: number;
  transformContext?: (
    messages: CompactableMessage[],
    signal?: AbortSignal,
  ) => Promise<CompactableMessage[]>;
  beforeToolCall?: (
    context: { toolCall?: { name?: string }; args?: unknown },
    signal?: AbortSignal,
  ) => Promise<{ block?: boolean; reason?: string } | undefined>;
  afterToolCall?: (
    context: {
      toolCall?: { name?: string };
      args?: unknown;
      isError?: boolean;
    },
    signal?: AbortSignal,
  ) => Promise<{ terminate?: boolean } | undefined>;
};

export type CreatePooledAgentOptions = {
  sessionId: string;
  systemPrompt: string;
  tools: NamedTool[];
  messages: unknown[];
  templateId: string;
};

export type PiAgentSessionManager = {
  normalizeAgentId: (agentId?: string) => string;
  touchAgent: (agentId: string) => void;
  markBusy: (agentId: string) => void;
  markIdle: (agentId: string) => Promise<void>;
  getOrCreateAgent: (
    agentId?: string,
    toolsOverride?: string[],
    templateIdOverride?: string,
  ) => Promise<PooledAgent>;
};

type SessionEntry = {
  agent: PooledAgent;
  templateId: string;
  lastUsedAt: number;
  busy: boolean;
  transcriptWatermark: number;
};

export function createPiAgentSessionManager(options: {
  defaultAgentId: string;
  maxActiveAgents: number;
  store: PiSessionStore;
  transcript: AgentTranscriptStore;
  templates: Record<string, PiTemplate>;
  tools: Record<string, NamedTool>;
  defaultTemplateId?: string;
  createAgent: (opts: CreatePooledAgentOptions) => PooledAgent | Promise<PooledAgent>;
}): PiAgentSessionManager {
  const {
    defaultAgentId,
    maxActiveAgents,
    store,
    transcript,
    templates,
    tools,
    defaultTemplateId = 'rag-base-template',
    createAgent,
  } = options;

  const sessions = new Map<string, SessionEntry>();
  let lruTick = 0;

  const nextLru = () => ++lruTick;

  const normalizeAgentId = (agentId?: string): string => {
    const trimmed = (agentId ?? '').trim();
    return trimmed.length > 0 ? trimmed : defaultAgentId;
  };

  const resolveTemplate = (templateId?: string): PiTemplate => {
    const id = (templateId || '').trim() || defaultTemplateId;
    const template = templates[id] ?? templates[defaultTemplateId];
    if (!template) {
      throw new Error(`Unknown agent template: ${id}`);
    }
    return template;
  };

  const resolveTools = (names: string[]): NamedTool[] =>
    names
      .map((name) => tools[name])
      .filter((tool): tool is NamedTool => Boolean(tool));

  const resolveEffectiveToolNames = (
    template: PiTemplate,
    toolsOverride: string[] | undefined,
    messages: unknown[],
    existingToolNames?: string[],
  ): string[] => {
    if (toolsOverride && toolsOverride.length > 0) {
      return toolsOverride;
    }
    if (existingToolNames && existingToolNames.length > 0) {
      return existingToolNames;
    }
    if (toolsOverride === undefined) {
      return [...template.tools];
    }
    if (messagesHaveToolHistory(messages)) {
      return [...template.tools];
    }
    return [];
  };

  const persistTranscript = async (agentId: string, entry: SessionEntry) => {
    if (!isAgentTranscriptEnabled()) return;
    try {
      const runtime = entry.agent as AgentRuntimeExtras;
      const msgs = (entry.agent.state.messages ||
        []) as TranscriptAgentMessage[];
      const pending = runtime.__pendingCheckpoint;
      if (pending) {
        await transcript.appendCheckpoint({
          agentId,
          checkpoint: pending,
        });
        runtime.__pendingCheckpoint = undefined;
        const viewLen =
          runtime.__compactedViewLength != null
            ? runtime.__compactedViewLength
            : msgs.length;
        const result = await transcript.syncMessages({
          agentId,
          messages: msgs,
          watermark: viewLen,
          previousMessages: msgs.slice(0, viewLen),
        });
        entry.transcriptWatermark = result.newWatermark;
        console.log(
          `transcript_sync conv=${agentId} mode=${result.mode}` +
            ` checkpoint=1 watermark=${result.newWatermark}` +
            ` entries=${result.entryCount}`,
        );
      } else {
        const result = await transcript.syncMessages({
          agentId,
          messages: msgs,
          watermark: entry.transcriptWatermark,
          previousMessages: msgs.slice(0, entry.transcriptWatermark),
        });
        entry.transcriptWatermark = result.newWatermark;
        console.log(
          `transcript_sync conv=${agentId} mode=${result.mode}` +
            ` watermark=${result.newWatermark} entries=${result.entryCount}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`transcript_sync failed conv=${agentId}: ${message}`);
    }
  };

  const persist = async (agentId: string, entry: SessionEntry) => {
    await persistTranscript(agentId, entry);
    try {
      await store.save(agentId, {
        templateId: entry.templateId,
        messages: entry.agent.state.messages ?? [],
      });
    } catch (error) {
      console.error('[piAgentSessionManager] persist failed', agentId, error);
    }
  };

  const hydrateMessages = async (
    agentId: string,
    storedMessages: unknown[],
  ): Promise<{ messages: unknown[]; watermark: number }> => {
    if (!isAgentTranscriptEnabled()) {
      return { messages: storedMessages, watermark: storedMessages.length };
    }

    let transcriptMsgs: TranscriptAgentMessage[] = [];
    try {
      transcriptMsgs = await transcript.loadMessages(agentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`transcript load failed conv=${agentId}: ${message}`);
    }

    if (
      transcriptMsgs.length === 0 &&
      Array.isArray(storedMessages) &&
      storedMessages.length > 0
    ) {
      try {
        await transcript.syncMessages({
          agentId,
          messages: storedMessages as TranscriptAgentMessage[],
          watermark: 0,
        });
        transcriptMsgs = await transcript.loadMessages(agentId);
        if (transcriptMsgs.length === 0) {
          transcriptMsgs = storedMessages as TranscriptAgentMessage[];
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`transcript seed failed conv=${agentId}: ${message}`);
        transcriptMsgs = storedMessages as TranscriptAgentMessage[];
      }
    }

    try {
      const hydrated = await resolveAndGuardHydrateMessages({
        transcript: transcriptMsgs,
        uiHistory: [],
        modelId: '',
      });
      console.log(
        formatContextManageLog(hydrated.guard, {
          conversationId: agentId,
          label: 'hydrate',
        }),
      );
      if (hydrated.guard.compacted) {
        const cp = compactionCheckpointFromGuard(hydrated.guard);
        if (cp) {
          try {
            await transcript.appendCheckpoint({
              agentId,
              checkpoint: cp,
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            console.warn(
              `hydrate checkpoint persist failed conv=${agentId}: ${message}`,
            );
          }
        }
      }
      return {
        messages: hydrated.messages,
        watermark: hydrated.messages.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`transcript hydrate failed conv=${agentId}: ${message}`);
      return {
        messages: transcriptMsgs.length > 0 ? transcriptMsgs : storedMessages,
        watermark:
          transcriptMsgs.length > 0
            ? transcriptMsgs.length
            : storedMessages.length,
      };
    }
  };

  const evict = async (agentId: string) => {
    const entry = sessions.get(agentId);
    if (!entry || entry.busy) return false;
    await persist(agentId, entry);
    sessions.delete(agentId);
    return true;
  };

  const pickIdleLru = (excludeAgentId?: string): string | undefined => {
    let oldestId: string | undefined;
    let oldestTs = Number.POSITIVE_INFINITY;
    for (const [id, entry] of sessions) {
      if (id === excludeAgentId || entry.busy) continue;
      if (entry.lastUsedAt < oldestTs) {
        oldestTs = entry.lastUsedAt;
        oldestId = id;
      }
    }
    return oldestId;
  };

  const ensureCapacity = async (excludeAgentId?: string) => {
    while (sessions.size >= maxActiveAgents) {
      const candidate = pickIdleLru(excludeAgentId);
      if (!candidate) {
        throw new Error(
          `Agent pool is full (${maxActiveAgents}) and all active agents are busy`,
        );
      }
      await evict(candidate);
    }
  };

  const applyOverrides = (
    entry: SessionEntry,
    toolsOverride?: string[],
    templateIdOverride?: string,
  ) => {
    if (templateIdOverride) {
      const template = resolveTemplate(templateIdOverride);
      entry.templateId = template.id;
      entry.agent.state.systemPrompt = template.systemPrompt;
    }
    if (toolsOverride !== undefined) {
      const template = resolveTemplate(entry.templateId);
      const names = resolveEffectiveToolNames(
        template,
        toolsOverride,
        entry.agent.state.messages ?? [],
        entry.agent.state.tools.map((tool) => tool.name),
      );
      entry.agent.state.tools = resolveTools(names);
    }
  };

  return {
    normalizeAgentId,
    touchAgent(agentId: string) {
      const entry = sessions.get(normalizeAgentId(agentId));
      if (entry) entry.lastUsedAt = nextLru();
    },
    markBusy(agentId: string) {
      const entry = sessions.get(normalizeAgentId(agentId));
      if (entry) entry.busy = true;
    },
    async markIdle(agentId: string) {
      const id = normalizeAgentId(agentId);
      const entry = sessions.get(id);
      if (!entry) return;
      entry.busy = false;
      entry.lastUsedAt = nextLru();
      await persist(id, entry);
    },
    async getOrCreateAgent(
      agentId?: string,
      toolsOverride?: string[],
      templateIdOverride?: string,
    ) {
      const id = normalizeAgentId(agentId);
      const existing = sessions.get(id);
      if (existing) {
        applyOverrides(existing, toolsOverride, templateIdOverride);
        existing.lastUsedAt = nextLru();
        return existing.agent;
      }

      await ensureCapacity(id);

      const template = resolveTemplate(templateIdOverride);
      const stored = await store.load(id);
      const hydrated = await hydrateMessages(id, stored?.messages ?? []);
      const agent = await createAgent({
        sessionId: id,
        systemPrompt: template.systemPrompt,
        tools: resolveTools(
          resolveEffectiveToolNames(
            template,
            toolsOverride,
            hydrated.messages,
          ),
        ),
        messages: hydrated.messages,
        templateId: template.id,
      });

      sessions.set(id, {
        agent,
        templateId: template.id,
        lastUsedAt: nextLru(),
        busy: false,
        transcriptWatermark: hydrated.watermark,
      });
      return agent;
    },
  };
}
