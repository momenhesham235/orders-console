// Two screens and no links between them, so the address bar simply follows the session:
// /login while signed out, /orders while signed in. No router library needed.
export const ROUTES = { login: "/login", orders: "/orders" } as const;

const APP_PATHS = new Set<string>(["/", ROUTES.login, ROUTES.orders]);

/** Paths the app answers; anything else gets the 404 screen. */
export function isAppPath(pathname: string): boolean {
  return APP_PATHS.has(pathname);
}

// Only a same-app orders URL is followed after sign-in; anything else (another site, another path)
// falls back to the plain list, so ?next= can never be used as an open redirect.
function safeOrdersUrl(next: string | null): string {
  return next === ROUTES.orders || next?.startsWith(`${ROUTES.orders}?`) ? next : ROUTES.orders;
}

/** The full URL to move to when the session calls for another screen, keeping filters across sign-in. */
export function redirectUrl(to: (typeof ROUTES)[keyof typeof ROUTES]): string {
  const { pathname, search } = window.location;

  if (to === ROUTES.login) {
    // Remember a filtered view opened while signed out, to return to it after signing in.
    return pathname === ROUTES.orders && search
      ? `${ROUTES.login}?next=${encodeURIComponent(`${ROUTES.orders}${search}`)}`
      : ROUTES.login;
  }

  if (pathname === ROUTES.login) return safeOrdersUrl(new URLSearchParams(search).get("next"));
  return `${ROUTES.orders}${search}`; // "/" keeps its filters
}

/** Changes the URL without a new history entry, so Back never returns to the login screen. */
export function replaceUrl(url: string): void {
  window.history.replaceState(window.history.state, "", url);
}
