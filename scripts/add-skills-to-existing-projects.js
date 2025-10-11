/**
 * 🔧 Agregar Skills a Proyectos Existentes (Inferencia Inteligente)
 * 
 * Analiza el título y descripción de proyectos sin skills y les asigna
 * skills relevantes automáticamente.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mapeo de palabras clave a skills
const skillInferenceRules = {
  // Frontend
  react: ["React", "JavaScript", "HTML5", "CSS3"],
  vue: ["Vue.js", "JavaScript", "HTML5", "CSS3"],
  angular: ["Angular", "TypeScript", "HTML5", "CSS3"],
  nextjs: ["Next.js", "React", "TypeScript"],
  "next.js": ["Next.js", "React", "TypeScript"],

  // Backend
  node: ["Node.js", "JavaScript"],
  nodejs: ["Node.js", "Express.js", "JavaScript"],
  express: ["Express.js", "Node.js"],
  nestjs: ["NestJS", "TypeScript", "Node.js"],
  python: ["Python", "Django", "FastAPI"],
  django: ["Django", "Python", "PostgreSQL"],

  // Database
  postgresql: ["PostgreSQL", "SQL"],
  postgres: ["PostgreSQL", "SQL"],
  mongodb: ["MongoDB", "NoSQL"],
  mysql: ["MySQL", "SQL"],
  firestore: ["Firestore", "Firebase"],
  firebase: ["Firebase", "Firestore"],

  // Mobile
  "react native": ["React Native", "JavaScript", "React"],
  flutter: ["Flutter", "Dart"],
  móvil: ["React Native", "Flutter"],
  movil: ["React Native", "Flutter"],
  "app móvil": ["React Native", "Flutter"],
  mobile: ["React Native", "Flutter"],

  // E-commerce
  ecommerce: [
    "React",
    "Node.js",
    "PostgreSQL",
    "Stripe",
    "PayPal",
    "Express.js",
  ],
  "e-commerce": [
    "React",
    "Node.js",
    "PostgreSQL",
    "Stripe",
    "PayPal",
    "Express.js",
  ],
  tienda: [
    "React",
    "Node.js",
    "PostgreSQL",
    "Stripe",
    "WooCommerce",
    "Tailwind CSS",
  ],
  shopify: ["Shopify", "Liquid", "JavaScript"],
  woocommerce: ["WooCommerce", "WordPress", "PHP"],

  // Web general
  "página web": ["React", "Next.js", "Tailwind CSS", "Node.js"],
  "landing page": ["React", "Next.js", "Tailwind CSS", "Figma"],
  website: ["React", "Next.js", "Tailwind CSS"],

  // Dashboard/Admin
  dashboard: [
    "React",
    "Next.js",
    "TypeScript",
    "PostgreSQL",
    "GraphQL",
    "NestJS",
  ],
  admin: ["React", "Next.js", "NestJS", "PostgreSQL"],

  // Design
  figma: ["Figma", "UI/UX Design"],
  diseño: ["Figma", "UI/UX Design", "Adobe XD"],
  "ui/ux": ["UI/UX Design", "Figma", "Adobe XD"],

  // Delivery/Food
  delivery: [
    "React Native",
    "Node.js",
    "MongoDB",
    "Firebase",
    "Google Maps API",
  ],
  comida: ["React Native", "Node.js", "MongoDB", "Firebase"],
  restaurante: ["React", "Node.js", "PostgreSQL"],

  // Ropa/Fashion
  ropa: ["React", "Node.js", "PostgreSQL", "Stripe", "Tailwind CSS"],
  moda: ["React", "Next.js", "Tailwind CSS", "Figma"],
  fashion: ["React", "Next.js", "Tailwind CSS"],

  // Salud/Health
  salud: ["React Native", "Node.js", "PostgreSQL", "HIPAA Compliance"],
  health: ["React Native", "Node.js", "PostgreSQL"],

  // Arte/Art
  arte: ["React", "Next.js", "Tailwind CSS", "Cloudinary"],
  art: ["React", "Next.js", "Tailwind CSS"],
  galería: ["React", "Next.js", "Cloudinary", "PostgreSQL"],

  // Plantas/Plants
  plantas: ["React", "Node.js", "PostgreSQL", "Stripe"],
  plants: ["React", "Node.js", "PostgreSQL"],
};

function inferSkillsFromText(text) {
  const lowerText = text.toLowerCase();
  const skillsSet = new Set();

  // Buscar coincidencias
  for (const [keyword, skills] of Object.entries(skillInferenceRules)) {
    if (lowerText.includes(keyword)) {
      skills.forEach((skill) => skillsSet.add(skill));
    }
  }

  // Si no se encontró nada, usar un stack básico web
  if (skillsSet.size === 0) {
    return ["React", "Node.js", "PostgreSQL", "TypeScript", "Tailwind CSS"];
  }

  return Array.from(skillsSet);
}

function inferLevelFromProjectBudget(budget) {
  if (!budget) return 3; // Default medio

  if (budget >= 50000000) return 5; // Senior
  if (budget >= 30000000) return 4; // Mid-Senior
  if (budget >= 15000000) return 3; // Mid
  if (budget >= 5000000) return 2; // Junior
  return 2; // Entry
}

async function addSkillsToExistingProjects() {
  console.log("🔧 AGREGANDO SKILLS A PROYECTOS EXISTENTES\n");

  try {
    // 1. Obtener proyectos sin skills
    const projectsWithoutSkills = await prisma.project.findMany({
      where: {
        skills: {
          none: {},
        },
      },
      include: {
        company: { select: { name: true } },
        skills: true,
      },
    });

    if (projectsWithoutSkills.length === 0) {
      console.log("✅ Todos los proyectos ya tienen skills asignadas");
      return;
    }

    console.log(
      `📊 Proyectos sin skills: ${projectsWithoutSkills.length}\n`
    );
    console.log("=".repeat(80) + "\n");

    // 2. Procesar cada proyecto
    let processedCount = 0;

    for (const project of projectsWithoutSkills) {
      console.log(`📋 ${project.title}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Empresa: ${project.company.name}`);

      // Inferir skills del título y descripción
      const textToAnalyze =
        `${project.title} ${project.description || ""}`.toLowerCase();
      const inferredSkillNames = inferSkillsFromText(textToAnalyze);

      console.log(`   Skills inferidas: ${inferredSkillNames.length}`);
      inferredSkillNames.forEach((s) => console.log(`      - ${s}`));

      // Determinar nivel basado en presupuesto
      const level = inferLevelFromProjectBudget(project.budget);
      console.log(`   Nivel inferido: ${level} (basado en presupuesto)`);

      // Agregar skills al proyecto
      for (const skillName of inferredSkillNames) {
        // Buscar o crear la skill
        const skill = await prisma.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });

        // Crear relación ProjectSkill
        try {
          await prisma.projectSkill.create({
            data: {
              projectId: project.id,
              skillId: skill.id,
              levelRequired: level,
            },
          });
        } catch (error) {
          // Ignorar errores de duplicados
          if (!error.code || error.code !== "P2002") {
            console.warn(`      ⚠️ Error al agregar ${skillName}: ${error.message}`);
          }
        }
      }

      console.log(`   ✅ ${inferredSkillNames.length} skills agregadas\n`);
      processedCount++;
    }

    console.log("=".repeat(80));
    console.log(`\n✅ COMPLETADO: ${processedCount} proyectos actualizados`);

    // 3. Verificación
    console.log("\n🔍 VERIFICANDO RESULTADOS...\n");

    const projectsStillWithoutSkills = await prisma.project.count({
      where: {
        skills: {
          none: {},
        },
      },
    });

    const totalProjects = await prisma.project.count();
    const projectsWithSkills = totalProjects - projectsStillWithoutSkills;

    console.log("📊 RESUMEN FINAL:");
    console.log(`   Total de proyectos: ${totalProjects}`);
    console.log(`   ✅ Con skills: ${projectsWithSkills}`);
    console.log(`   ❌ Sin skills: ${projectsStillWithoutSkills}`);

    if (projectsStillWithoutSkills === 0) {
      console.log("\n🎉 ¡TODOS LOS PROYECTOS TIENEN SKILLS!");
      console.log("   El sistema de matching ahora funcionará correctamente.");
    }
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

addSkillsToExistingProjects();
