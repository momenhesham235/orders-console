import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./db/connection.js";
import { runMigrations } from "./db/migrate.js";

const applied = runMigrations();
if (applied.length) console.log(`Applied migrations: ${applied.join(", ")}`);

const server = createApp().listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
