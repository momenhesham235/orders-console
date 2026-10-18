import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const ALGORITHM = "HS256";

export const SESSION_TTL_MS = env.SESSION_TTL_HOURS * 60 * 60 * 1000;

function resolveSecret(): string {
  if (env.JWT_SECRET) return env.JWT_SECRET;
  if (env.NODE_ENV === "production") throw new Error("JWT_SECRET must be set in production");

  // Development fallback that is never committed: a fresh random secret per run.
  // The cost is that sessions end whenever the server restarts.
  console.warn("JWT_SECRET is not set; using a random secret for this run. Set it in server/.env to keep sessions across restarts.");
  return randomBytes(32).toString("hex");
}

const secret = resolveSecret();

// The token carries only the user id. The role is read from the database on every request,
// so a role change or a deleted user takes effect immediately instead of at token expiry.
export function signSessionToken(userId: number): string {
  return jwt.sign({}, secret, {
    algorithm: ALGORITHM,
    subject: String(userId),
    expiresIn: env.SESSION_TTL_HOURS * 60 * 60,
  });
}

export function verifySessionToken(token: string): number | null {
  try {
    // verify (not decode): checks the signature and expiry, and pins the algorithm.
    const payload = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
    if (typeof payload === "string") return null;
    const userId = Number(payload.sub);
    return Number.isInteger(userId) ? userId : null;
  } catch {
    return null;
  }
}
