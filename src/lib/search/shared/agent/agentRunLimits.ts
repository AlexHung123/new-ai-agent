/**
 * Per-prompt tool-call / failure caps for pi-agent-core runs.
 * Prevents dead loops where the model keeps calling tools forever.
 */

export type AgentRunLimitsConfig = {
  /** Max tool executions allowed in one prompt run (default 40). */
  maxToolCalls: number;
  /**
   * Max consecutive failed executions of the same tool fingerprint
   * (name + args) before further identical calls are blocked (default 2).
   */
  maxToolFailures: number;
  /**
   * Tool-using LLM turns before the next turn must answer with tools removed
   * (default 30). The turn after that answer turn aborts.
   */
  maxTurns: number;
};

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

export function getAgentRunLimitsConfig(
  env: NodeJS.ProcessEnv = process.env,
): AgentRunLimitsConfig {
  return {
    maxToolCalls: envPositiveInt(env.AGENT_MAX_TOOL_CALLS, 40, 1, 100),
    maxToolFailures: envPositiveInt(env.AGENT_TOOL_MAX_FAILURES, 2, 1, 20),
    maxTurns: envPositiveInt(env.AGENT_MAX_TURNS, 30, 1, 200),
  };
}

/** Stable fingerprint for "same tool call" retry detection. */
export function toolCallFingerprint(name: string, args: unknown): string {
  return `${name}::${stableStringify(args)}`;
}

function stableStringify(value: unknown): string {
  try {
    return JSON.stringify(sortKeys(value));
  } catch {
    return String(value);
  }
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj).sort()) {
      out[k] = sortKeys(obj[k]);
    }
    return out;
  }
  return value;
}

export type ToolGuardDecision =
  | { allow: true }
  | { allow: false; reason: string };

/** Mutable counters for one agent.prompt() run. */
export class AgentRunToolGuard {
  private toolCalls = 0;
  private turns = 0;
  private blockedAfterLimit = 0;
  private readonly failures = new Map<string, number>();
  private readonly cfg: AgentRunLimitsConfig;
  private hardStop = false;
  /** The next generation is the answer turn: no tools, then stop. */
  private answerTurn = false;

  constructor(cfg: AgentRunLimitsConfig = getAgentRunLimitsConfig()) {
    this.cfg = cfg;
  }

  get toolCallCount(): number {
    return this.toolCalls;
  }

  get turnCount(): number {
    return this.turns;
  }

  get shouldHardStop(): boolean {
    return this.hardStop;
  }

  /**
   * True after the tool-turn budget is spent and before the answer turn
   * starts. The loop should drop tools for the next provider request.
   */
  get stripTools(): boolean {
    return this.turns >= this.cfg.maxTurns && !this.answerTurn;
  }

  /** Call on each `turn_start` event. Returns true if the run should abort. */
  onTurnStart(): boolean {
    this.turns += 1;
    if (this.answerTurn) {
      this.hardStop = true;
      return true;
    }
    if (this.turns > this.cfg.maxTurns) {
      this.answerTurn = true;
      return false;
    }
    return false;
  }

  beforeToolCall(name: string, args: unknown): ToolGuardDecision {
    if (this.hardStop || this.answerTurn) {
      return {
        allow: false,
        reason: this.answerTurn
          ? 'No more tools. Answer now from the file list or evidence already retrieved.'
          : 'Agent run was stopped (turn or tool limit). Answer with available evidence only.',
      };
    }

    if (this.toolCalls >= this.cfg.maxToolCalls) {
      this.blockedAfterLimit += 1;
      if (this.blockedAfterLimit >= 2) {
        this.hardStop = true;
      }
      return {
        allow: false,
        reason:
          `Tool call limit reached (${this.cfg.maxToolCalls} max). ` +
          `Do not call more tools; answer using evidence already retrieved.`,
      };
    }

    const fp = toolCallFingerprint(name, args);
    const fails = this.failures.get(fp) ?? 0;
    if (fails >= this.cfg.maxToolFailures) {
      this.blockedAfterLimit += 1;
      if (this.blockedAfterLimit >= 3) {
        this.hardStop = true;
      }
      return {
        allow: false,
        reason:
          `Tool "${name}" failed ${fails} time(s) with the same arguments ` +
          `(max ${this.cfg.maxToolFailures}). Do not retry this call; ` +
          `change arguments, use a different tool, or answer with what you have.`,
      };
    }

    this.toolCalls += 1;
    return { allow: true };
  }

  afterToolCall(name: string, args: unknown, isError: boolean): void {
    const fp = toolCallFingerprint(name, args);
    if (isError) {
      this.failures.set(fp, (this.failures.get(fp) ?? 0) + 1);
    } else {
      this.failures.set(fp, 0);
    }
  }
}
