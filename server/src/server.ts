import type { AddressInfo } from "node:net";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./db/connection.js";
import { runMigrations } from "./db/migrate.js";

const applied = runMigrations();
if (applied.length) console.log(`Applied migrations: ${applied.join(", ")}`);

const server = createApp().listen(env.PORT, () => {
  // The actual port, which differs from env.PORT when PORT=0 asks the OS for a free one (tests do).
  const { port } = server.address() as AddressInfo;
  console.log(`API listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
