/**
 * Crear proyecto de prueba con skills para testing de matching
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  console.log("🚀 CREANDO PROYECTO DE PRUEBA CON SKILLS\n");

  // 1. Buscar o crear empresa
  let company = await prisma.company.findFirst({
    where: { name: "Test Company" },
  });

  if (!company) {
    console.log("Creando empresa de prueba...");
    company = await prisma.company.create({
      data: {
        name: "Test Company",
        about: "Empresa para testing de matching",
      },
    });
  }

  console.log(`✅ Empresa: ${company.name} (${company.id})\n`);

  // 2. Skills requeridas para e-commerce
  const requiredSkills = [
    { name: "React", level: 4 },
    { name: "Node.js", level: 4 },
    { name: "PostgreSQL", level: 4 },
    { name: "Express.js", level: 3 },
    { name: "Tailwind CSS", level: 3 },
    { name: "REST API", level: 4 },
    { name: "Git", level: 3 },
    { name: "AWS", level: 3 },
  ];

  // 3. Crear proyecto
  console.log("Creando proyecto con skills...");
  const project = await prisma.project.create({
    data: {
      title: "E-commerce Moderno - Test Matching",
      description:
        "Plataforma de e-commerce con carrito, pagos y gestión de inventario. Proyecto de prueba para matching.",
      budget: 50000000,
      budgetCurrency: "COP",
      companyId: company.id,
      city: "Bogotá",
      area: "Tecnología",
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días
    },
  });

  console.log(`✅ Proyecto: ${project.title} (${project.id})\n`);

  // 4. Agregar skills al proyecto
  console.log("Agregando skills al proyecto...");
  for (const skillData of requiredSkills) {
    // Buscar o crear skill
    const skill = await prisma.skill.upsert({
      where: { name: skillData.name },
      update: {},
      create: { name: skillData.name },
    });

    // Crear relación ProjectSkill
    await prisma.projectSkill.create({
      data: {
        projectId: project.id,
        skillId: skill.id,
        levelRequired: skillData.level,
      },
    });

    console.log(`   ✓ ${skillData.name} (nivel ${skillData.level})`);
  }

  console.log("\n🎉 PROYECTO DE PRUEBA CREADO\n");
  console.log("📋 INFORMACIÓN:");
  console.log(`   ID: ${project.id}`);
  console.log(`   Título: ${project.title}`);
  console.log(`   Skills: ${requiredSkills.length}`);
  console.log(`   Presupuesto: $${project.budget.toLocaleString()} COP`);
  console.log("\n✅ Ahora puedes probar el matching con:");
  console.log(`   node scripts/test-matching.js ${project.id}\n`);

} catch (error) {
  console.error("\n❌ Error:", error.message);
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
