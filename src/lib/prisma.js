// src/lib/prisma.js
import { PrismaClient } from "@prisma/client";
import { DATABASE_URL } from "../env.js";

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL no está definida. Revisa tu .env");
}

const globalForPrisma = globalThis;

// ✨ MEJORADO: Configuración optimizada para Neon PostgreSQL
export const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: { db: { url: DATABASE_URL } },
    // ✨ NUEVO: Formato de errores más legible
    errorFormat: 'pretty',
  });

if (!globalForPrisma.__prisma) {
  globalForPrisma.__prisma = prisma;
  
  // ✨ NUEVO: Middleware para reconectar automáticamente
  prisma.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error) {
      // Si la conexión se cerró, intentar reconectar
      if (error?.message?.includes('Closed') || error?.message?.includes('connection')) {
        console.warn('⚠️ Conexión cerrada, intentando reconectar...');
        try {
          await prisma.$connect();
          return await next(params);
        } catch (reconnectError) {
          console.error('❌ Error al reconectar:', reconnectError);
          throw error;
        }
      }
      throw error;
    }
  });
  
  console.log('✅ Prisma Client inicializado');
}

// --- Apagado limpio para evitar conexiones colgadas en reinicios ---

async function gracefulDisconnect(label) {
  try {
    await prisma.$disconnect();
    console.log(`🔌 Prisma desconectado (${label})`);
  } catch (e) {
    console.warn("No se pudo desconectar Prisma:", e?.message || e);
  }
}

// ✨ MEJORADO: Solo disconnect en shutdown, no en exit
process.on("SIGINT", async () => {
  await gracefulDisconnect("SIGINT");
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await gracefulDisconnect("SIGTERM");
  process.exit(0);
});
