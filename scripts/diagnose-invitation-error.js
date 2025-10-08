// scripts/diagnose-invitation-error.js
import { prisma } from "../src/lib/prisma.js";

async function diagnoseInvitationError() {
  console.log("\n🔍 Diagnosticando problema de invitaciones...\n");

  try {
    const teamId = "cmghgdtiv0002gu6zbruvqg4t";
    const userId = "cmghgdt9q0001gu6ze0fyd7hs"; // Tu usuario

    // 1. Verificar que el equipo existe
    console.log("1️⃣ Verificando equipo...");
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        }
      }
    });

    if (!team) {
      console.log("❌ El equipo no existe");
      return;
    }

    console.log(`✅ Equipo encontrado: ${team.name}`);
    console.log(`   Miembros: ${team.members.length}`);
    team.members.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.user.name} (${m.role}) - ID: ${m.userId}`);
    });

    // 2. Verificar que el usuario existe
    console.log("\n2️⃣ Verificando usuario...");
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      console.log("❌ El usuario no existe");
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.name} (${user.email})`);
    console.log(`   Rol en sistema: ${user.role}`);

    // 3. Verificar que el usuario es miembro del equipo
    console.log("\n3️⃣ Verificando membresía del usuario...");
    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: teamId,
          userId: userId
        }
      }
    });

    if (!membership) {
      console.log("❌ El usuario NO es miembro del equipo");
      console.log("   El usuario debe ser miembro del equipo para enviar invitaciones");
      return;
    }

    console.log(`✅ Usuario es miembro del equipo`);
    console.log(`   Rol en equipo: ${membership.role}`);
    console.log(`   Se unió: ${membership.joinedAt}`);

    // 4. Verificar que el usuario es LIDER
    console.log("\n4️⃣ Verificando permisos...");
    if (membership.role !== "LIDER") {
      console.log(`❌ El usuario NO es LIDER (es ${membership.role})`);
      console.log("   Solo los líderes pueden enviar invitaciones");
      return;
    }

    console.log("✅ El usuario es LIDER y puede enviar invitaciones");

    // 5. Verificar invitaciones existentes
    console.log("\n5️⃣ Verificando invitaciones del equipo...");
    const invites = await prisma.teamInvite.findMany({
      where: { teamId: teamId },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    console.log(`✅ Invitaciones en el equipo: ${invites.length}`);
    invites.forEach((inv, i) => {
      console.log(`   ${i + 1}. ${inv.email} - ${inv.status} - ${inv.createdAt.toLocaleDateString()}`);
    });

    // 6. Probar una invitación simulada
    console.log("\n6️⃣ Simulando creación de invitación...");
    const testEmail = "test@example.com";
    
    // Verificar si ya existe
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        teamId: teamId,
        email: testEmail,
        status: "PENDING"
      }
    });

    if (existingInvite) {
      console.log("⚠️ Ya existe una invitación PENDING para test@example.com");
      console.log("   Eliminándola para la prueba...");
      await prisma.teamInvite.delete({
        where: { id: existingInvite.id }
      });
    }

    // Verificar si el email ya es miembro
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    if (existingUser) {
      const isMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: teamId,
            userId: existingUser.id
          }
        }
      });

      if (isMember) {
        console.log("⚠️ test@example.com ya es miembro del equipo");
        console.log("   Esto causaría un error 409");
      }
    }

    console.log("\n✅ Todas las validaciones pasaron");
    console.log("\n📋 Resumen:");
    console.log(`   ✅ Equipo existe: ${team.name}`);
    console.log(`   ✅ Usuario existe: ${user.name}`);
    console.log(`   ✅ Usuario es miembro del equipo`);
    console.log(`   ✅ Usuario es LIDER`);
    console.log(`   ✅ No hay conflictos de invitaciones`);

    console.log("\n💡 El problema puede ser:");
    console.log("   1. El byUserId en el payload no coincide con este usuario");
    console.log("   2. Hay un problema de conexión a la base de datos");
    console.log("   3. El email que intentas invitar ya es miembro");
    console.log("   4. Ya existe una invitación PENDING para ese email");

    // 7. Mostrar el payload correcto
    console.log("\n📤 Payload correcto para enviar invitación:");
    console.log(JSON.stringify({
      email: "nuevo@example.com",
      role: "MIEMBRO",
      byUserId: userId,
      message: "Te invito a unirte a nuestro equipo" // opcional
    }, null, 2));

  } catch (error) {
    console.error("\n❌ Error en el diagnóstico:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar diagnóstico
diagnoseInvitationError()
  .then(() => {
    console.log("\n✅ Diagnóstico completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Diagnóstico falló:", error.message);
    process.exit(1);
  });
