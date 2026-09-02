const SECRET_CONFIG_KEYS = ['adminUserIds', 'bypassPermissionCheck'] as const;

export function publicConfigValues<T extends Record<string, unknown>>(
  config: T,
): T {
  const clone = JSON.parse(JSON.stringify(config)) as T;
  for (const key of SECRET_CONFIG_KEYS) {
    delete (clone as Record<string, unknown>)[key];
  }
  const stt = (clone as Record<string, unknown>).stt;
  if (stt && typeof stt === 'object' && !Array.isArray(stt)) {
    delete (stt as Record<string, unknown>).apiKey;
  }
  return clone;
}

export function isForbiddenConfigKey(key: string): boolean {
  if (key === 'stt.apiKey' || key.startsWith('stt.apiKey.')) return true;
  return SECRET_CONFIG_KEYS.some(
    (secret) => key === secret || key.startsWith(`${secret}.`),
  );
}
