import { parseArgs } from "node:util";
import { hashPassword } from "../../auth/password.js";
import type { OrderStatus } from "../../orders/order-status.js";
import { db } from "../connection.js";
import { runMigrations } from "../migrate.js";
import { EMAIL_DOMAINS, FIRST_NAMES, LAST_NAMES, PRODUCTS, SEED_USERS } from "./data.js";
import { createRandom, type Random } from "./random.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_DAYS = 365;
const CUSTOMER_COUNT = 10_000;

// Fresh orders cannot be shipped or delivered yet; older ones are mostly delivered.
const RECENT_STATUS_WEIGHTS = { pending: 50, paid: 35, cancelled: 15 } satisfies Partial<Record<OrderStatus, number>>;
const OLDER_STATUS_WEIGHTS: Record<OrderStatus, number> = {
  pending: 3,
  paid: 10,
  shipped: 15,
  delivered: 62,
  cancelled: 10,
};

interface Customer {
  name: string;
  email: string;
}

const { values } = parseArgs({
  options: { orders: { type: "string", default: "50000" } },
});
const orderCount = Number(values.orders);
if (!Number.isInteger(orderCount) || orderCount < 1) {
  console.error(`--orders must be a positive integer, got "${values.orders}"`);
  process.exit(1);
}

function buildCustomers(random: Random): Customer[] {
  return Array.from({ length: CUSTOMER_COUNT }, (_, index) => {
    const first = random.pick(FIRST_NAMES);
    const last = random.pick(LAST_NAMES);
    // The index suffix keeps every customer's email unique.
    const email = `${first}.${last}${index}@${random.pick(EMAIL_DOMAINS)}`.toLowerCase();
    return { name: `${first} ${last}`, email };
  });
}

async function seed() {
  runMigrations();

  const random = createRandom(2026);
  const customers = buildCustomers(random);
  const users = await Promise.all(
    SEED_USERS.map(async (user) => ({ ...user, passwordHash: await hashPassword(user.password) })),
  );

  const insertUser = db.prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)");
  const insertOrder = db.prepare(
    `INSERT INTO orders (customer_name, customer_email, status, total_cents, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_name, quantity, unit_price_cents)
     VALUES (?, ?, ?, ?)`,
  );

  const now = Date.now();
  let itemCount = 0;

  // One transaction: all-or-nothing, and orders of magnitude faster than autocommit per row.
  db.transaction(() => {
    db.exec("DELETE FROM order_items; DELETE FROM orders; DELETE FROM users;");

    for (const user of users) insertUser.run(user.email, user.passwordHash, user.role);

    for (let i = 0; i < orderCount; i++) {
      const customer = random.pick(customers);
      const createdAt = now - Math.floor(random.next() * HISTORY_DAYS * DAY_MS);
      const isRecent = now - createdAt < 3 * DAY_MS;
      const status = isRecent ? random.weighted(RECENT_STATUS_WEIGHTS) : random.weighted(OLDER_STATUS_WEIGHTS);

      const items = Array.from({ length: random.int(1, 5) }, () => ({
        product: random.pick(PRODUCTS),
        quantity: random.int(1, 3),
      }));
      const totalCents = items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);

      const { lastInsertRowid: orderId } = insertOrder.run(
        customer.name,
        customer.email,
        status,
        totalCents,
        new Date(createdAt).toISOString(),
      );
      for (const item of items) {
        insertItem.run(orderId, item.product.name, item.quantity, item.product.priceCents);
      }
      itemCount += items.length;
    }
  })();

  // Refresh the query planner's statistics so it picks the right index for each query.
  db.exec("ANALYZE");

  console.log(`Seeded ${users.length} users, ${orderCount} orders, ${itemCount} order items.`);
}

const startedAt = performance.now();
await seed();
console.log(`Done in ${((performance.now() - startedAt) / 1000).toFixed(1)}s.`);
db.close();
