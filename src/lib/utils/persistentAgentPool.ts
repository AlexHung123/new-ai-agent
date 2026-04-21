import type { Agent, AgentConfig } from '@shareai-lab/kode-sdk/dist/core/agent';
import { AgentPool } from '@shareai-lab/kode-sdk/dist/core/pool';

type AgentPoolInternals = {
  agents?: Map<string, Agent>;
};

interface AgentStore {
  exists: (id: string) => Promise<boolean>;
}

export interface PersistentAgentPoolOptions {
  pool: AgentPool;
  store: AgentStore;
  maxActiveAgents: number;
  defaultAgentId: string;
  createConfig: (agentId: string) => AgentConfig;
  onAgentReady?: (agent: Agent) => void;
}

export interface PersistentAgentPoolManager {
  normalizeAgentId: (agentId?: string) => string;
  touchAgent: (agentId: string) => void;
  markBusy: (agentId: string) => void;
  markIdle: (agentId: string) => void;
  getOrCreateAgent: (agentId?: string) => Promise<Agent>;
}

function isPoolFullError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('Pool is full');
}

export function createPersistentAgentPoolManager(
  options: PersistentAgentPoolOptions,
): PersistentAgentPoolManager {
  const {
    pool,
    store,
    maxActiveAgents,
    defaultAgentId,
    createConfig,
    onAgentReady,
  } = options;

  const agentCache = new Map<string, Promise<Agent>>();
  const agentLastUsedAt = new Map<string, number>();
  const busyAgentIds = new Set<string>();

  const normalizeAgentId = (agentId?: string): string => {
    const trimmed = (agentId ?? '').trim();
    return trimmed.length > 0 ? trimmed : defaultAgentId;
  };

  const touchAgent = (agentId: string): void => {
    agentLastUsedAt.set(agentId, Date.now());
  };

  const pickEvictionCandidate = (
    excludeAgentId?: string,
  ): string | undefined => {
    const ids = pool.list();
    const candidates = ids.filter(
      (id) => id !== excludeAgentId && !busyAgentIds.has(id),
    );

    if (candidates.length === 0) return undefined;

    candidates.sort((a, b) => {
      const aTs = agentLastUsedAt.get(a) ?? 0;
      const bTs = agentLastUsedAt.get(b) ?? 0;
      return aTs - bTs;
    });

    return candidates[0];
  };

  const unloadAgentFromMemory = (agentId: string): boolean => {
    const poolInternals = pool as unknown as AgentPoolInternals;
    if (!(poolInternals.agents instanceof Map)) return false;

    const agent = poolInternals.agents.get(agentId);
    if (!agent) return false;

    poolInternals.agents.delete(agentId);
    agentCache.delete(agentId);
    agentLastUsedAt.delete(agentId);
    busyAgentIds.delete(agentId);
    return true;
  };

  const ensurePoolCapacity = (excludeAgentId?: string): boolean => {
    let evicted = false;

    while (pool.size() >= maxActiveAgents) {
      const candidate = pickEvictionCandidate(excludeAgentId);
      if (!candidate) break;
      if (!unloadAgentFromMemory(candidate)) break;
      evicted = true;
    }

    return evicted;
  };

  const getOrCreateAgent = async (agentId?: string): Promise<Agent> => {
    const stableAgentId = normalizeAgentId(agentId);
    if (!agentCache.has(stableAgentId)) {
      const creationPromise = (async () => {
        const existing = pool.get(stableAgentId);
        if (existing) {
          console.log('[persistentAgentPool] Found existing agent in pool');
          touchAgent(stableAgentId);
          return existing;
        }

        console.log(
          '[persistentAgentPool] Getting config and checking store...',
        );
        const config = createConfig(stableAgentId);
        const existsInStore = await store.exists(stableAgentId);
        console.log('[persistentAgentPool] existsInStore:', existsInStore);
        ensurePoolCapacity(stableAgentId);
        console.log('[persistentAgentPool] Pool capacity ensured');

        const loadAgent = async () => {
          console.log('[persistentAgentPool] loadAgent starting...');
          if (existsInStore) {
            console.log('[persistentAgentPool] Calling pool.resume...');
            const res = await pool.resume(stableAgentId, config);
            console.log('[persistentAgentPool] pool.resume finished');
            return res;
          } else {
            console.log('[persistentAgentPool] Calling pool.create...');
            const res = await pool.create(stableAgentId, config);
            console.log('[persistentAgentPool] pool.create finished');
            return res;
          }
        };

        let agent: Agent;
        try {
          agent = await loadAgent();
          console.log('[persistentAgentPool] Agent loaded successfully');
        } catch (error) {
          console.error('[persistentAgentPool] Error loading agent:', error);
          if (!isPoolFullError(error)) throw error;

          const evicted = ensurePoolCapacity(stableAgentId);
          if (!evicted) {
            throw new Error(
              `Agent pool is full (${maxActiveAgents}) and all active agents are busy`,
            );
          }
          agent = await loadAgent();
        }

        onAgentReady?.(agent);
        touchAgent(stableAgentId);
        console.log('[persistentAgentPool] Agent ready and touched');
        return agent;
      })();

      agentCache.set(stableAgentId, creationPromise);
      creationPromise.catch(() => {
        agentCache.delete(stableAgentId);
      });
    } else {
      console.log('[persistentAgentPool] Agent found in cache');
    }

    return await agentCache.get(stableAgentId)!;
  };

  return {
    normalizeAgentId,
    touchAgent,
    markBusy: (agentId: string) => busyAgentIds.add(agentId),
    markIdle: (agentId: string) => {
      busyAgentIds.delete(agentId);
      touchAgent(agentId);
    },
    getOrCreateAgent,
  };
}
