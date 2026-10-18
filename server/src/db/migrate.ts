import { db } from "./connection.js";
import { migrations } from "./migrations.js";

export function runMigrations(): number[] {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `);

  const applied = new Set(
    db.prepare("SELECT id FROM schema_migrations").pluck().all() as number[],
  );
  const recordMigration = db.prepare("INSERT INTO schema_migrations (id, name) VALUES (?, ?)");

  const pending = migrations.filter((migration) => !applied.has(migration.id));

  // Each migration and its bookkeeping row commit together, or not at all.
  for (const migration of pending) {
    db.transaction(() => {
      db.exec(migration.sql);
      recordMigration.run(migration.id, migration.name);
    })();
  }

  return pending.map((migration) => migration.id);
}
