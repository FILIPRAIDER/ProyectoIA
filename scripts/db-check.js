// scripts/db-check.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
try {
  const r = await prisma.$queryRaw`SELECT 1 as ok`;
  console.log("Conexión OK:", r);
} catch (e) {
  console.error("Fallo conexión:", e);
} finally {
  await prisma.$disconnect();
}
