/**
 * 🔍 Verificar Skills de Equipos
 * 
 * Propósito: Revisar qué equipos tienen skills asignadas
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkTeamsSkills() {
  console.log("🔍 VERIFICANDO SKILLS DE EQUIPOS\n");

  try {
    // Obtener todos los equipos con sus skills
    const teams = await prisma.team.findMany({
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
        members: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    if (teams.length === 0) {
      console.log("❌ No hay equipos en la base de datos");
      return;
    }

    console.log(`📊 Total de equipos: ${teams.length}\n`);
    console.log("=".repeat(80) + "\n");

    // Análisis por equipo
    const teamsWithSkills = [];
    const teamsWithoutSkills = [];

    for (const team of teams) {
      const hasSkills = team.skills.length > 0;

      if (hasSkills) {
        teamsWithSkills.push(team);
      } else {
        teamsWithoutSkills.push(team);
      }

      const status = hasSkills ? "✅" : "❌";
      console.log(`${status} ${team.name}`);
      console.log(`   ID: ${team.id}`);
      console.log(`   Ciudad: ${team.city || "N/A"}`);
      console.log(`   Área: ${team.area || "N/A"}`);
      console.log(`   Miembros: ${team.members.length}`);
      console.log(`   Skills: ${team.skills.length}`);

      if (hasSkills) {
        console.log("   Lista de skills:");
        team.skills.forEach((ts) => {
          console.log(`      - ${ts.skill.name}`);
        });
      } else {
        console.log("   ⚠️ SIN SKILLS ASIGNADAS");
      }

      console.log();
    }

    // Resumen
    console.log("=".repeat(80));
    console.log("\n📊 RESUMEN:");
    console.log(`   ✅ Equipos con skills: ${teamsWithSkills.length}`);
    console.log(`   ❌ Equipos sin skills: ${teamsWithoutSkills.length}`);

    if (teamsWithoutSkills.length > 0) {
      console.log("\n⚠️ EQUIPOS QUE NECESITAN SKILLS:");
      teamsWithoutSkills.forEach((t) => {
        console.log(`   - ${t.name} (${t.id})`);
      });
    }

    // Verificar los 3 equipos principales de prueba
    console.log("\n🎯 EQUIPOS DE PRUEBA PRINCIPALES:");
    const testTeams = [
      "DevTeam Frontend",
      "DevTeam Backend",
      "DevTeam FullStack",
    ];

    for (const teamName of testTeams) {
      const team = teams.find((t) => t.name === teamName);
      if (team) {
        const status = team.skills.length > 0 ? "✅" : "❌";
        console.log(
          `   ${status} ${teamName}: ${team.skills.length} skills`
        );
      } else {
        console.log(`   ⚠️ ${teamName}: NO EXISTE`);
      }
    }

    // Estadísticas de skills
    console.log("\n📊 ESTADÍSTICAS DE SKILLS:");
    const allSkills = teams.flatMap((t) => t.skills);
    const uniqueSkills = new Set(allSkills.map((ts) => ts.skill.name));
    console.log(`   Total de relaciones TeamSkill: ${allSkills.length}`);
    console.log(`   Skills únicas usadas: ${uniqueSkills.size}`);

    // Top 10 skills más usadas
    const skillCounts = {};
    allSkills.forEach((ts) => {
      skillCounts[ts.skill.name] = (skillCounts[ts.skill.name] || 0) + 1;
    });

    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (topSkills.length > 0) {
      console.log("\n   Top 10 skills más usadas:");
      topSkills.forEach(([skill, count]) => {
        console.log(`      ${count}x ${skill}`);
      });
    }

    console.log("\n" + "=".repeat(80));

    if (teamsWithoutSkills.length > 0) {
      console.log("\n⚠️ ACCIÓN REQUERIDA:");
      console.log(
        "   Algunos equipos no tienen skills. Para agregarlas, ejecuta:"
      );
      console.log("   node scripts/add-skills-to-test-teams.js");
    } else {
      console.log("\n✅ TODOS LOS EQUIPOS TIENEN SKILLS");
      console.log("   El sistema de matching debería funcionar correctamente.");
    }
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeamsSkills();
