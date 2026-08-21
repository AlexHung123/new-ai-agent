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
    if (!mode.permissionCode) {
      return true;
    }
    return permissions?.includes(mode.permissionCode) ?? false;
  });
}
