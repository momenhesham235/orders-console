import { Router } from "express";
import { db } from "../db/connection.js";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  // A real round-trip to the database, so "ok" means the API can actually serve data.
  db.prepare("SELECT 1").get();
  res.json({ status: "ok" });
});
