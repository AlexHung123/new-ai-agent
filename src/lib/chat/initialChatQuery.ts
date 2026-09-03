const APP_BASE_PATH = '/itms/ai';

function appPathname(pathname: string): string {
  const raw = pathname.split('?')[0] || '/';
  const withoutBase = raw.replace(
    new RegExp(`^${APP_BASE_PATH}(?=/|$)`),
    '',
  );
  const path = withoutBase.replace(/\/+$/, '') || '/';
  return path.startsWith('/') ? path : `/${path}`;
}

export function isChatPath(pathname: string): boolean {
  const path = appPathname(pathname);
  return path === '/' || path.startsWith('/c/');
}

export function isNewChatPath(pathname: string): boolean {
  return appPathname(pathname) === '/';
}

/** `?q=` bootstraps a first chat message. It must not apply on other pages
 * (admin search also uses `q`, and ChatProvider is mounted app-wide). */
export function initialChatQuery(
  pathname: string,
  q: string | null | undefined,
): string | null {
  const trimmed = (q ?? '').trim();
  if (!trimmed) {
    return null;
  }

  if (!isChatPath(pathname)) {
    return null;
  }

  return trimmed;
}
