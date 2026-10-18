// Must stay in sync with the CHECK constraint on orders.status (migration 1).
export const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
