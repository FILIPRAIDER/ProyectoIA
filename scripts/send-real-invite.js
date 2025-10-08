// scripts/send-real-invite.js
// Script para enviar invitación real al equipo TransDigitalCoop

import "../src/env.js";
import { prisma } from "../src/lib/prisma.js";
import { sendTeamInviteEmail } from "../src/lib/mailer.js";
import crypto from "crypto";

const TEAM_ID = "cmgh3bwqi00011skus6ty5ig3";
const INVITER_ID = "cmgh3bwi400001sku3661vgev";
const INVITER_NAME = "Felipe Berrio Carvajal";
const TEAM_NAME = "TransDigitalCoop";

// Email destino (será redirigido a tu email por RESEND_DEV_FORCE_TO)
const INVITE_EMAIL = "freshcaps98@gmail.com";

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function sendInvite() {
  try {
    console.log("📧 Creando invitación real al equipo TransDigitalCoop");
    console.log("=".repeat(60));
    console.log("Equipo:", TEAM_NAME);
    console.log("Team ID:", TEAM_ID);
    console.log("Invitador:", INVITER_NAME);
    console.log("Email destino:", INVITE_EMAIL);
    console.log("=".repeat(60));

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: INVITE_EMAIL.toLowerCase() }
    });

    if (existingUser) {
      console.log("\n⚠️  El usuario ya existe:", existingUser.name || existingUser.email);
      
      // Verificar si ya es miembro
      const existingMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: TEAM_ID,
            userId: existingUser.id
          }
        }
      });

      if (existingMember) {
        console.log("❌ El usuario ya es miembro del equipo");
        console.log("   No se puede crear la invitación");
        return;
      }
    }

    // Verificar invitaciones pendientes
    const pendingInvite = await prisma.teamInvite.findFirst({
      where: {
        teamId: TEAM_ID,
        email: INVITE_EMAIL.toLowerCase(),
        status: "PENDING"
      }
    });

    if (pendingInvite) {
      console.log("\n⚠️  Ya existe una invitación PENDING para este email");
      console.log("   Token:", pendingInvite.token);
      console.log("   Creada:", pendingInvite.createdAt);
      console.log("   Expira:", pendingInvite.expiresAt);
      
      const useExisting = true; // Cambiar a false si quieres crear una nueva
      
      if (useExisting) {
        console.log("\n🔄 Usando invitación existente...");
        const acceptUrl = `http://localhost:3000/join?token=${pendingInvite.token}`;
        
        console.log("\n📧 Reenviando email...");
        const emailResult = await sendTeamInviteEmail({
          to: INVITE_EMAIL,
          teamName: TEAM_NAME,
          inviterName: INVITER_NAME,
          acceptUrl,
          message: "¡Te invito a unirte a nuestro equipo de desarrolladores!"
        });

        console.log("\n✅ Email enviado exitosamente!");
        console.log("   Email ID:", emailResult.id);
        console.log("   Provider:", emailResult.provider);
        console.log("\n🔗 URL de aceptación:");
        console.log("   ", acceptUrl);
        return;
      }
    }

    // Crear nueva invitación
    console.log("\n🔨 Creando nueva invitación...");
    
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
    const acceptUrl = `http://localhost:3000/join?token=${token}`;

    const invite = await prisma.teamInvite.create({
      data: {
        teamId: TEAM_ID,
        email: INVITE_EMAIL.toLowerCase(),
        role: "MIEMBRO",
        token,
        status: "PENDING",
        invitedBy: INVITER_ID,
        message: "¡Te invito a unirte a nuestro equipo de desarrolladores!",
        expiresAt
      }
    });

    console.log("✅ Invitación creada en la base de datos");
    console.log("   ID:", invite.id);
    console.log("   Token:", invite.token);
    console.log("   Expira:", invite.expiresAt);

    // Enviar email
    console.log("\n📧 Enviando email de invitación...");
    
    const emailResult = await sendTeamInviteEmail({
      to: INVITE_EMAIL,
      teamName: TEAM_NAME,
      inviterName: INVITER_NAME,
      acceptUrl,
      message: invite.message
    });

    console.log("\n✅ Email enviado exitosamente!");
    console.log("   Email ID:", emailResult.id);
    console.log("   Provider:", emailResult.provider);
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 ¡Invitación creada y enviada!");
    console.log("=".repeat(60));
    
    console.log("\n📧 Email enviado a:", process.env.RESEND_DEV_FORCE_TO || INVITE_EMAIL);
    console.log("   (Configurado en RESEND_DEV_FORCE_TO)");
    
    console.log("\n🔗 URL de aceptación:");
    console.log("   ", acceptUrl);
    
    console.log("\n📝 Para aceptar la invitación:");
    console.log("   1. Hacer clic en el botón del email");
    console.log("   2. O usar el endpoint directamente:");
    console.log(`   POST http://localhost:4001/teams/invites/${token}/accept`);
    console.log(`   { "name": "Nombre Completo" }`);
    
    console.log("\n💡 Para verificar el estado:");
    console.log(`   GET http://localhost:4001/teams/${TEAM_ID}/invites`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

sendInvite();
