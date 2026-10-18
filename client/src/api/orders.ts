import { getJson, postJson } from "./http.ts";

// Mirrors the server's API contract (server/src/orders).
export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type SortField = "createdAt" | "total";
export type SortDirection = "asc" | "desc";

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
  nextCursor: string | null;
}

export interface OrderFilters {
  search?: string;
  status?: OrderStatus;
  sort: SortField;
  direction: SortDirection;
}

export const PAGE_SIZE = 50;

export function fetchOrders(filters: OrderFilters, cursor: string | null, signal: AbortSignal): Promise<OrdersPage> {
  return getJson<OrdersPage>("/api/orders", { ...filters, cursor, limit: PAGE_SIZE }, signal);
}

export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  items: { productName: string; quantity: number; unitPriceCents: number }[];
}

// A request that hangs this long is abandoned and retried with the same key: if the first
// attempt did reach the server, the retry gets that order back instead of creating another.
const CREATE_TIMEOUT_MS = 15_000;

export async function createOrder(input: CreateOrderInput, idempotencyKey: string): Promise<OrderSummary> {
  const { order } = await postJson<{ order: OrderSummary }>("/api/orders", input, {
    headers: { "Idempotency-Key": idempotencyKey },
    signal: AbortSignal.timeout(CREATE_TIMEOUT_MS),
  });
  return order;
}
