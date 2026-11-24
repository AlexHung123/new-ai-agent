import type { AgentMode } from '@/lib/agents';

export type AgentAccessError = 'unauthenticated' | 'empty' | 'error';

export function shouldAttemptTestLogin(input: {
  permissionStatus: number;
  tokenInUrl: boolean;
}): boolean {
  return input.permissionStatus === 401 && !input.tokenInUrl;
}

export function filterFocusModesByPermissions(
  modes: readonly AgentMode[],
  permissions: readonly string[] | undefined,
): AgentMode[] {
  return modes.filter((mode) => {
    const codes = mode.permissionCodes?.length
      ? mode.permissionCodes
      : mode.permissionCode
        ? [mode.permissionCode]
        : [];
    if (codes.length === 0) {
      return true;
    }
    return codes.some((code) => permissions?.includes(code) ?? false);
  });
}
