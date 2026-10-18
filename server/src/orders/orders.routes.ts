import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../auth/auth.middleware.js";
import { createOrder, deleteOrder, listOrders } from "./orders.repository.js";
import { createOrderSchema, encodeCursor, idempotencyKeySchema, listOrdersQuerySchema } from "./orders.schema.js";

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

// Exactly-once creation: double-clicks, network retries and browser resends all carry the same
// Idempotency-Key, and every request after the first gets the original order back.
ordersRouter.post("/", (req, res) => {
  // Required, so no order can be created on a path that skips the duplicate protection.
  const idempotencyKey = idempotencyKeySchema.safeParse(req.get("Idempotency-Key"));
  if (!idempotencyKey.success) {
    res.status(400).json({ error: "Idempotency-Key header must be a UUID" });
    return;
  }

  const input = createOrderSchema.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Invalid order", details: z.flattenError(input.error).fieldErrors });
    return;
  }

  const result = createOrder(input.data, { userId: req.user!.id, idempotencyKey: idempotencyKey.data });

  switch (result.outcome) {
    case "created":
      res.status(201).json({ order: result.order });
      return;
    case "replayed":
      res.status(200).set("Idempotent-Replayed", "true").json({ order: result.order });
      return;
    case "key-reused":
      res.status(422).json({
        error: `This request key was already used for order #${result.orderId} with different details`,
      });
      return;
  }
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
