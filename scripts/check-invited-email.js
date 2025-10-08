// scripts/check-invited-email.js
// Verifica el estado del email que intentas invitar

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkEmail() {
  try {
    const email = "juan.garcess@campusucc.edu.co";
    const teamId = "cmghgdtiv0002gu6zbruvqg4t";
    
    console.log(`\n🔍 Verificando email: ${email}\n`);
    
    // 1. ¿El email existe como usuario?
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { 
        id: true, 
        name: true, 
        email: true,
        role: true,
        createdAt: true 
      }
    });
    
    if (!user) {
      console.log("✅ El email NO existe en la tabla User");
      console.log("   → Puede ser invitado sin problemas\n");
    } else {
      console.log("⚠️  El email SÍ existe en la tabla User:");
      console.log(`   ID: ${user.id}`);
      console.log(`   Nombre: ${user.name}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Registrado: ${user.createdAt}\n`);
      
      // 2. ¿Es miembro del equipo?
      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: user.id
          }
        },
        select: {
          role: true,
          joinedAt: true
        }
      });
      
      if (membership) {
        console.log("❌ El usuario YA ES MIEMBRO del equipo TransDigitalCoop");
        console.log(`   Rol en equipo: ${membership.role}`);
        console.log(`   Se unió: ${membership.joinedAt}`);
        console.log("\n💡 Por eso falla la invitación con 409\n");
      } else {
        console.log("✅ El usuario existe pero NO es miembro del equipo");
        console.log("   → Puede ser invitado\n");
      }
    }
    
    // 3. ¿Ya tiene invitaciones pendientes?
    const pendingInvites = await prisma.teamInvite.findMany({
      where: {
        email: email.toLowerCase(),
        status: "PENDING"
      },
      select: {
        id: true,
        teamId: true,
        status: true,
        createdAt: true,
        expiresAt: true
      }
    });
    
    if (pendingInvites.length > 0) {
      console.log("⚠️  Tiene invitaciones PENDING:");
      pendingInvites.forEach(inv => {
        console.log(`   - Team: ${inv.teamId}`);
        console.log(`     Creada: ${inv.createdAt}`);
        console.log(`     Expira: ${inv.expiresAt}\n`);
      });
    } else {
      console.log("✅ No tiene invitaciones pendientes\n");
    }
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmail();
