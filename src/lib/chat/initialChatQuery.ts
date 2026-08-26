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

  const path = appPathname(pathname);
  const isChatRoute = path === '/' || path.startsWith('/c/');
  if (!isChatRoute) {
    return null;
  }

  return trimmed;
}
