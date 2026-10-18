import { deleteRequest, getJson, postJson, putJson } from "./http.ts";

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

export interface OrderItem {
  productName: string;
  quantity: number;
  unitPriceCents: number;
}

export interface OrderDetail extends OrderSummary {
  version: number;
  items: OrderItem[];
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

export function fetchOrder(id: number, signal: AbortSignal): Promise<OrderDetail> {
  return getJson<{ order: OrderDetail }>(`/api/orders/${id}`, {}, signal).then(({ order }) => order);
}

export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
}

export interface UpdateOrderInput extends CreateOrderInput {
  status: OrderStatus;
  /** The version the edit started from; the server answers 409 if the order has changed since. */
  version: number;
}

// A write that hangs this long is abandoned. For a create, it is then retried with the same key:
// if the first attempt did reach the server, the retry gets that order back instead of another.
const WRITE_TIMEOUT_MS = 15_000;

export async function createOrder(input: CreateOrderInput, idempotencyKey: string): Promise<OrderSummary> {
  const { order } = await postJson<{ order: OrderSummary }>("/api/orders", input, {
    headers: { "Idempotency-Key": idempotencyKey },
    signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
  });
  return order;
}

export async function updateOrder(id: number, input: UpdateOrderInput): Promise<OrderDetail> {
  const { order } = await putJson<{ order: OrderDetail }>(`/api/orders/${id}`, input, {
    signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
  });
  return order;
}

/** Admin only: the server answers 403 for anyone else, whatever the UI shows. */
export function deleteOrder(id: number): Promise<void> {
  return deleteRequest(`/api/orders/${id}`);
}
