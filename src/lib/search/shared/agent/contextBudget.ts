/**
 * Slim context budget for compaction, tool-result caps, and transcript load.
 *
 * pi-rag's full resolver also covers memory / Cite / analyze; those knobs
 * are unused here and are not exported.
 */

export type ContextBudget = {
  /** Mid-run / transcript toolResult body cap. 0 = unlimited. */
  toolResultMaxChars: number;
  /** Cold-load agent transcript soft char budget. */
  transcriptMaxChars: number;
  /** Compress when estimated tokens exceed this. */
  compactionMaxTokens: number;
  /** Target residual budget used to compute keep ratio. */
  compactionCompressToTokens: number;
  /** Emit [context-budget] logs. */
  logEnabled: boolean;
  /** Multiplier applied to soft char/token caps (default 1). */
  scale: number;
};

function envNonNegIntOptional(
  raw: string | undefined,
): number | undefined {
  if (raw === undefined || raw === '') return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
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

function envBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === '') return fallback;
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return fallback;
}

function envScale(raw: string | undefined): number {
  if (raw === undefined || raw === '') return 1;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(4, Math.max(0.1, n));
}

/** Scale a positive budget; keep 0 as "unlimited". */
function applyScale(value: number, scale: number): number {
  if (value <= 0) return value;
  if (scale === 1) return value;
  return Math.max(1, Math.floor(value * scale));
}

export function getContextBudget(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): ContextBudget {
  const scale = envScale(env.CONTEXT_BUDGET_SCALE);

  const toolResultMaxCharsRaw =
    envNonNegIntOptional(env.CONTEXT_BUDGET_TOOL_CHARS) ??
    envNonNegIntOptional(env.AGENT_MAX_TOOL_RESULT_CHARS) ??
    envNonNegIntOptional(env.RAG_EVIDENCE_MAX_CHARS) ??
    120_000;

  const transcriptMaxCharsRaw =
    envNonNegIntOptional(env.CONTEXT_BUDGET_TRANSCRIPT_CHARS) ??
    envPositiveInt(env.AGENT_TRANSCRIPT_MAX_CHARS, 400_000, 10_000, 5_000_000);

  const compactionMaxTokensRaw = envPositiveInt(
    env.CONTEXT_BUDGET_COMPACTION_MAX_TOKENS ??
      env.AGENT_COMPACTION_MAX_TOKENS ??
      env.AGENT_COMPACTION_THRESHOLD_TOKENS,
    50_000,
    1_000,
    2_000_000,
  );
  const compactionCompressToTokensRaw = envPositiveInt(
    env.CONTEXT_BUDGET_COMPACTION_COMPRESS_TO ??
      env.AGENT_COMPACTION_COMPRESS_TO_TOKENS,
    30_000,
    256,
    2_000_000,
  );

  return {
    scale,
    toolResultMaxChars: applyScale(toolResultMaxCharsRaw, scale),
    transcriptMaxChars: applyScale(transcriptMaxCharsRaw, scale),
    compactionMaxTokens: applyScale(compactionMaxTokensRaw, scale),
    compactionCompressToTokens: applyScale(
      compactionCompressToTokensRaw,
      scale,
    ),
    logEnabled: envBool(env.CONTEXT_BUDGET_LOG, true),
  };
}

export function formatContextBudgetSnapshot(budget: ContextBudget): string {
  return (
    `[context-budget] scale=${budget.scale}` +
    ` toolChars=${budget.toolResultMaxChars}` +
    ` transcriptChars=${budget.transcriptMaxChars}` +
    ` compactMaxTokens=${budget.compactionMaxTokens}` +
    ` compactToTokens=${budget.compactionCompressToTokens}`
  );
}
