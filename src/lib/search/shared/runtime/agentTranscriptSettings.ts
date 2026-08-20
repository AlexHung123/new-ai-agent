import { getContextBudget } from '../agent/contextBudget';

export type AgentTranscriptSettings = {
  enabled: boolean;
  /** Max rows kept / loaded per conversation. */
  maxEntries: number;
  /** After prune, keep at most this many entries (must be <= maxEntries). */
  pruneToEntries: number;
  /** Soft budget: stop loading older rows when cumulative payload chars exceed this. */
  maxChars: number;
};

function envFlagTrue(raw: string | undefined, defaultTrue: boolean): boolean {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return defaultTrue;
  }
  const v = String(raw).trim().toLowerCase();
  if (v === '0' || v === 'false' || v === 'off' || v === 'no') return false;
  if (v === '1' || v === 'true' || v === 'on' || v === 'yes') return true;
  return defaultTrue;
}

function envPositiveInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = Number(raw ?? fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export function getAgentTranscriptSettings(
  env: NodeJS.ProcessEnv = process.env,
): AgentTranscriptSettings {
  const maxEntries = envPositiveInt(
    env.AGENT_TRANSCRIPT_MAX_ENTRIES,
    80,
    10,
    500,
  );
  let pruneToEntries = envPositiveInt(
    env.AGENT_TRANSCRIPT_PRUNE_TO_ENTRIES,
    60,
    5,
    500,
  );
  if (pruneToEntries > maxEntries) pruneToEntries = maxEntries;

  const budget = getContextBudget(env);

  return {
    enabled: envFlagTrue(env.AGENT_TRANSCRIPT_ENABLED, true),
    maxEntries,
    pruneToEntries,
    maxChars: budget.transcriptMaxChars,
  };
}

export function isAgentTranscriptEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return getAgentTranscriptSettings(env).enabled;
}
