import { z } from "zod";
import { ORDER_STATUSES } from "./order-status.js";

export const SORT_FIELDS = ["createdAt", "total"] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;

export type SortField = (typeof SORT_FIELDS)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

// The position of the last row on a page. Bound to the sort it was produced under,
// because a createdAt cursor means nothing to a list sorted by total.
const cursorSchema = z.discriminatedUnion("sort", [
  z.object({ sort: z.literal("createdAt"), direction: z.enum(SORT_DIRECTIONS), value: z.iso.datetime(), id: z.int() }),
  z.object({ sort: z.literal("total"), direction: z.enum(SORT_DIRECTIONS), value: z.int(), id: z.int() }),
]);

export type OrderCursor = z.infer<typeof cursorSchema>;

export function encodeCursor(cursor: OrderCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(raw: string): OrderCursor | null {
  try {
    const result = cursorSchema.safeParse(JSON.parse(Buffer.from(raw, "base64url").toString("utf8")));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export const listOrdersQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(100)
      .transform((value) => value || undefined)
      .optional(),
    status: z.enum(ORDER_STATUSES).optional(),
    sort: z.enum(SORT_FIELDS).default("createdAt"),
    direction: z.enum(SORT_DIRECTIONS).default("desc"),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    cursor: z
      .string()
      .transform((raw, ctx) => {
        const cursor = decodeCursor(raw);
        if (!cursor) {
          ctx.addIssue({ code: "custom", message: "Invalid cursor" });
          return z.NEVER;
        }
        return cursor;
      })
      .optional(),
  })
  .refine((query) => !query.cursor || (query.cursor.sort === query.sort && query.cursor.direction === query.direction), {
    message: "Cursor belongs to a different sort order",
    path: ["cursor"],
  });

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
