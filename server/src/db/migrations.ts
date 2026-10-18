export interface Migration {
  id: number;
  name: string;
  sql: string;
}

// Append-only: never edit a migration that has already run; add a new one instead.
export const migrations: Migration[] = [
  {
    id: 1,
    name: "init",
    sql: `
      CREATE TABLE users (
        id            INTEGER PRIMARY KEY,
        email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT    NOT NULL,
        role          TEXT    NOT NULL CHECK (role IN ('admin', 'agent')),
        created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE TABLE orders (
        id             INTEGER PRIMARY KEY,
        customer_name  TEXT    NOT NULL,
        customer_email TEXT    NOT NULL,
        status         TEXT    NOT NULL
                       CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
        total_cents    INTEGER NOT NULL CHECK (total_cents >= 0),
        created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE TABLE order_items (
        id               INTEGER PRIMARY KEY,
        order_id         INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
        product_name     TEXT    NOT NULL,
        quantity         INTEGER NOT NULL CHECK (quantity > 0),
        unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0)
      );

      CREATE INDEX idx_order_items_order_id ON order_items (order_id);
    `,
  },
  {
    id: 2,
    name: "orders_list_indexes",
    // One index per (filter, sort) shape of the orders list. The trailing id is the keyset
    // tie-breaker, so "next page after (value, id)" is a single index range scan.
    sql: `
      CREATE INDEX idx_orders_created_at        ON orders (created_at, id);
      CREATE INDEX idx_orders_total             ON orders (total_cents, id);
      CREATE INDEX idx_orders_status_created_at ON orders (status, created_at, id);
      CREATE INDEX idx_orders_status_total      ON orders (status, total_cents, id);
    `,
  },
];
