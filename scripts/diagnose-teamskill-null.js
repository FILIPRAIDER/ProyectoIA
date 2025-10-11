/**
 * Verificar valores REALES de level en TeamSkill
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  console.log("🔍 VERIFICACIÓN DETALLADA: TeamSkill.level\n");

  const teamSkills = await prisma.teamSkill.findMany({
    where: {
      team: {
        name: {
          startsWith: "DevTeam",
        },
      },
    },
    include: {
      team: { select: { id: true, name: true } },
      skill: { select: { name: true } },
    },
  });

  console.log(`Total TeamSkills: ${teamSkills.length}\n`);

  // Análisis detallado
  let nullCount = 0;
  let withLevelCount = 0;
  const samples = [];

  teamSkills.forEach((ts) => {
    const levelValue = ts.level;
    const isNull = levelValue === null || levelValue === undefined;

    if (isNull) {
      nullCount++;
      if (samples.length < 10) {
        samples.push({
          team: ts.team.name,
          skill: ts.skill.name,
          level: levelValue,
          type: typeof levelValue,
        });
      }
    } else {
      withLevelCount++;
    }
  });

  console.log("📊 ESTADÍSTICAS:");
  console.log(`   Con nivel (NOT NULL): ${withLevelCount}`);
  console.log(`   Sin nivel (NULL): ${nullCount}`);
  console.log(`   Total: ${teamSkills.length}\n`);

  if (samples.length > 0) {
    console.log("📋 MUESTRAS DE NULL (primeras 10):");
    samples.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.team} - ${s.skill}`);
      console.log(`      level = ${s.level} (type: ${s.type})`);
    });
  }

  // Verificar el schema
  console.log("\n🔍 VERIFICANDO SCHEMA...");
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'TeamSkill'
    AND column_name = 'level'
  `;
  console.log("Schema de TeamSkill.level:", result);

  // Contar con SQL directo
  console.log("\n🔍 CONTEO DIRECTO CON SQL...");
  const sqlNull = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM "TeamSkill" ts
    JOIN "Team" t ON t.id = ts."teamId"
    WHERE t.name LIKE 'DevTeam%'
    AND ts.level IS NULL
  `;
  console.log(`Skills con level NULL: ${sqlNull[0].count}`);

  const sqlNotNull = await prisma.$queryRaw`
    SELECT COUNT(*) as count
    FROM "TeamSkill" ts
    JOIN "Team" t ON t.id = ts."teamId"
    WHERE t.name LIKE 'DevTeam%'
    AND ts.level IS NOT NULL
  `;
  console.log(`Skills con level NOT NULL: ${sqlNotNull[0].count}`);

  if (nullCount > 0) {
    console.log("\n❌ PROBLEMA CONFIRMADO");
    console.log("   El matching falla porque level es NULL");
    console.log("   null >= requiredLevel siempre es false\n");
  }
} catch (error) {
  console.error("\n❌ Error:", error.message);
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
