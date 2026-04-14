import type { AgentDependencies } from '@shareai-lab/kode-sdk/dist/core/agent';
import { createExtendedStore } from '@shareai-lab/kode-sdk/dist/infra/store';
import path from 'path';
import { createRuntime } from '../../../utils/shared/runtime';
import { getAgentModelConfig } from '../config/ragflowConfig';

interface CreateAgentRuntimeOptions {
  templateId: string;
  systemPrompt: string;
  toolName: string;
  registerTool: (tools: any) => void;
  sqliteDbPath?: string;
  sqliteDataDir?: string;
}

const DEFAULT_SQLITE_DB_FILE = 'data/agents.db';
const DEFAULT_SQLITE_DATA_DIR = 'temp';

function resolvePathValue(
  value: string | undefined,
  fallbackPath: string,
): string {
  if (typeof value !== 'string') return fallbackPath;

  const normalized = value.trim();
  if (!normalized) return fallbackPath;

  return path.isAbsolute(normalized)
    ? normalized
    : path.resolve(process.cwd(), normalized);
}

export function createSqliteAgentRuntime(options: CreateAgentRuntimeOptions) {
  const {
    templateId,
    systemPrompt,
    toolName,
    registerTool,
    sqliteDbPath,
    sqliteDataDir,
  } = options;
  const modelConfig = getAgentModelConfig();
  const fallbackDbPath = path.resolve(process.cwd(), DEFAULT_SQLITE_DB_FILE);
  const fallbackDataDir = path.resolve(process.cwd(), DEFAULT_SQLITE_DATA_DIR);
  const resolvedSqliteDbPath = resolvePathValue(sqliteDbPath, fallbackDbPath);
  const resolvedSqliteDataDir = resolvePathValue(sqliteDataDir, fallbackDataDir);
  const storeDir = resolvedSqliteDataDir || path.dirname(resolvedSqliteDbPath);
  const store: AgentDependencies['store'] = createExtendedStore({
    type: 'sqlite',
    dbPath: resolvedSqliteDbPath,
    fileStoreBaseDir: storeDir,
  });

  const runtimeDeps = createRuntime(
    ({ templates, tools }: any) => {
      registerTool(tools);
      templates.register({
        id: templateId,
        systemPrompt,
        tools: [toolName],
        model: modelConfig.modelId,
        runtime: {},
      });
    },
    {
      store,
      modelDefaults: {
        apiKey: modelConfig.apiKey,
        baseUrl: modelConfig.baseUrl,
      },
    },
  );

  return { runtimeDeps, store };
}
