import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { env } from "../config/env.js";

const databaseFile = resolve(env.DATABASE_PATH);
mkdirSync(dirname(databaseFile), { recursive: true });

export const db = new Database(databaseFile);

// WAL lets reads proceed while a write is in progress; foreign keys are off by default in SQLite.
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");
