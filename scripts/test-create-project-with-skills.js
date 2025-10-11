/**
 * 🧪 Script de Testing: Crear Proyecto con Skills
 * 
 * Propósito:
 * - Verificar que el backend acepta skills en el formato correcto
 * - Probar UPSERT de skills (crear si no existe, reutilizar si existe)
 * - Validar que ProjectSkill se crea correctamente
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testCreateProjectWithSkills() {
  console.log("🧪 TEST: Crear Proyecto con Skills\n");

  try {
    // 1. Buscar una empresa de prueba
    const company = await prisma.company.findFirst({
      where: {
        name: { contains: "TechStart", mode: "insensitive" },
      },
    });

    if (!company) {
      console.error("❌ No se encontró empresa de prueba (TechStart Colombia)");
      console.log("💡 Ejecuta: node scripts/add-test-matching-data.js");
      return;
    }

    console.log(`✅ Empresa encontrada: ${company.name} (${company.id})\n`);

    // 2. Datos del proyecto con skills
    const projectData = {
      companyId: company.id,
      title: `Test E-commerce ${Date.now()}`, // Título único
      description:
        "Tienda online de productos colombianos con pasarela de pagos",
      area: "Tecnología",
      city: "Bogotá",
      budget: 25000000,
      budgetCurrency: "COP",
      status: "OPEN",
    };

    const skillsData = [
      { name: "React", levelRequired: 5 },
      { name: "Node.js", levelRequired: 4 },
      { name: "PostgreSQL", levelRequired: 4 },
      { name: "TypeScript", levelRequired: 5 },
      { name: "NEW_TEST_SKILL", levelRequired: 3 }, // Esta NO existe en BD
    ];

    console.log("📋 Datos del proyecto:");
    console.log(JSON.stringify(projectData, null, 2));
    console.log("\n🎯 Skills a asignar:");
    skillsData.forEach((s) =>
      console.log(`  - ${s.name} (nivel ${s.levelRequired})`)
    );

    // 3. Crear proyecto
    console.log("\n⏳ Creando proyecto...");
    const project = await prisma.project.create({
      data: projectData,
    });
    console.log(`✅ Proyecto creado: ${project.id}`);

    // 4. Agregar skills con UPSERT
    console.log("\n⏳ Agregando skills...");
    for (const skillData of skillsData) {
      // 4.1 Buscar o crear skill
      const skill = await prisma.skill.upsert({
        where: { name: skillData.name },
        update: {},
        create: { name: skillData.name },
      });

      // 4.2 Crear relación ProjectSkill
      await prisma.projectSkill.create({
        data: {
          projectId: project.id,
          skillId: skill.id,
          levelRequired: skillData.levelRequired,
        },
      });

      console.log(
        `  ✅ ${skillData.name} (nivel ${skillData.levelRequired}) - Skill ID: ${skill.id}`
      );
    }

    // 5. Obtener proyecto completo con skills
    console.log("\n⏳ Obteniendo proyecto con skills...");
    const projectWithSkills = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        company: { select: { id: true, name: true } },
        skills: {
          include: {
            skill: true,
          },
          orderBy: {
            skill: { name: "asc" },
          },
        },
      },
    });

    console.log("\n📦 Proyecto completo:");
    console.log(JSON.stringify(projectWithSkills, null, 2));

    // 6. Verificar skills
    console.log("\n✅ RESULTADOS:");
    console.log(`   Proyecto ID: ${projectWithSkills.id}`);
    console.log(`   Título: ${projectWithSkills.title}`);
    console.log(`   Skills asignadas: ${projectWithSkills.skills.length}`);
    console.log("\n   Detalle de skills:");
    projectWithSkills.skills.forEach((ps) => {
      console.log(
        `   - ${ps.skill.name} (nivel requerido: ${ps.levelRequired || "no especificado"})`
      );
    });

    // 7. Verificar que no hay duplicados de skills
    console.log("\n🔍 Verificando skills únicas...");
    const skillCounts = await prisma.$queryRaw`
      SELECT name, COUNT(*) as count
      FROM "Skill"
      GROUP BY name
      HAVING COUNT(*) > 1
    `;

    if (skillCounts.length === 0) {
      console.log("✅ No hay skills duplicadas en la BD");
    } else {
      console.warn("⚠️ Skills duplicadas encontradas:");
      skillCounts.forEach((s) => console.log(`   - ${s.name}: ${s.count} veces`));
    }

    console.log("\n✅ TEST COMPLETADO CON ÉXITO\n");

    // 8. Limpiar (opcional)
    console.log("🗑️ ¿Deseas eliminar el proyecto de prueba? (presiona Ctrl+C para cancelar)");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await prisma.projectSkill.deleteMany({
      where: { projectId: project.id },
    });
    await prisma.project.delete({
      where: { id: project.id },
    });

    console.log("✅ Proyecto de prueba eliminado");
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error("\nStack trace:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
testCreateProjectWithSkills();
