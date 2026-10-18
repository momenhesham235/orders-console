import { db } from "../db/connection.js";
import type { OrderStatus } from "./order-status.js";
import type { ListOrdersQuery, OrderCursor, SortField } from "./orders.schema.js";

export interface OrderSummary {
  id: number;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalCents: number;
  itemCount: number;
  createdAt: string;
}

export interface OrdersPage {
  orders: OrderSummary[];
  nextCursor: OrderCursor | null;
}

// Whitelist: the only strings ever interpolated into the SQL below.
const SORT_COLUMNS: Record<SortField, string> = {
  createdAt: "created_at",
  total: "total_cents",
};

// The trigram index cannot match terms shorter than 3 characters. Shorter terms fall back to
// a LIKE scan with the same "contains" semantics, so results never change character at the
// 3rd keystroke. Measured on 50k rows: ~0.3ms typically (the scan stops once a page is full),
// ~60ms worst case (a rare 2-character term with no matches scans the whole table).
const TRIGRAM_MIN_LENGTH = 3;

function searchCondition(term: string): { sql: string; params: string[] } {
  if ([...term].length >= TRIGRAM_MIN_LENGTH) {
    // A quoted FTS5 phrase: user input is matched literally, never parsed as query syntax.
    return {
      sql: "o.id IN (SELECT rowid FROM orders_search WHERE orders_search MATCH ?)",
      params: [`"${term.replaceAll('"', '""')}"`],
    };
  }
  // Escape LIKE wildcards so "%" or "_" match themselves instead of everything.
  const pattern = `%${term.replace(/[!%_]/g, "!$&")}%`;
  return {
    sql: "(o.customer_name LIKE ? ESCAPE '!' OR o.customer_email LIKE ? ESCAPE '!')",
    params: [pattern, pattern],
  };
}

export function listOrders({ search, status, sort, direction, limit, cursor }: ListOrdersQuery): OrdersPage {
  const column = SORT_COLUMNS[sort];
  const order = direction === "desc" ? "DESC" : "ASC";

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (status) {
    conditions.push("o.status = ?");
    params.push(status);
  }
  if (search) {
    const condition = searchCondition(search);
    conditions.push(condition.sql);
    params.push(...condition.params);
  }
  if (cursor) {
    // Keyset pagination: continue strictly after the last row seen, with id breaking ties.
    // Matches the (sort column, id) indexes, so every page costs the same as the first.
    conditions.push(`(o.${column}, o.id) ${direction === "desc" ? "<" : ">"} (?, ?)`);
    params.push(cursor.value, cursor.id);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  // Fetch one extra row to learn whether another page exists without a COUNT query.
  const rows = db
    .prepare(
      `SELECT o.id,
              o.customer_name  AS customerName,
              o.customer_email AS customerEmail,
              o.status,
              o.total_cents    AS totalCents,
              (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.id) AS itemCount,
              o.created_at     AS createdAt
       FROM orders o
       ${where}
       ORDER BY o.${column} ${order}, o.id ${order}
       LIMIT ?`,
    )
    .all(...params, limit + 1) as OrderSummary[];

  const hasMore = rows.length > limit;
  const orders = hasMore ? rows.slice(0, limit) : rows;
  const last = orders[orders.length - 1];

  let nextCursor: OrderCursor | null = null;
  if (hasMore && last) {
    nextCursor =
      sort === "createdAt"
        ? { sort, direction, value: last.createdAt, id: last.id }
        : { sort, direction, value: last.totalCents, id: last.id };
  }

  return { orders, nextCursor };
}

// Line items go with it (ON DELETE CASCADE); the search index is updated by its trigger.
export function deleteOrder(id: number): boolean {
  return db.prepare("DELETE FROM orders WHERE id = ?").run(id).changes > 0;
}
