import { randomBytes } from "node:crypto";
import { Router, type CookieOptions } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth, SESSION_COOKIE } from "./auth.middleware.js";
import { hashPassword, verifyPassword } from "./password.js";
import { SESSION_TTL_MS, signSessionToken } from "./token.js";
import { findUserByEmail } from "./users.repository.js";

export const authRouter = Router();

// Strings only: an object such as { "not": "" } in place of the email never reaches the database.
const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});

const sessionCookieOptions: CookieOptions = {
  httpOnly: true, // unreadable from JavaScript, so an XSS payload cannot steal it
  sameSite: "strict", // not sent on cross-site requests, which blocks CSRF
  secure: env.NODE_ENV === "production",
  path: "/api",
};

// A UI hint, not a credential: it only tells the client whether asking /api/auth/me is worth
// a request, so the login screen loads with no API call at all. The server never reads it;
// every protected route verifies the real session cookie and the role. Anyone can forge it,
// and the worst outcome is one /me request answered with 401.
const SESSION_HINT_COOKIE = "orders_signed_in";

const sessionHintCookieOptions: CookieOptions = {
  httpOnly: false, // the client must be able to read it
  sameSite: "strict",
  secure: env.NODE_ENV === "production",
  path: "/", // visible to the page, unlike the /api-scoped session cookie
};

// Failed attempts only, per client IP. Behind a reverse proxy, "trust proxy" must be set
// for the real client IP to be used.
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many failed login attempts. Try again in 15 minutes." },
});

// Compared against when the email is unknown, so both paths cost one scrypt and the response
// time does not reveal which emails have accounts.
const unknownUserHash = await hashPassword(randomBytes(16).toString("hex"));

authRouter.post("/login", loginRateLimit, async (req, res) => {
  const credentials = loginSchema.safeParse(req.body);
  if (!credentials.success) {
    res.status(400).json({ error: "Invalid request", details: z.flattenError(credentials.error).fieldErrors });
    return;
  }

  const user = findUserByEmail(credentials.data.email);
  const passwordMatches = await verifyPassword(credentials.data.password, user?.passwordHash ?? unknownUserHash);
  if (!user || !passwordMatches) {
    res.status(401).json({ error: "Wrong email or password" });
    return;
  }

  res.cookie(SESSION_COOKIE, signSessionToken(user.id), { ...sessionCookieOptions, maxAge: SESSION_TTL_MS });
  // Same lifetime as the session. That cannot keep them in sync on its own (the server can
  // revoke a session earlier), which is why the client still confirms with /me.
  res.cookie(SESSION_HINT_COOKIE, "1", { ...sessionHintCookieOptions, maxAge: SESSION_TTL_MS });
  res.json({ user: { id: user.id, email: user.email, role: user.role } });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions);
  res.clearCookie(SESSION_HINT_COOKIE, sessionHintCookieOptions);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
