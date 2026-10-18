import { existsSync } from "node:fs";
import { z } from "zod";

// Load server/.env when present; real environment variables always win.
if (existsSync(".env")) process.loadEnvFile(".env");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_PATH: z.string().min(1).default("./data/orders.db"),
  SIMULATED_LATENCY_MS: z.coerce.number().int().min(0).default(0),
  // An empty value (as copied from .env.example) counts as unset.
  JWT_SECRET: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(32, "JWT_SECRET must be at least 32 characters").optional(),
  ),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(8),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
