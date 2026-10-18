import { Router } from "express";
import { z } from "zod";
import { listOrders } from "./orders.repository.js";
import { encodeCursor, listOrdersQuerySchema } from "./orders.schema.js";

export const ordersRouter = Router();

ordersRouter.get("/", (req, res) => {
  const query = listOrdersQuerySchema.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query", details: z.flattenError(query.error).fieldErrors });
    return;
  }

  const page = listOrders(query.data);
  res.json({
    orders: page.orders,
    nextCursor: page.nextCursor && encodeCursor(page.nextCursor),
  });
});
