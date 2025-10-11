/**
 * 🔧 FIX: Asignar niveles a TeamSkills que tienen level=NULL
 * 
 * Estrategia:
 * - Skills avanzadas (React, Node.js, AWS, etc.) → Nivel 4-5
 * - Skills intermedias (Express.js, Tailwind) → Nivel 3-4
 * - Skills básicas → Nivel 3
 * - Por defecto → Nivel 4 (competente)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mapeo de skills a niveles
const SKILL_LEVELS = {
  // Level 5 - Expert
  "React": 5,
  "Node.js": 5,
  "TypeScript": 5,
  "PostgreSQL": 5,
  "AWS": 5,
  "Docker": 5,
  "Kubernetes": 5,
  "GraphQL": 5,
  
  // Level 4 - Advanced
  "JavaScript": 4,
  "Express.js": 4,
  "Next.js": 4,
  "Tailwind CSS": 4,
  "MongoDB": 4,
  "Prisma": 4,
  "REST API": 4,
  "Git": 4,
  "React Native": 4,
  "Flutter": 4,
  
  // Level 3 - Intermediate
  "HTML5": 3,
  "CSS3": 3,
  "Figma": 3,
  "Adobe XD": 3,
  "UI Design": 3,
  "UX Design": 3,
  "Sketch": 3,
};

// Años de experiencia por nivel
const YEARS_BY_LEVEL = {
  5: 5,  // 5+ años
  4: 3,  // 3-4 años
  3: 2,  // 2-3 años
  2: 1,  // 1-2 años
  1: 0,  // < 1 año
};

try {
  console.log("🔧 ASIGNANDO NIVELES A TEAMSKILLS\n");

  // 1. Obtener todos los TeamSkills con level NULL
  const teamSkills = await prisma.teamSkill.findMany({
    where: {
      OR: [
        { level: null },
        { yearsExperience: null },
      ],
    },
    include: {
      team: { select: { name: true } },
      skill: { select: { name: true } },
    },
  });

  console.log(`TeamSkills a actualizar: ${teamSkills.length}\n`);

  if (teamSkills.length === 0) {
    console.log("✅ Todos los TeamSkills ya tienen nivel asignado");
    process.exit(0);
  }

  // 2. Actualizar cada TeamSkill
  let updated = 0;
  const updates = [];

  for (const ts of teamSkills) {
    const skillName = ts.skill.name;
    const level = SKILL_LEVELS[skillName] || 4; // Default: nivel 4
    const years = YEARS_BY_LEVEL[level];

    updates.push({
      id: ts.id,
      team: ts.team.name,
      skill: skillName,
      oldLevel: ts.level,
      newLevel: level,
      years: years,
    });

    await prisma.teamSkill.update({
      where: { id: ts.id },
      data: {
        level: level,
        yearsExperience: years,
      },
    });

    updated++;
  }

  console.log(`✅ Actualizados: ${updated} TeamSkills\n`);

  // 3. Mostrar resumen por equipo
  const byTeam = {};
  updates.forEach((u) => {
    if (!byTeam[u.team]) {
      byTeam[u.team] = [];
    }
    byTeam[u.team].push(u);
  });

  console.log("📊 RESUMEN POR EQUIPO:\n");
  Object.entries(byTeam).forEach(([teamName, skills]) => {
    console.log(`${teamName} (${skills.length} skills):`);
    
    // Agrupar por nivel
    const byLevel = {};
    skills.forEach((s) => {
      if (!byLevel[s.newLevel]) byLevel[s.newLevel] = [];
      byLevel[s.newLevel].push(s.skill);
    });

    Object.entries(byLevel)
      .sort(([a], [b]) => b - a)
      .forEach(([level, skillNames]) => {
        console.log(`  Nivel ${level}: ${skillNames.join(", ")}`);
      });
    console.log();
  });

  console.log("🎉 ¡NIVELES ASIGNADOS CORRECTAMENTE!\n");
  console.log("✅ El matching ahora debería funcionar correctamente");
  console.log("   Ejecuta: node scripts/test-matching.js\n");

} catch (error) {
  console.error("\n❌ Error:", error.message);
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
