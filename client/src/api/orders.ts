import { getJson } from "./http.ts";

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
