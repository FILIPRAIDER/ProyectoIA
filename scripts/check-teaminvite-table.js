// scripts/check-teaminvite-table.js
// Verifica si la tabla TeamInvite existe en producción

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkTable() {
  console.log("\n🔍 Verificando tabla TeamInvite...\n");
  
  try {
    // Intenta hacer una query simple
    const count = await prisma.teamInvite.count();
    console.log(`✅ Tabla TeamInvite existe`);
    console.log(`   Total de invitaciones: ${count}\n`);
    
    // Intenta crear una estructura como la del código
    console.log("🔍 Verificando estructura del where clause...\n");
    const testQuery = await prisma.teamInvite.findFirst({
      where: {
        teamId: "test",
        email: "test@test.com",
        status: "PENDING",
      },
    });
    console.log("✅ El where clause funciona correctamente\n");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\n💡 Posibles causas:");
    console.error("   1. La tabla TeamInvite no existe en producción");
    console.error("   2. El campo 'status' no existe o tiene otro nombre");
    console.error("   3. Las migraciones no se aplicaron en producción");
    console.error("   4. El schema de producción es diferente al local\n");
    
    console.log("\n🔧 Solución:");
    console.log("   Ejecutar: npx prisma migrate deploy");
    console.log("   Esto aplicará las migraciones en producción\n");
  } finally {
    await prisma.$disconnect();
  }
}

checkTable();
