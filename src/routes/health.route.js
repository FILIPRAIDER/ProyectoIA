import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import os from "os";

export const router = Router();

router.get("/", async (_req, res, next) => {
  const start = Date.now();

  try {
    // Test DB connection
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    res.json({
      ok: true,
      service: "core-api",
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      db: {
        status: "up",
        latency: `${dbLatency}ms`,
      },
      system: {
        platform: os.platform(),
        nodeVersion: process.version,
        memory: {
          totalMB: Math.round(os.totalmem() / 1024 / 1024),
          freeMB: Math.round(os.freemem() / 1024 / 1024),
          usagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
        },
      },
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      service: "core-api",
      db: { status: "down", error: error.message },
      timestamp: new Date().toISOString(),
    });
  }
});

// Endpoint para readiness checks (Railway, Vercel)
router.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).send("OK");
  } catch (error) {
    res.status(503).send("Service Unavailable");
  }
});

// Endpoint para liveness checks
router.get("/live", (_req, res) => {
  res.status(200).send("OK");
});

