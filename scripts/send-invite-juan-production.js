/**
 * Script para enviar invitación a Juan Garcés en PRODUCCIÓN
 * Usa la base de datos de producción (Neon)
 */

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { sendTeamInviteEmail } from "../src/lib/mailer.js";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Usar la URL de producción de Neon desde .env
const DATABASE_URL = process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function main() {
  try {
    console.log("🌍 ENVIANDO INVITACIÓN EN PRODUCCIÓN\n");
    console.log("=".repeat(60));

    // 1. Buscar el equipo TransDigitalCoop en producción
    const team = await prisma.team.findFirst({
      where: { name: "TransDigitalCoop" },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!team) {
      console.log("❌ Equipo TransDigitalCoop no encontrado en producción");
      console.log("   Los equipos disponibles son:");
      const teams = await prisma.team.findMany({
        select: { id: true, name: true }
      });
      teams.forEach(t => console.log(`   - ${t.name} (${t.id})`));
      return;
    }

    console.log(`✅ Equipo encontrado: ${team.name} (ID: ${team.id})`);

    // 2. Buscar el líder (Felipe Berrio)
    const leader = team.members.find(m => 
      m.role === "LIDER" && 
      m.user.email === "felipe.berrio@campusucc.edu.co"
    );

    if (!leader) {
      console.log("❌ Líder Felipe Berrio no encontrado");
      console.log("   Miembros del equipo:");
      team.members.forEach(m => {
        console.log(`   - ${m.user.name || m.user.email} (${m.role})`);
      });
      return;
    }

    console.log(`👑 Líder: ${leader.user.name} (${leader.user.email})`);

    // 3. Email a invitar
    const emailToInvite = "juan.garcess@campusucc.edu.co";
    console.log(`📧 Invitando a: ${emailToInvite}\n`);

    // 4. Verificar si ya existe una invitación pendiente
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        teamId: team.id,
        email: emailToInvite,
        status: "PENDING"
      }
    });

    if (existingInvite) {
      console.log("⚠️  Ya existe una invitación pendiente para este email");
      console.log(`   Token: ${existingInvite.token}`);
      console.log(`   Expira: ${existingInvite.expiresAt.toLocaleString("es-CO")}`);
      console.log(`\n🔗 URL: https://proyectoia-frontend.vercel.app/join?token=${existingInvite.token}`);
      return;
    }

    // 5. Generar token único
    const token = crypto.randomBytes(32).toString("hex");
    
    // 6. Crear invitación en BD (producción)
    const invite = await prisma.teamInvite.create({
      data: {
        token,
        email: emailToInvite,
        role: "MIEMBRO",
        teamId: team.id,
        invitedBy: leader.user.id,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        message: "Te invitamos a formar parte del equipo TransDigitalCoop"
      }
    });

    console.log(`✅ Invitación creada en BD de producción (ID: ${invite.id})`);
    console.log(`Token: ${token}\n`);

    // 7. Enviar email
    // IMPORTANTE: El APP_BASE_URL debe ser el del frontend en producción
    const APP_BASE_URL = "https://proyectoia-frontend.vercel.app"; // Ajusta esta URL
    
    await sendTeamInviteEmail({
      to: emailToInvite,
      teamName: team.name,
      inviterName: leader.user.name || leader.user.email,
      token,
      appBaseUrl: APP_BASE_URL
    });

    console.log(`🔗 URL: ${APP_BASE_URL}/join?token=${token}`);
    console.log("\n" + "=".repeat(60));
    console.log("✅ INVITACIÓN ENVIADA EXITOSAMENTE EN PRODUCCIÓN");
    console.log("=".repeat(60));

    console.log("\n📧 Email enviado a: filipraider123@gmail.com");
    console.log("   (Redirect de desarrollo desde: juan.garcess@campusucc.edu.co)");
    console.log("\n🌍 El link ahora funcionará en producción");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
