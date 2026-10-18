// Mirrors the server's readable "orders_signed_in" cookie (server/src/auth/auth.routes.ts).
// It only decides whether confirming the session with /api/auth/me is worth a request; it grants
// nothing. The real session cookie is httpOnly and invisible to this code.
const SESSION_HINT_COOKIE = "orders_signed_in";

export function hasSessionHint(): boolean {
  return document.cookie.split("; ").some((cookie) => cookie.startsWith(`${SESSION_HINT_COOKIE}=`));
}

export function clearSessionHint(): void {
  document.cookie = `${SESSION_HINT_COOKIE}=; Max-Age=0; Path=/; SameSite=Strict`;
}
