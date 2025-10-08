// scripts/check-team.js
// Script para verificar el equipo TransDigitalCoop y sus miembros

import "../src/env.js";
import { prisma } from "../src/lib/prisma.js";

async function checkTeam() {
  try {
    console.log("🔍 Buscando equipo TransDigitalCoop...\n");
    
    // Buscar el equipo
    const team = await prisma.team.findFirst({
      where: {
        name: {
          contains: "TransDigitalCoop",
          mode: "insensitive"
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      console.log("❌ No se encontró el equipo TransDigitalCoop");
      console.log("\n📋 Equipos disponibles:");
      const allTeams = await prisma.team.findMany({
        select: { id: true, name: true }
      });
      console.log(JSON.stringify(allTeams, null, 2));
      return;
    }

    console.log("✅ Equipo encontrado:");
    console.log("=".repeat(50));
    console.log("ID:", team.id);
    console.log("Nombre:", team.name);
    console.log("Descripción:", team.description || "(sin descripción)");
    console.log("Área:", team.area || "(sin área)");
    console.log("Creado:", team.createdAt);
    console.log("=".repeat(50));

    console.log("\n👥 Miembros del equipo:");
    console.log("=".repeat(50));
    
    if (team.members.length === 0) {
      console.log("⚠️  No hay miembros en el equipo todavía");
    } else {
      team.members.forEach((member, index) => {
        console.log(`\n${index + 1}. ${member.user.name || member.user.email}`);
        console.log(`   ID Usuario: ${member.user.id}`);
        console.log(`   Email: ${member.user.email}`);
        console.log(`   Rol en equipo: ${member.role}`);
        console.log(`   Rol general: ${member.user.role}`);
        console.log(`   Unido: ${member.joinedAt}`);
      });
    }

    console.log("\n" + "=".repeat(50));
    
    // Buscar un líder para hacer la invitación
    const leader = team.members.find(m => m.role === "LIDER");
    
    if (leader) {
      console.log("\n✅ Líder encontrado para hacer invitaciones:");
      console.log(`   Nombre: ${leader.user.name || leader.user.email}`);
      console.log(`   ID: ${leader.user.id}`);
      console.log(`   Email: ${leader.user.email}`);
    } else {
      console.log("\n⚠️  No hay líder en el equipo");
      console.log("   Necesitas un líder (o admin) para crear invitaciones");
    }

    // Verificar invitaciones existentes
    console.log("\n📧 Invitaciones existentes:");
    console.log("=".repeat(50));
    const invites = await prisma.teamInvite.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: "desc" }
    });

    if (invites.length === 0) {
      console.log("No hay invitaciones todavía");
    } else {
      invites.forEach((inv, index) => {
        console.log(`\n${index + 1}. ${inv.email}`);
        console.log(`   Estado: ${inv.status}`);
        console.log(`   Rol: ${inv.role}`);
        console.log(`   Creada: ${inv.createdAt}`);
        console.log(`   Expira: ${inv.expiresAt}`);
      });
    }

    console.log("\n" + "=".repeat(50));
    console.log("\n💡 Para crear una invitación, usa:");
    console.log(`\nPOST http://localhost:4001/teams/${team.id}/invites`);
    console.log(`{
  "email": "freshcaps98@gmail.com",
  "role": "MIEMBRO",
  "byUserId": "${leader?.user.id || 'ID_DE_UN_LIDER'}"
}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeam();
