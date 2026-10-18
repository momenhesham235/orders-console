import cookieParser from "cookie-parser";
import express, { type ErrorRequestHandler } from "express";
import { authRouter } from "./auth/auth.routes.js";
import { env } from "./config/env.js";
import { simulatedLatency } from "./middleware/simulated-latency.js";
import { ordersRouter } from "./orders/orders.routes.js";
import { healthRouter } from "./routes/health.js";

const handleUnexpectedError: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);

  if (env.SIMULATED_LATENCY_MS > 0) app.use("/api/orders", simulatedLatency(env.SIMULATED_LATENCY_MS));
  app.use("/api/orders", ordersRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  app.use(handleUnexpectedError);

  return app;
}
