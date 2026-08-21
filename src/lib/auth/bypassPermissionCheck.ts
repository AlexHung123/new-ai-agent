import { focusModes } from '@/lib/agents';
import configManager from '@/lib/config';

export function allAgentPermissionCodes(): string[] {
  return [
    ...new Set(
      focusModes
        .map((mode) => mode.permissionCode)
        .filter((code): code is string => Boolean(code)),
    ),
  ];
}

export function isBypassPermissionCheckEnabled(raw: unknown): boolean {
  return raw === true;
}

export function readBypassPermissionCheck(): boolean {
  return isBypassPermissionCheckEnabled(
    configManager.getConfig('bypassPermissionCheck', false),
  );
}

export function resolveAgentPermissions(
  fromItms: readonly string[],
  bypass: boolean = readBypassPermissionCheck(),
): string[] {
  if (bypass) {
    return allAgentPermissionCodes();
  }

  return [...fromItms];
}
