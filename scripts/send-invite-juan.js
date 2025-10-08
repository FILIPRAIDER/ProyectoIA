/**
 * Script para enviar invitación real a juan.garcess@campusucc.edu.co
 * Equipo: TransDigitalCoop
 */

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 ENVIANDO INVITACIÓN A JUAN GARCÉS\n");
  console.log("=".repeat(60));

  try {
    // 1. Buscar el equipo TransDigitalCoop
    const team = await prisma.team.findFirst({
      where: {
        name: {
          contains: "TransDigitalCoop",
          mode: "insensitive",
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          where: { role: "LIDER" },
        },
      },
    });

    if (!team) {
      console.log("❌ No se encontró el equipo TransDigitalCoop");
      return;
    }

    console.log(`✅ Equipo encontrado: ${team.name}`);
    console.log(`   ID: ${team.id}\n`);

    // 2. Obtener el líder del equipo
    const leader = team.members[0];
    if (!leader) {
      console.log("❌ El equipo no tiene líder");
      return;
    }

    console.log(`👑 Líder del equipo: ${leader.user.name}`);
    console.log(`   Email: ${leader.user.email}`);
    console.log(`   ID: ${leader.userId}\n`);

    // 3. Email a invitar
    const invitedEmail = "juan.garcess@campusucc.edu.co";
    console.log(`📧 Invitando a: ${invitedEmail}\n`);

    // 4. Verificar si ya es miembro
    const existingMember = await prisma.user.findUnique({
      where: { email: invitedEmail },
      include: {
        teamMemberships: {
          where: { teamId: team.id },
        },
      },
    });

    if (existingMember?.teamMemberships.length > 0) {
      console.log("⚠️  Este usuario ya es miembro del equipo");
      console.log("   Cancelando...");
      return;
    }

    // 5. Verificar invitaciones pendientes
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        teamId: team.id,
        email: invitedEmail,
        status: "PENDING",
      },
    });

    if (existingInvite) {
      console.log("⚠️  Ya existe una invitación PENDING para este email");
      console.log(`   Token existente: ${existingInvite.token}`);
      console.log("   ¿Deseas usar la invitación existente? (Ctrl+C para cancelar)");
      return;
    }

    // 6. Crear invitación
    console.log("📝 Creando invitación...");

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    const invitation = await prisma.teamInvite.create({
      data: {
        teamId: team.id,
        email: invitedEmail,
        role: "MIEMBRO",
        token: token,
        status: "PENDING",
        invitedBy: leader.userId,
        message: "¡Bienvenido al equipo! Estamos emocionados de trabajar contigo.",
        expiresAt: expiresAt,
      },
    });

    console.log("✅ Invitación creada en la base de datos");
    console.log(`   ID: ${invitation.id}`);
    console.log(`   Token: ${invitation.token}`);
    console.log(`   Expira: ${invitation.expiresAt.toLocaleString()}\n`);

    // 7. Hacer request al endpoint de invitaciones (esto enviará el email)
    console.log("📧 Enviando email a través del backend...\n");

    const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4001";
    const endpoint = `${API_BASE_URL}/teams/${team.id}/invites`;

    console.log(`Endpoint: POST ${endpoint}`);
    console.log(`Body:`);
    console.log(
      JSON.stringify(
        {
          email: invitedEmail,
          role: "MIEMBRO",
          byUserId: leader.userId,
          message: "¡Bienvenido al equipo! Estamos emocionados de trabajar contigo.",
          expiresInDays: 7,
          target: "frontend",
        },
        null,
        2
      )
    );

    // Borrar la invitación que creamos manualmente para que el endpoint la cree
    await prisma.teamInvite.delete({
      where: { id: invitation.id },
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: invitedEmail,
        role: "MIEMBRO",
        byUserId: leader.userId,
        message: "¡Bienvenido al equipo! Estamos emocionados de trabajar contigo.",
        expiresInDays: 7,
        target: "frontend",
      }),
    });

    const data = await response.json();

    console.log("\n" + "=".repeat(60));
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log("=".repeat(60));
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("\n✅ ¡INVITACIÓN ENVIADA EXITOSAMENTE!\n");

      console.log("📋 Resumen:");
      console.log(`   • Equipo: ${team.name}`);
      console.log(`   • Para: ${invitedEmail}`);
      console.log(`   • Rol: MIEMBRO`);
      console.log(`   • Token: ${data.token}`);
      console.log(`   • Email enviado: ${data.emailSent ? "Sí ✅" : "No ❌"}`);

      if (data.acceptUrlExample) {
        console.log(`\n🔗 URL de aceptación:`);
        console.log(`   ${data.acceptUrlExample}`);
      }

      console.log("\n📧 El email ha sido enviado a:");
      const RESEND_DEV_FORCE_TO = process.env.RESEND_DEV_FORCE_TO;
      if (RESEND_DEV_FORCE_TO) {
        console.log(`   ${RESEND_DEV_FORCE_TO} (redirigido por RESEND_DEV_FORCE_TO)`);
        console.log(`   Original: ${invitedEmail}`);
      } else {
        console.log(`   ${invitedEmail}`);
      }

      console.log("\n🧪 PARA PROBAR:");
      console.log(`   1. Revisa el correo en tu inbox`);
      console.log(`   2. Haz clic en "Aceptar invitación"`);
      console.log(`   3. O usa el endpoint GET /teams/invites/${data.token}/info`);
      console.log(`   4. O usa el endpoint POST /teams/invites/${data.token}/accept`);

      console.log("\n" + "=".repeat(60));
      console.log("✅ PROCESO COMPLETADO");
      console.log("=".repeat(60));
    } else {
      console.log("\n❌ ERROR AL ENVIAR INVITACIÓN");
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error || "Desconocido"}`);
    }
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
