import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import { deleteOrder, listOrders } from "./orders.repository.js";
import { encodeCursor, listOrdersQuerySchema } from "./orders.schema.js";

export const ordersRouter = Router();

// Applied to the whole router, so no orders route can be added unprotected by accident.
ordersRouter.use(requireAuth);

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

const orderIdSchema = z.coerce.number().int().positive();

ordersRouter.delete("/:id", requireRole("admin"), (req, res) => {
  const id = orderIdSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid order id" });
    return;
  }

  if (!deleteOrder(id.data)) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.status(204).end();
});
