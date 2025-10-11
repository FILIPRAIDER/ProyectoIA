/**
 * Verificar y diagnosticar niveles de TeamSkill
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  console.log("🔍 DIAGNÓSTICO: TeamSkill Levels\n");

  // Verificar TeamSkills de DevTeams
  const teamSkills = await prisma.teamSkill.findMany({
    where: {
      team: {
        name: {
          startsWith: "DevTeam",
        },
      },
    },
    include: {
      team: {
        select: { name: true },
      },
      skill: {
        select: { name: true },
      },
    },
    take: 50,
  });

  console.log(`Total TeamSkills encontrados: ${teamSkills.length}\n`);

  // Agrupar por equipo
  const byTeam = {};
  let nullCount = 0;

  teamSkills.forEach((ts) => {
    const teamName = ts.team.name;
    if (!byTeam[teamName]) {
      byTeam[teamName] = { total: 0, withLevel: 0, nullLevel: 0, skills: [] };
    }
    byTeam[teamName].total++;
    if (ts.level === null) {
      byTeam[teamName].nullLevel++;
      nullCount++;
    } else {
      byTeam[teamName].withLevel++;
    }
    byTeam[teamName].skills.push({
      skill: ts.skill.name,
      level: ts.level,
    });
  });

  // Mostrar resultados
  console.log("📊 RESULTADOS POR EQUIPO:\n");
  Object.entries(byTeam).forEach(([teamName, data]) => {
    console.log(`${teamName}:`);
    console.log(`  Total skills: ${data.total}`);
    console.log(`  Con nivel: ${data.withLevel}`);
    console.log(`  Sin nivel (NULL): ${data.nullLevel}`);
    console.log(`  Skills: ${data.skills.map((s) => `${s.skill}(${s.level ?? "NULL"})`).join(", ")}`);
    console.log();
  });

  console.log(`\n⚠️  TOTAL SKILLS CON LEVEL = NULL: ${nullCount}/${teamSkills.length}`);

  if (nullCount > 0) {
    console.log("\n❌ PROBLEMA CONFIRMADO: Hay TeamSkills sin nivel asignado");
    console.log("   Esto causa que el matching retorne 0 equipos");
    console.log("\n💡 SOLUCIÓN: Ejecutar script fix-teamskill-levels.js");
  } else {
    console.log("\n✅ Todos los TeamSkills tienen nivel asignado");
  }
} catch (error) {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
