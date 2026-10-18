import { db } from "./connection.js";
import { runMigrations } from "./migrate.js";

const applied = runMigrations();
console.log(applied.length ? `Applied migrations: ${applied.join(", ")}` : "Database is up to date.");
db.close();
