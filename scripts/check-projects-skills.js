/**
 * 🔍 Verificar Skills de Proyectos
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkProjectsSkills() {
  console.log("🔍 VERIFICANDO SKILLS DE PROYECTOS\n");

  try {
    const projects = await prisma.project.findMany({
      include: {
        company: { select: { name: true } },
        skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`📊 Total de proyectos: ${projects.length}\n`);
    console.log("=".repeat(80) + "\n");

    const withSkills = [];
    const withoutSkills = [];

    for (const project of projects) {
      const hasSkills = project.skills.length > 0;
      const status = hasSkills ? "✅" : "❌";

      if (hasSkills) {
        withSkills.push(project);
      } else {
        withoutSkills.push(project);
      }

      console.log(`${status} ${project.title}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Empresa: ${project.company.name}`);
      console.log(`   Skills: ${project.skills.length}`);

      if (hasSkills) {
        console.log("   Lista de skills:");
        project.skills.forEach((ps) => {
          console.log(
            `      - ${ps.skill.name} (nivel ${ps.levelRequired || "N/A"})`
          );
        });
      } else {
        console.log("   ⚠️ SIN SKILLS ASIGNADAS");
      }

      console.log();
    }

    console.log("=".repeat(80));
    console.log("\n📊 RESUMEN:");
    console.log(`   ✅ Proyectos con skills: ${withSkills.length}`);
    console.log(`   ❌ Proyectos sin skills: ${withoutSkills.length}`);

    if (withoutSkills.length > 0) {
      console.log("\n⚠️ PROYECTOS QUE NECESITAN SKILLS:");
      withoutSkills.forEach((p) => {
        console.log(`   - ${p.title.substring(0, 60)}... (${p.id})`);
      });

      console.log("\n💡 ACCIÓN REQUERIDA:");
      console.log(
        "   Los proyectos sin skills NO aparecerán en el matching."
      );
      console.log("   Para agregar skills a proyectos existentes:");
      console.log("   1. Usa el AI-API para crear proyectos nuevos con skills");
      console.log(
        "   2. O ejecuta: node scripts/add-skills-to-existing-projects.js"
      );
    } else {
      console.log("\n✅ TODOS LOS PROYECTOS TIENEN SKILLS");
    }
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectsSkills();
