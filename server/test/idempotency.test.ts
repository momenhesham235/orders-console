// R2 proof: the same create request, fired in parallel, produces exactly one order.
//
// Two separate API processes share one database file, and the duplicates are sent to both at
// the same moment. So the guarantee shown here comes from the database's unique index, not from
// Node handling one request at a time inside a single process.

import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const serverDir = fileURLToPath(new URL("..", import.meta.url));
const dataDir = mkdtempSync(join(tmpdir(), "orders-console-test-"));
const databasePath = join(dataDir, "test.db");

const testEnv = {
  ...process.env,
  NODE_ENV: "test",
  PORT: "0",
  DATABASE_PATH: databasePath,
  JWT_SECRET: randomBytes(32).toString("hex"),
  SIMULATED_LATENCY_MS: "0",
};

const servers: ChildProcess[] = [];
let apiA = "";
let apiB = "";
let sessionCookie = "";

function startServer(): Promise<string> {
  const child = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], { cwd: serverDir, env: testEnv });
  servers.push(child);

  return new Promise((resolve, reject) => {
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const port = /listening on http:\/\/localhost:(\d+)/.exec(output)?.[1];
      if (port) resolve(`http://localhost:${port}/api`);
    });
    child.stderr.on("data", (chunk: Buffer) => (output += chunk.toString()));
    child.on("exit", (code) => reject(new Error(`API exited early (code ${code}):\n${output}`)));
  });
}

interface OrderBody {
  customerName: string;
  customerEmail: string;
  items: { productName: string; quantity: number; unitPriceCents: number }[];
}

function sampleOrder(overrides: Partial<OrderBody> = {}): OrderBody {
  return {
    customerName: "Phone Order Customer",
    customerEmail: "phone.customer@example.com",
    items: [
      { productName: "Wireless Mouse", quantity: 2, unitPriceCents: 7_900 },
      { productName: "USB-C Hub", quantity: 1, unitPriceCents: 14_500 },
    ],
    ...overrides,
  };
}

function postOrder(api: string, body: unknown, idempotencyKey?: string) {
  return fetch(`${api}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  });
}

function queryDb<T>(sql: string, ...params: unknown[]): T {
  const db = new Database(databasePath, { readonly: true });
  try {
    return db.prepare(sql).get(...params) as T;
  } finally {
    db.close();
  }
}

const ordersWithKey = (key: string) =>
  queryDb<{ count: number }>("SELECT COUNT(*) AS count FROM orders WHERE idempotency_key = ?", key).count;
const totalOrders = () => queryDb<{ count: number }>("SELECT COUNT(*) AS count FROM orders").count;

before(async () => {
  const seed = spawnSync(process.execPath, ["--import", "tsx", "src/db/seed/index.ts", "--orders=100"], {
    cwd: serverDir,
    env: testEnv,
    encoding: "utf8",
  });
  assert.equal(seed.status, 0, seed.stderr);

  [apiA, apiB] = await Promise.all([startServer(), startServer()]);

  const login = await fetch(`${apiA}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "agent@orders.local", password: "Agent#2026" }),
  });
  assert.equal(login.status, 200);
  sessionCookie = login.headers.get("set-cookie")!.split(";")[0]!;
});

after(() => {
  for (const server of servers) server.kill();
  rmSync(dataDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
});

describe("POST /api/orders is idempotent", () => {
  test("the same request fired twice in parallel creates exactly one order", async () => {
    const key = randomUUID();
    const before = totalOrders();

    const responses = await Promise.all([postOrder(apiA, sampleOrder(), key), postOrder(apiB, sampleOrder(), key)]);
    const bodies = (await Promise.all(responses.map((response) => response.json()))) as { order: { id: number } }[];

    assert.deepEqual(responses.map((response) => response.status).sort(), [200, 201]);
    assert.equal(bodies[0]!.order.id, bodies[1]!.order.id, "both responses describe the same order");
    assert.equal(ordersWithKey(key), 1);
    assert.equal(totalOrders(), before + 1);
  });

  test("20 parallel duplicates across two processes still create exactly one order", async () => {
    const key = randomUUID();
    const body = sampleOrder({ customerName: "Twenty Retries" });

    const responses = await Promise.all(
      Array.from({ length: 20 }, (_, i) => postOrder(i % 2 ? apiB : apiA, body, key)),
    );
    const statuses = responses.map((response) => response.status);

    assert.equal(statuses.filter((status) => status === 201).length, 1, "exactly one request created the order");
    assert.equal(statuses.filter((status) => status === 200).length, 19, "every other request replayed it");
    assert.ok(responses.filter((response) => response.status === 200).every((r) => r.headers.get("idempotent-replayed") === "true"));
    assert.equal(ordersWithKey(key), 1);

    const { items } = queryDb<{ items: number }>(
      "SELECT COUNT(*) AS items FROM order_items WHERE order_id = (SELECT id FROM orders WHERE idempotency_key = ?)",
      key,
    );
    assert.equal(items, body.items.length, "line items were not duplicated either");
  });

  test("a sequential retry returns the original order instead of a new one", async () => {
    const key = randomUUID();
    const first = await postOrder(apiA, sampleOrder(), key);
    const retry = await postOrder(apiB, sampleOrder(), key);

    assert.equal(first.status, 201);
    assert.equal(retry.status, 200);
    assert.deepEqual(await retry.json(), await first.json());
    assert.equal(ordersWithKey(key), 1);
  });

  test("reusing a key for a different order is rejected, not silently merged", async () => {
    const key = randomUUID();
    await postOrder(apiA, sampleOrder(), key);

    const reused = await postOrder(apiA, sampleOrder({ customerName: "Someone Else" }), key);

    assert.equal(reused.status, 422);
    assert.equal(ordersWithKey(key), 1);
  });

  test("different keys are different orders, even with identical details", async () => {
    const before = totalOrders();

    const [first, second] = await Promise.all([
      postOrder(apiA, sampleOrder(), randomUUID()),
      postOrder(apiB, sampleOrder(), randomUUID()),
    ]);

    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.equal(totalOrders(), before + 2);
  });

  test("a request without a valid key, or with an invalid body, creates nothing", async () => {
    const before = totalOrders();

    assert.equal((await postOrder(apiA, sampleOrder())).status, 400);
    assert.equal((await postOrder(apiA, sampleOrder(), "not-a-uuid")).status, 400);
    assert.equal((await postOrder(apiA, sampleOrder({ items: [] }), randomUUID())).status, 400);
    assert.equal((await postOrder(apiA, sampleOrder({ customerEmail: "nope" }), randomUUID())).status, 400);
    assert.equal(totalOrders(), before);
  });
});
