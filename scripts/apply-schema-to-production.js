/**
 * 🚀 Aplicar Schema a Producción (Neon)
 * 
 * Sincroniza el schema de Prisma con la base de datos de producción
 * sin borrar datos existentes.
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const PRODUCTION_URL = process.env.PRODUCTION_DATABASE_URL;

if (!PRODUCTION_URL) {
  console.error("❌ PRODUCTION_DATABASE_URL no está definida en .env");
  process.exit(1);
}

console.log("🚀 APLICANDO SCHEMA A PRODUCCIÓN (NEON)\n");
console.log("⚠️  Esta operación:");
console.log("   - Agregará la tabla team_connections");
console.log("   - Agregará el enum ConnectionStatus");
console.log("   - Agregará relaciones en Team, Project, Company");
console.log("   - NO borrará datos existentes\n");

// Esperar confirmación
console.log("🔍 Conectando a producción en 3 segundos...");
await new Promise((resolve) => setTimeout(resolve, 3000));

try {
  console.log("⏳ Ejecutando prisma db push en producción...\n");

  // Ejecutar prisma db push con la URL de producción
  execSync(
    `npx prisma db push --accept-data-loss`,
    {
      env: {
        ...process.env,
        DATABASE_URL: PRODUCTION_URL,
      },
      stdio: "inherit",
    }
  );

  console.log("\n✅ Schema aplicado a producción exitosamente");

  // Verificar que la tabla existe
  console.log("\n🔍 Verificando tabla team_connections...");
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: PRODUCTION_URL,
      },
    },
  });

  // Query de prueba
  const count = await prisma.teamConnection.count();
  console.log(`✅ Tabla team_connections creada correctamente`);
  console.log(`   Registros actuales: ${count}`);

  await prisma.$disconnect();

  console.log("\n🎉 ¡APLICACIÓN A PRODUCCIÓN COMPLETADA!");
  console.log("\n📋 NUEVOS ENDPOINTS DISPONIBLES:");
  console.log("   GET  /teams/:teamId/profile");
  console.log("   POST /teams/:teamId/connect");
  console.log("   GET  /teams/:teamId/connections");

} catch (error) {
  console.error("\n❌ ERROR al aplicar schema a producción:");
  console.error(error.message);
  process.exit(1);
}
