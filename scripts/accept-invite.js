// scripts/accept-invite.js
// Script para aceptar la invitación y unirse al equipo TransDigitalCoop

import "../src/env.js";
import { prisma } from "../src/lib/prisma.js";

// Token de la invitación (se genera al crear la invitación)
const TOKEN = process.argv[2] || "b5fabc1fd3dba6422b0a1a2f4ba150fd66a81d888e695234adaf3ee575e6fa63";

async function acceptInvite() {
  try {
    console.log("🎯 Aceptando invitación...");
    console.log("=".repeat(60));
    console.log("Token:", TOKEN);
    console.log("=".repeat(60));

    // Buscar la invitación
    const invite = await prisma.teamInvite.findUnique({
      where: { token: TOKEN },
      include: {
        team: true
      }
    });

    if (!invite) {
      console.log("❌ Invitación no encontrada");
      return;
    }

    console.log("\n✅ Invitación encontrada:");
    console.log("   Email:", invite.email);
    console.log("   Equipo:", invite.team.name);
    console.log("   Estado:", invite.status);
    console.log("   Rol:", invite.role);
    console.log("   Expira:", invite.expiresAt);

    // Verificar estado
    if (invite.status !== "PENDING") {
      console.log(`\n⚠️  La invitación no está en estado PENDING (actual: ${invite.status})`);
      return;
    }

    // Verificar expiración
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      console.log("\n❌ La invitación ha expirado");
      
      // Actualizar estado
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED", decidedAt: new Date() }
      });
      
      return;
    }

    // Buscar o crear usuario
    let user = await prisma.user.findUnique({
      where: { email: invite.email.toLowerCase() }
    });

    if (!user) {
      console.log("\n🆕 Creando nuevo usuario...");
      user = await prisma.user.create({
        data: {
          name: invite.email.split("@")[0],
          email: invite.email.toLowerCase(),
          role: "ESTUDIANTE"
        }
      });
      console.log("   Usuario creado:", user.name);
    } else {
      console.log("\n👤 Usuario existente:", user.name || user.email);
    }

    // Verificar si ya es miembro
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: invite.teamId,
          userId: user.id
        }
      }
    });

    let membership = existingMember;

    if (!existingMember) {
      console.log("\n➕ Añadiendo usuario al equipo...");
      membership = await prisma.teamMember.create({
        data: {
          teamId: invite.teamId,
          userId: user.id,
          role: invite.role
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          team: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      console.log("   ✅ Usuario añadido al equipo");
    } else {
      console.log("\n⚠️  El usuario ya era miembro del equipo");
    }

    // Actualizar estado de la invitación
    console.log("\n📝 Actualizando estado de la invitación...");
    const updatedInvite = await prisma.teamInvite.update({
      where: { id: invite.id },
      data: {
        status: "ACCEPTED",
        decidedAt: new Date()
      }
    });

    console.log("   ✅ Invitación marcada como ACCEPTED");

    console.log("\n" + "=".repeat(60));
    console.log("🎉 ¡ÉXITO! Invitación aceptada");
    console.log("=".repeat(60));

    console.log("\n👤 Usuario:");
    console.log("   ID:", user.id);
    console.log("   Nombre:", user.name || user.email);
    console.log("   Email:", user.email);
    console.log("   Rol general:", user.role);

    console.log("\n👥 Membresía:");
    console.log("   Equipo:", invite.team.name);
    console.log("   Rol en equipo:", membership.role);
    console.log("   Unido:", membership.joinedAt || "Ahora");

    console.log("\n📧 Estado de invitación:");
    console.log("   Estado:", updatedInvite.status);
    console.log("   Decidido:", updatedInvite.decidedAt);

    // Mostrar todos los miembros del equipo
    console.log("\n" + "=".repeat(60));
    console.log("👥 MIEMBROS DEL EQUIPO " + invite.team.name);
    console.log("=".repeat(60));

    const allMembers = await prisma.teamMember.findMany({
      where: { teamId: invite.teamId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    allMembers.forEach((member, index) => {
      console.log(`\n${index + 1}. ${member.user.name || member.user.email}`);
      console.log(`   Email: ${member.user.email}`);
      console.log(`   Rol en equipo: ${member.role}`);
      console.log(`   Rol general: ${member.user.role}`);
    });

    console.log("\n" + "=".repeat(60));

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

acceptInvite();
