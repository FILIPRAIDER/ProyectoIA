// scripts/check-production-user.js
// Verifica si el usuario existe en producción

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const userId = "cmghgdt9q0001gu6ze0fyd7hs"; // El que usa el diagnóstico local
    
    console.log(`\n🔍 Buscando usuario: ${userId}\n`);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teamMemberships: {
          include: {
            team: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });
    
    if (!user) {
      console.log("❌ Usuario NO existe en la base de datos");
      console.log("\n💡 Esto explicaría el error:");
      console.log("   - El frontend envía byUserId que no existe");
      console.log("   - assertLeaderOrAdmin() falla en prisma.user.findUnique()");
      console.log("   - Se lanza HttpError 404");
      console.log("   - Error handler lo convierte en 400\n");
    } else {
      console.log("✅ Usuario encontrado:");
      console.log(`   Nombre: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`\n📋 Equipos del usuario:`);
      
      if (user.teamMemberships.length === 0) {
        console.log("   ⚠️  No pertenece a ningún equipo");
      } else {
        user.teamMemberships.forEach(membership => {
          console.log(`   - ${membership.team.name} (${membership.role})`);
        });
      }
    }
    
  } catch (error) {
    console.error("\n❌ Error al consultar:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
