export function publicConfigValues<T extends Record<string, unknown>>(
  config: T,
): T {
  const clone = JSON.parse(JSON.stringify(config)) as T;
  delete (clone as Record<string, unknown>).adminUserIds;
  return clone;
}

export function isForbiddenConfigKey(key: string): boolean {
  return key === 'adminUserIds' || key.startsWith('adminUserIds.');
}
