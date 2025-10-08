// scripts/send-invite-now.js
// Envía invitación directamente saltando la validación problemática

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import "dotenv/config";

const prisma = new PrismaClient();

async function sendInvite() {
  try {
    const teamId = "cmghgdtiv0002gu6zbruvqg4t";
    const email = "juanguillermogarcessantero@gmail.com";
    const byUserId = "cmghgdt9q0001gu6ze0fyd7hs";
    const role = "MIEMBRO";
    
    console.log("\n🚀 Enviando invitación...\n");
    console.log("  Email:", email);
    console.log("  Equipo: TransDigitalCoop");
    console.log("  Rol:", role);
    console.log("  Invitador:", byUserId);
    
    // Generar token
    const token = crypto.randomBytes(32).toString("hex");
    
    // FECHA VÁLIDA - 7 días desde ahora
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    console.log("\n📅 Fecha de expiración:", expiresAt);
    console.log("  Válida:", !isNaN(expiresAt.getTime()) ? "✅ SÍ" : "❌ NO");
    
    // Verificar que no exista invitación pendiente
    const existing = await prisma.teamInvite.findFirst({
      where: {
        teamId,
        email: email.toLowerCase(),
        status: "PENDING"
      }
    });
    
    if (existing) {
      console.log("\n⚠️  Ya existe una invitación PENDING");
      console.log("  ID:", existing.id);
      console.log("  Creada:", existing.createdAt);
      console.log("\n¿Quieres cancelarla y crear una nueva? (Ctrl+C para cancelar)");
      
      // Cancelar la existente
      await prisma.teamInvite.update({
        where: { id: existing.id },
        data: { status: "CANCELED", decidedAt: new Date() }
      });
      
      console.log("✅ Invitación anterior cancelada");
    }
    
    // Crear invitación
    const invite = await prisma.teamInvite.create({
      data: {
        teamId,
        email: email.toLowerCase(),
        role,
        token,
        status: "PENDING",
        invitedBy: byUserId,
        message: null,
        expiresAt,
      },
    });
    
    console.log("\n✅ Invitación creada exitosamente:");
    console.log("  ID:", invite.id);
    console.log("  Token:", token);
    console.log("  Expira:", invite.expiresAt);
    
    // URL de aceptación
    const acceptUrl = `https://cresia-app.vercel.app/join?token=${token}`;
    console.log("\n🔗 URL de invitación:");
    console.log("  ", acceptUrl);
    
    console.log("\n📧 Ahora necesitas enviar el email manualmente:");
    console.log("  Para:", email);
    console.log("  Asunto: Invitación a TransDigitalCoop");
    console.log("  Cuerpo: Felipe Berrio te invitó a unirte al equipo TransDigitalCoop");
    console.log("  Link:", acceptUrl);
    
    console.log("\n✅ Script completado\n");
    
  } catch (error) {
    console.error("\n❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

sendInvite();
