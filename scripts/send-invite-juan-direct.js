/**
 * Script directo para enviar invitación usando el mailer
 */

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { sendTeamInviteEmail } from "../src/lib/mailer.js";

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
      console.log(`   Token: ${existingInvite.token}`);
      console.log(`   Creada: ${existingInvite.createdAt.toLocaleString()}`);
      
      // Ofrecer reenviar
      console.log("\n🔄 Reenviando email con la invitación existente...");
      
      const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";
      const acceptUrl = `${APP_BASE_URL}/join?token=${existingInvite.token}`;
      
      try {
        const emailResult = await sendTeamInviteEmail({
          to: invitedEmail,
          teamName: team.name,
          inviterName: leader.user.name,
          acceptUrl: acceptUrl,
          message: existingInvite.message || undefined,
        });

        console.log(`\n✅ Email reenviado exitosamente!`);
        console.log(`   Email ID: ${emailResult.id}`);
        console.log(`   Provider: ${emailResult.provider}`);
        
        console.log(`\n🔗 URL de aceptación:`);
        console.log(`   ${acceptUrl}`);
        
        console.log(`\n📧 Email enviado a:`);
        const RESEND_DEV_FORCE_TO = process.env.RESEND_DEV_FORCE_TO;
        if (RESEND_DEV_FORCE_TO) {
          console.log(`   ${RESEND_DEV_FORCE_TO} (redirigido)`);
          console.log(`   Original: ${invitedEmail}`);
        } else {
          console.log(`   ${invitedEmail}`);
        }
        
        return;
      } catch (emailError) {
        console.error("\n❌ Error al reenviar email:", emailError.message);
        return;
      }
    }

    // 6. Crear invitación nueva
    console.log("📝 Creando nueva invitación...\n");

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

    // 7. Enviar email
    console.log("📧 Enviando email...\n");

    const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";
    const acceptUrl = `${APP_BASE_URL}/join?token=${token}`;

    try {
      const emailResult = await sendTeamInviteEmail({
        to: invitedEmail,
        teamName: team.name,
        inviterName: leader.user.name,
        acceptUrl: acceptUrl,
        message: invitation.message || undefined,
      });

      console.log("=".repeat(60));
      console.log("✅ ¡INVITACIÓN ENVIADA EXITOSAMENTE!");
      console.log("=".repeat(60));

      console.log(`\n📋 Resumen:`);
      console.log(`   • Equipo: ${team.name}`);
      console.log(`   • Para: ${invitedEmail}`);
      console.log(`   • Rol: ${invitation.role}`);
      console.log(`   • Token: ${invitation.token}`);
      console.log(`   • Email ID: ${emailResult.id}`);
      console.log(`   • Provider: ${emailResult.provider}`);

      console.log(`\n🔗 URL de aceptación:`);
      console.log(`   ${acceptUrl}`);

      console.log(`\n📧 Email enviado a:`);
      const RESEND_DEV_FORCE_TO = process.env.RESEND_DEV_FORCE_TO;
      if (RESEND_DEV_FORCE_TO) {
        console.log(`   ${RESEND_DEV_FORCE_TO} (redirigido por RESEND_DEV_FORCE_TO)`);
        console.log(`   Original: ${invitedEmail}`);
      } else {
        console.log(`   ${invitedEmail}`);
      }

      console.log(`\n🧪 PARA PROBAR:`);
      console.log(`   1. Revisa el correo en tu inbox`);
      console.log(`   2. Haz clic en "Aceptar invitación"`);
      console.log(`   3. Deberías ver la página /join?token=...`);
      console.log(`   4. O prueba el endpoint: GET /teams/invites/${token}/info`);

      console.log("\n" + "=".repeat(60));
      console.log("✅ PROCESO COMPLETADO");
      console.log("=".repeat(60));

    } catch (emailError) {
      console.error("\n❌ ERROR AL ENVIAR EMAIL:", emailError.message);
      console.error(emailError);
      
      console.log("\n⚠️  La invitación se creó en la BD pero no se pudo enviar el email");
      console.log("   Puedes intentar reenviar manualmente o usar el token directamente");
    }

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
