import configManager from '../../../config';

export interface RagflowRetrievalConfig {
  apiUrl: string;
  apiKey: string;
  datasetIds: string[];
  documentIds: string[];
  similarityThreshold: number;
  vectorSimilarityWeight: number;
}

export interface AgentModelConfig {
  modelId: string;
  apiKey: string;
  baseUrl: string;
}

const DEFAULT_MAX_ACTIVE_AGENTS = 100;

export function getRagflowRetrievalConfig(): RagflowRetrievalConfig {
  return {
    apiUrl:
      configManager.getConfig('ragflow.apiUrl') ||
      'http://192.168.56.1:8001/api/v1/retrieval',
    apiKey:
      configManager.getConfig('ragflow.apiKey') ||
      'ragflow-g4OTUwYjU2NDFiYjExZjBhYmY5MDI0Mm',
    datasetIds: configManager.getConfig('ragflow.datasetIds') || [
      '387232b21eaa11f1b4a62e82040d3310',
    ],
    documentIds: configManager.getConfig('ragflow.documentIds') || [
      '658f16801eae11f1b4a62e82040d3310',
    ],
    similarityThreshold: configManager.getConfig('ragflow.similarityThreshold') ?? 0.3,
    vectorSimilarityWeight:
      configManager.getConfig('ragflow.vectorSimilarityWeight') ?? 0.3,
  };
}

export function getAgentModelConfig(): AgentModelConfig {
  return {
    modelId: configManager.getConfig('base.modelId', '') || 'gpt-3.5-turbo',
    apiKey: configManager.getConfig('base.apiKey', '') || '',
    baseUrl:
      configManager.getConfig('base.baseURL', '') || 'http://192.168.1.51:8000',
  };
}

export function getMaxActiveAgents(
  fallback = DEFAULT_MAX_ACTIVE_AGENTS,
): number {
  const configured = Number(
    configManager.getConfig('ragflow.maxActiveAgents') ?? fallback,
  );
  if (!Number.isFinite(configured)) return fallback;
  return Math.max(1, Math.floor(configured));
}
