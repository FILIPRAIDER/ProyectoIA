/**
 * Buscar el proyecto creado por el AI-API en producción
 * Buscar por título o descripción ya que el ID específico puede ser diferente
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
  console.log("🔍 BUSCANDO PROYECTOS EN PRODUCCIÓN\n");

  // 1. Buscar proyectos recientes
  const recentProjects = await prisma.project.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
      company: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log(`📊 ÚLTIMOS 10 PROYECTOS CREADOS:\n`);

  recentProjects.forEach((p, i) => {
    console.log(`${i + 1}. ${p.title}`);
    console.log(`   ID: ${p.id}`);
    console.log(`   Empresa: ${p.company.name}`);
    console.log(`   Skills: ${p.skills.length}`);
    console.log(`   Presupuesto: $${p.budget} ${p.budgetCurrency}`);
    console.log(`   Creado: ${p.createdAt.toISOString()}`);
    console.log();
  });

  // 2. Buscar específicamente "Tienda Online de Gorras" o similar
  console.log("🔍 BUSCANDO PROYECTO DE GORRAS...\n");

  const gorrasProjects = await prisma.project.findMany({
    where: {
      OR: [
        { title: { contains: "Gorras", mode: "insensitive" } },
        { title: { contains: "Tienda", mode: "insensitive" } },
        { description: { contains: "gorras", mode: "insensitive" } },
      ],
    },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
      company: {
        select: {
          name: true,
        },
      },
    },
  });

  if (gorrasProjects.length === 0) {
    console.log("❌ No se encontró el proyecto de gorras");
    console.log("   El AI-API puede haber usado otro nombre o título\n");
  } else {
    console.log(`✅ ENCONTRADOS ${gorrasProjects.length} PROYECTOS:\n`);

    gorrasProjects.forEach((p) => {
      console.log(`📋 ${p.title}`);
      console.log(`   ID: ${p.id} ⬅️ USAR ESTE ID`);
      console.log(`   Empresa: ${p.company.name}`);
      console.log(`   Presupuesto: $${p.budget} ${p.budgetCurrency}`);
      console.log(`   Ciudad: ${p.city || "N/A"}`);
      console.log(`   Skills: ${p.skills.length}`);

      if (p.skills.length > 0) {
        console.log(`   Skills requeridas:`);
        p.skills.forEach((ps) => {
          console.log(
            `      - ${ps.skill.name} (nivel ${ps.levelRequired || "N/A"})`
          );
        });
      }
      console.log();
    });

    // 3. Test de matching con el primer proyecto encontrado
    if (gorrasProjects[0]) {
      console.log("🧪 PROBANDO MATCHING CON ESTE PROYECTO...\n");

      const { computeCandidates } = await import(
        "../src/services/matching.service.js"
      );

      const result = await computeCandidates({
        prisma,
        project: gorrasProjects[0],
        top: 5,
        explain: false,
        minCoverage: 0.15,
        requireArea: false,
        requireCity: false,
      });

      console.log(`✅ Candidatos encontrados: ${result.candidates.length}\n`);

      if (result.candidates.length > 0) {
        result.candidates.forEach((c, i) => {
          console.log(`${i + 1}. ${c.teamName}: ${c.score} puntos`);
        });
      } else {
        console.log("⚠️  0 candidatos. Revisar skills del proyecto.");
      }

      console.log("\n💡 ENDPOINT PARA AI-API:");
      console.log(
        `   POST /matching/projects/${gorrasProjects[0].id}/candidates?minCoverage=0.15&top=5`
      );
    }
  }

  // 4. Buscar por ID específico que reportó el AI-API
  const specificId = "cmglus9cs000x5pum597dk5tg";
  console.log(`\n🔍 BUSCANDO ID ESPECÍFICO: ${specificId}\n`);

  const specificProject = await prisma.project.findUnique({
    where: { id: specificId },
    include: {
      skills: { include: { skill: true } },
      company: { select: { name: true } },
    },
  });

  if (specificProject) {
    console.log("✅ PROYECTO ENCONTRADO CON ESE ID");
    console.log(`   Título: ${specificProject.title}`);
    console.log(`   Skills: ${specificProject.skills.length}`);
  } else {
    console.log("❌ ID NO ENCONTRADO EN PRODUCCIÓN");
    console.log(
      "   Posibles causas:\n   1. El proyecto fue creado en BD local, no producción\n   2. El ID fue generado pero la creación falló\n   3. El AI-API está apuntando a ambiente incorrecto"
    );
  }
} catch (error) {
  console.error("\n❌ ERROR:", error.message);
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
