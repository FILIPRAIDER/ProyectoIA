import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    // Ping simple a DB
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, service: "core-api", db: "up" });
  } catch (e) {
    next({ status: 500, message: "DB down", details: e.message });
  }
});
