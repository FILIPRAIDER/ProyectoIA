/**
 * Verificar el proyecto que el AI-API está intentando usar
 */

import { PrismaClient } from "@prisma/client";

const PROJECT_ID = process.env.PROJECT_ID || "cmglus9cs000x5pum597dk5tg";

const prisma = new PrismaClient();

try {
  console.log("🔍 VERIFICANDO PROYECTO DEL AI-API\n");
  console.log(`ID: ${PROJECT_ID}\n`);

  const project = await prisma.project.findUnique({
    where: { id: PROJECT_ID },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
      company: true,
    },
  });

  if (!project) {
    console.log("❌ PROYECTO NO ENCONTRADO");
    console.log(`   El proyecto ${PROJECT_ID} no existe en la base de datos`);
    console.log("\n💡 SOLUCIÓN: Crear el proyecto en producción");
    process.exit(1);
  }

  console.log("✅ PROYECTO ENCONTRADO\n");
  console.log(`Título: ${project.title}`);
  console.log(`Empresa: ${project.company.name}`);
  console.log(`Presupuesto: $${project.budget} ${project.budgetCurrency}`);
  console.log(`Ciudad: ${project.city || "N/A"}`);
  console.log(`Área: ${project.area || "N/A"}`);
  console.log(`Status: ${project.status}`);
  console.log(`Skills: ${project.skills.length}\n`);

  if (project.skills.length === 0) {
    console.log("⚠️  PROYECTO SIN SKILLS");
    console.log("   El matching puede retornar pocos resultados");
  } else {
    console.log("📋 SKILLS REQUERIDAS:");
    project.skills.forEach((ps) => {
      console.log(
        `   - ${ps.skill.name} (nivel ${ps.levelRequired || "N/A"})`
      );
    });
  }

  // Ahora probar el endpoint de matching
  console.log("\n🧪 PROBANDO ENDPOINT DE MATCHING...\n");

  const { computeCandidates } = await import(
    "../src/services/matching.service.js"
  );

  const result = await computeCandidates({
    prisma,
    project,
    top: 5,
    explain: false,
    minCoverage: 0.15,
    requireArea: false,
    requireCity: false,
  });

  console.log(`✅ MATCHING EJECUTADO`);
  console.log(`   Candidatos encontrados: ${result.candidates.length}`);
  console.log(`   Filtros aplicados: ${result.filtersApplied.join(", ")}\n`);

  if (result.candidates.length === 0) {
    console.log("⚠️  0 CANDIDATOS ENCONTRADOS");
    console.log("\nPosibles causas:");
    console.log("   1. Ningún equipo tiene las skills requeridas");
    console.log("   2. Los equipos no tienen miembros");
    console.log("   3. minCoverage muy alto (actual: 0.15)");
    console.log("   4. TeamSkills sin niveles asignados");
  } else {
    console.log("📊 CANDIDATOS:\n");
    result.candidates.forEach((c, i) => {
      console.log(`${i + 1}. ${c.teamName}`);
      console.log(`   Score: ${c.score}/100`);
      console.log(`   Miembros: ${c.membersCount}`);
      console.log(
        `   Cobertura: ${c.breakdown.skillCoverage}% (${c.teamSkillNames.length} skills)`
      );
      console.log(`   Ciudad: ${c.city || "N/A"}`);
      console.log(`   Disponibilidad: ${c.avgAvailability || 0}h/semana`);
      if (c.missingSkills.length > 0 && c.missingSkills.length <= 5) {
        console.log(`   Faltantes: ${c.missingSkills.join(", ")}`);
      }
      console.log();
    });
  }

  console.log("✅ ENDPOINT FUNCIONAL\n");
  console.log("💡 PARA EL AI-API:");
  console.log(`   URL: POST /matching/projects/${PROJECT_ID}/candidates`);
  console.log("   Query: ?minCoverage=0.15&top=5");
  console.log(`   Expected: ${result.candidates.length} candidatos`);

} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
