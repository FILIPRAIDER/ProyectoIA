/**
 * Verificar estado de TeamSkills en producción
 */

import { PrismaClient } from "@prisma/client";

const PROD_URL = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: PROD_URL,
    },
  },
});

try {
  console.log("🔍 VERIFICANDO PRODUCCIÓN\n");

  // 1. Contar TeamSkills
  const totalTeamSkills = await prisma.teamSkill.count();
  console.log(`Total TeamSkills: ${totalTeamSkills}`);

  // 2. Contar con/sin nivel
  const withLevel = await prisma.teamSkill.count({
    where: {
      level: { not: null },
    },
  });

  const withoutLevel = totalTeamSkills - withLevel;

  console.log(`  Con nivel: ${withLevel}`);
  console.log(`  Sin nivel: ${withoutLevel}\n`);

  // 3. Mostrar algunos ejemplos
  const samples = await prisma.teamSkill.findMany({
    take: 10,
    include: {
      team: { select: { name: true } },
      skill: { select: { name: true } },
    },
  });

  console.log("📋 MUESTRAS:");
  samples.forEach((ts) => {
    console.log(
      `   ${ts.team.name} - ${ts.skill.name}: level=${ts.level ?? "NULL"}, years=${ts.yearsExperience ?? "NULL"}`
    );
  });

  // 4. Estado del matching
  console.log("\n🎯 ESTADO DEL MATCHING:");
  if (withoutLevel === 0) {
    console.log("   ✅ Todos los TeamSkills tienen nivel");
    console.log("   ✅ El matching debería funcionar correctamente");
  } else {
    console.log(`   ⚠️  ${withoutLevel} TeamSkills sin nivel`);
    console.log("   ❌ El matching puede fallar");
  }

} catch (error) {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
