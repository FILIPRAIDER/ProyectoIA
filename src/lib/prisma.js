// src/lib/prisma.js
import { PrismaClient } from "@prisma/client";
import { DATABASE_URL } from "../env.js";

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL no está definida. Revisa tu .env");
}

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: ["error", "warn"],
    datasources: { db: { url: DATABASE_URL } },
    // Configuración de connection pooling para Neon
    connectionLimit: 10, // Límite de conexiones
    pool: {
      timeout: 20, // Timeout en segundos
      idleTimeout: 10, // Cerrar conexiones inactivas después de 10s
    },
  });

if (!globalForPrisma.__prisma) globalForPrisma.__prisma = prisma;

// --- Apagado limpio para evitar conexiones colgadas en reinicios ---

async function gracefulDisconnect(label) {
  try {
    await prisma.$disconnect();
    console.log(`🔌 Prisma desconectado (${label})`);
  } catch (e) {
    console.warn("No se pudo desconectar Prisma:", e?.message || e);
  }
}

process.on("beforeExit", () => gracefulDisconnect("beforeExit"));
process.on("exit", () => gracefulDisconnect("exit"));
process.on("SIGINT", async () => {
  await gracefulDisconnect("SIGINT");
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await gracefulDisconnect("SIGTERM");
  process.exit(0);
});
