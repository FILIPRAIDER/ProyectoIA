/**
 * 🧪 Test del Endpoint de Matching
 * 
 * Verifica que el matching esté funcionando con un proyecto de prueba
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testMatching() {
  console.log("🧪 TEST: Endpoint de Matching\n");

  try {
    // 1. Buscar un proyecto de prueba
    const projectId = process.argv[2]; // ID desde línea de comandos
    
    let project;
    if (projectId) {
      project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
          company: true,
        },
      });
    } else {
      // Buscar proyecto más reciente con skills
      project = await prisma.project.findFirst({
        where: {
          skills: {
            some: {},
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
          company: true,
        },
      });
    }

    if (!project) {
      console.log("❌ No hay proyectos de prueba");
      console.log("💡 Ejecuta: node scripts/add-test-matching-data.js");
      return;
    }

    console.log("📋 PROYECTO SELECCIONADO:");
    console.log(`   ID: ${project.id}`);
    console.log(`   Título: ${project.title}`);
    console.log(`   Empresa: ${project.company.name}`);
    console.log(`   Skills requeridas: ${project.skills.length}`);

    if (project.skills.length === 0) {
      console.log("\n❌ EL PROYECTO NO TIENE SKILLS");
      console.log("   El matching no funcionará sin skills en el proyecto");
      return;
    }

    console.log("\n   Skills del proyecto:");
    project.skills.forEach((ps) => {
      console.log(
        `      - ${ps.skill.name} (nivel ${ps.levelRequired || "N/A"})`
      );
    });

    // 2. Obtener equipos con skills
    const teams = await prisma.team.findMany({
      include: {
        skills: {
          include: {
            skill: true,
          },
        },
        members: true,
      },
    });

    console.log(`\n🎯 EQUIPOS DISPONIBLES: ${teams.length}`);

    const teamsWithSkills = teams.filter((t) => t.skills.length > 0);
    console.log(`   Con skills: ${teamsWithSkills.length}`);
    console.log(`   Sin skills: ${teams.length - teamsWithSkills.length}`);

    if (teamsWithSkills.length === 0) {
      console.log("\n❌ NO HAY EQUIPOS CON SKILLS");
      console.log("   El matching no puede funcionar");
      return;
    }

    // 3. Calcular matching manualmente
    console.log("\n🔍 CALCULANDO MATCHES...\n");

    const requiredSkills = project.skills.map((ps) => ({
      name: ps.skill.name.toLowerCase(),
      level: ps.levelRequired || 3,
    }));

    const matches = [];

    for (const team of teamsWithSkills) {
      const teamSkillNames = team.skills.map((ts) =>
        ts.skill.name.toLowerCase()
      );

      // Contar skills en común
      let matchedCount = 0;
      const matchedSkills = [];
      const missingSkills = [];

      for (const reqSkill of requiredSkills) {
        if (teamSkillNames.includes(reqSkill.name)) {
          matchedCount++;
          matchedSkills.push(reqSkill.name);
        } else {
          missingSkills.push(reqSkill.name);
        }
      }

      const coverage = requiredSkills.length > 0 
        ? matchedCount / requiredSkills.length 
        : 0;

      const matchPercentage = Math.round(coverage * 100);

      if (coverage >= 0.15) {
        // Mínimo 15% de coverage
        matches.push({
          team: {
            id: team.id,
            name: team.name,
            city: team.city,
            memberCount: team.members.length,
            totalSkills: team.skills.length,
          },
          matchPercentage,
          coverage,
          matchedCount,
          matchedSkills,
          missingSkills,
        });
      }
    }

    // Ordenar por match percentage
    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    console.log("=".repeat(80));
    console.log(`📊 RESULTADOS DEL MATCHING: ${matches.length} equipos encontrados\n`);

    if (matches.length === 0) {
      console.log("❌ NO SE ENCONTRARON MATCHES");
      console.log("\nPosibles causas:");
      console.log("   1. Los equipos no tienen las skills requeridas");
      console.log("   2. El threshold de coverage es muy alto (actual: 15%)");
      console.log("   3. Los nombres de las skills no coinciden exactamente");
      console.log("\n💡 Skills requeridas por el proyecto:");
      requiredSkills.forEach((s) => console.log(`   - ${s.name}`));
      console.log("\n💡 Skills disponibles en equipos:");
      const allTeamSkills = new Set(
        teamsWithSkills.flatMap((t) => t.skills.map((s) => s.skill.name.toLowerCase()))
      );
      Array.from(allTeamSkills)
        .sort()
        .forEach((s) => console.log(`   - ${s}`));
    } else {
      matches.forEach((match, index) => {
        console.log(`${index + 1}. ${match.team.name}`);
        console.log(`   Match: ${match.matchPercentage}% (${match.matchedCount}/${requiredSkills.length} skills)`);
        console.log(`   Ciudad: ${match.team.city || "N/A"}`);
        console.log(`   Miembros: ${match.team.memberCount}`);
        console.log(`   Total skills: ${match.team.totalSkills}`);

        if (match.matchedSkills.length > 0) {
          console.log(`   ✅ Skills en común:`);
          match.matchedSkills.forEach((s) => console.log(`      - ${s}`));
        }

        if (match.missingSkills.length > 0 && match.missingSkills.length <= 5) {
          console.log(`   ⚠️ Skills faltantes:`);
          match.missingSkills.forEach((s) => console.log(`      - ${s}`));
        }

        console.log();
      });

      console.log("=".repeat(80));
      console.log("\n✅ MATCHING FUNCIONANDO CORRECTAMENTE");
      console.log(
        `   ${matches.length} equipos califican con mínimo 15% de coverage`
      );
    }

    // 4. Sugerencias para el equipo IA
    console.log("\n💡 PARA EL EQUIPO IA:");
    console.log("   URL del endpoint:");
    console.log(
      `   POST http://localhost:4001/matching/projects/${project.id}/candidates`
    );
    console.log("\n   Body (opcional):");
    console.log("   {");
    console.log('     "minCoverage": 0.15,');
    console.log('     "top": 5');
    console.log("   }");
    console.log("\n   Expected response:");
    console.log(`   - ${matches.length} candidatos`);
    console.log(
      `   - Top match: ${matches[0]?.team.name} (${matches[0]?.matchPercentage}%)`
    );
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testMatching();
