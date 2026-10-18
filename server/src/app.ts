import express, { type ErrorRequestHandler } from "express";
import { healthRouter } from "./routes/health.js";

const handleUnexpectedError: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  app.use("/api/health", healthRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
  app.use(handleUnexpectedError);

  return app;
}
