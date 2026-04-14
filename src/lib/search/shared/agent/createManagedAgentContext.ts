import type { Agent, AgentDependencies } from '@shareai-lab/kode-sdk/dist/core/agent';
import { AgentPool } from '@shareai-lab/kode-sdk/dist/core/pool';
import {
  createPersistentAgentPoolManager,
  PersistentAgentPoolManager,
} from '../../../utils/persistentAgentPool';
import { safeJson } from '../utils/safeJson';

interface ManagedAgentContextOptions {
  dependencies: AgentDependencies;
  maxActiveAgents: number;
  defaultAgentId: string;
  templateId: string;
}

interface ManagedAgentContext {
  pool: AgentPool;
  manager: PersistentAgentPoolManager;
  progressBookmarkByAgent: WeakMap<Agent, string>;
}

export function createManagedAgentContext(
  options: ManagedAgentContextOptions,
): ManagedAgentContext {
  const { dependencies, maxActiveAgents, defaultAgentId, templateId } = options;
  const pool = new AgentPool({
    dependencies,
    maxAgents: maxActiveAgents,
  });
  const agentMonitored = new WeakSet<Agent>();
  const progressBookmarkByAgent = new WeakMap<Agent, string>();

  const manager = createPersistentAgentPoolManager({
    pool,
    store: dependencies.store,
    maxActiveAgents,
    defaultAgentId,
    createConfig: () => ({
      templateId,
      sandbox: {
        kind: 'local' as const,
        workDir: './workspace',
        enforceBoundary: true,
      },
    }),
    onAgentReady: (agent: Agent) => {
      if (agentMonitored.has(agent)) return;
      agentMonitored.add(agent);
      agent.on('error', (event: any) => {
        console.error('\n[monitor:error]');
        console.error(safeJson(event));
      });
    },
  });

  return {
    pool,
    manager,
    progressBookmarkByAgent,
  };
}
