import type { RequestHandler } from "express";
import { verifySessionToken } from "./token.js";
import { findUserById, type Role } from "./users.repository.js";

export const SESSION_COOKIE = "orders_session";

// The session token is read from an httpOnly cookie only: never from the URL, where it would
// leak into server logs, browser history and Referer headers.
export const requireAuth: RequestHandler = (req, res, next) => {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  const userId = typeof token === "string" ? verifySessionToken(token) : null;
  const user = userId === null ? undefined : findUserById(userId);

  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req.user = user;
  next();
};

// Authorization is enforced here, on the server. Hiding a button in the UI is only cosmetic.
export function requireRole(role: Role): RequestHandler {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
