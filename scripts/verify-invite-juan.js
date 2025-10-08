/**
 * Script de prueba simplificado - acceso directo a DB
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const token = "8d7f9241e41f47651028c3ff072b5dc1a4fe20d1757968b8121177a8c4da303a";

  console.log("🔍 VERIFICANDO INVITACIÓN EN BASE DE DATOS\n");
  console.log("=".repeat(60));

  try {
    const invite = await prisma.teamInvite.findUnique({
      where: { token },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            members: true
          }
        }
      }
    });

    if (!invite) {
      console.log("❌ Invitación no encontrada con ese token");
      return;
    }

    console.log("✅ INVITACIÓN ENCONTRADA\n");
    console.log(`📧 Email: ${invite.email}`);
    console.log(`📋 Estado: ${invite.status}`);
    console.log(`👤 Rol: ${invite.role}`);
    console.log(`⏰ Creada: ${invite.createdAt.toLocaleString("es-CO")}`);
    console.log(`📅 Expira: ${invite.expiresAt.toLocaleString("es-CO")}`);
    console.log();

    // Verificar expiración
    const isExpired = invite.expiresAt && invite.expiresAt.getTime() < Date.now();
    console.log(`⏳ Expirada: ${isExpired ? "Sí ❌" : "No ✅"}`);
    console.log(`✅ Puede aceptar: ${invite.status === "PENDING" && !isExpired ? "Sí ✅" : "No ❌"}`);
    console.log();

    console.log("🏢 EQUIPO:");
    console.log(`   Nombre: ${invite.team.name}`);
    console.log(`   Descripción: ${invite.team.description || "(Sin descripción)"}`);
    console.log(`   Miembros: ${invite.team.members.length}`);
    console.log();

    // Obtener invitador
    const inviter = await prisma.user.findUnique({
      where: { id: invite.invitedBy },
      select: { id: true, name: true, email: true }
    });

    if (inviter) {
      console.log("👤 INVITADO POR:");
      console.log(`   Nombre: ${inviter.name}`);
      console.log(`   Email: ${inviter.email}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ DATOS VERIFICADOS - INVITACIÓN LISTA PARA USAR");
    console.log("=".repeat(60));

    console.log("\n📧 Revisa tu email: filipraider123@gmail.com");
    console.log("\n🔗 O abre directamente:");
    console.log(`   http://localhost:3000/join?token=${token}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
