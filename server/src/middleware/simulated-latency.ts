import type { RequestHandler } from "express";

// Development aid: a random delay per request makes responses arrive out of order,
// which is exactly the condition the client's stale-response handling must survive.
export function simulatedLatency(maxMs: number): RequestHandler {
  return (_req, _res, next) => {
    setTimeout(() => next(), Math.random() * maxMs);
  };
}
