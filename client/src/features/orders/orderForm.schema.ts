import { z } from "zod";
import type { CreateOrderInput, OrderDetail } from "../../api/orders.ts";

// Client-side validation for fast feedback. The server validates the same rules again
// (server/src/orders/orders.schema.ts) and is the one that is trusted.

export interface ItemDraft {
  rowId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
}

export interface OrderDraft {
  customerName: string;
  customerEmail: string;
  items: ItemDraft[];
}

export function emptyItem(): ItemDraft {
  return { rowId: crypto.randomUUID(), productName: "", quantity: "1", unitPrice: "" };
}

export function emptyDraft(): OrderDraft {
  return { customerName: "", customerEmail: "", items: [emptyItem()] };
}

export function draftFromOrder(order: OrderDetail): OrderDraft {
  return {
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    items: order.items.map((item) => ({
      rowId: crypto.randomUUID(),
      productName: item.productName,
      quantity: String(item.quantity),
      unitPrice: (item.unitPriceCents / 100).toFixed(2),
    })),
  };
}

/** Compares what the user typed, ignoring row ids, to tell whether a draft has unsaved changes. */
export function draftSignature(draft: OrderDraft): string {
  return JSON.stringify([
    draft.customerName,
    draft.customerEmail,
    draft.items.map((item) => [item.productName, item.quantity, item.unitPrice]),
  ]);
}

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

export function priceToCents(price: string): number | null {
  const trimmed = price.trim();
  return PRICE_PATTERN.test(trimmed) ? Math.round(Number(trimmed) * 100) : null;
}

const orderFormSchema = z.object({
  customerName: z.string().trim().min(2, "Enter the customer's name").max(100),
  customerEmail: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email").max(254)),
  items: z
    .array(
      z.object({
        productName: z.string().trim().min(1, "Required").max(100),
        quantity: z.coerce.number<string>().int("Whole number").min(1, "At least 1").max(999, "At most 999"),
        unitPrice: z
          .string()
          .trim()
          .regex(PRICE_PATTERN, "e.g. 12.50")
          .transform((price) => priceToCents(price) ?? 0)
          .pipe(z.int().min(1, "Must be above 0").max(10_000_000, "Too high")),
      }),
    )
    .min(1, "Add at least one item")
    .max(20, "At most 20 items"),
});

export type OrderFormErrors = Record<string, string>;

/** Errors are keyed by field path, e.g. "customerEmail" or "items.0.quantity". */
export function parseOrderDraft(draft: OrderDraft): { input: CreateOrderInput } | { errors: OrderFormErrors } {
  const result = orderFormSchema.safeParse(draft);
  if (!result.success) {
    const errors: OrderFormErrors = {};
    for (const issue of result.error.issues) errors[issue.path.join(".")] ??= issue.message;
    return { errors };
  }

  return {
    input: {
      customerName: result.data.customerName,
      customerEmail: result.data.customerEmail,
      items: result.data.items.map(({ productName, quantity, unitPrice }) => ({
        productName,
        quantity,
        unitPriceCents: unitPrice,
      })),
    },
  };
}
