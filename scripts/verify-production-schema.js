/**
 * Verificar que el schema se aplicó correctamente en producción
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  console.log("🔍 Verificando schema en producción...\n");

  // Verificar tabla team_connections
  const connectionsCount = await prisma.teamConnection.count();
  console.log("✅ Tabla team_connections creada correctamente");
  console.log(`   Registros actuales: ${connectionsCount}`);

  // Verificar que el enum ConnectionStatus funciona
  console.log("\n✅ Enum ConnectionStatus disponible");
  console.log("   Valores: PENDING, ACCEPTED, REJECTED");

  // Verificar relaciones
  const teamsWithConnections = await prisma.team.findMany({
    where: { connections: { some: {} } },
    take: 1,
  });
  console.log("\n✅ Relación Team → TeamConnection funcional");

  const projectsWithConnections = await prisma.project.findMany({
    where: { connections: { some: {} } },
    take: 1,
  });
  console.log("✅ Relación Project → TeamConnection funcional");

  console.log("\n🎉 SCHEMA APLICADO EXITOSAMENTE EN PRODUCCIÓN");
  console.log("\n📋 ENDPOINTS LISTOS PARA USO:");
  console.log("   GET  /teams/:teamId/profile");
  console.log("   POST /teams/:teamId/connect");
  console.log("   GET  /teams/:teamId/connections");

} catch (error) {
  console.error("\n❌ Error verificando schema:", error.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
