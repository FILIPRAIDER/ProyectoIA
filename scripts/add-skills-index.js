/**
 * Script para agregar índice en la columna name de Skills
 * Optimiza búsquedas case-insensitive
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Agregando índice en Skill.name para optimizar búsquedas...\n");

  try {
    // Crear índice en la columna name
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_skills_name" ON "Skill"("name");
    `;

    console.log("✅ Índice 'idx_skills_name' creado exitosamente");
    console.log("   Búsquedas por nombre ahora serán mucho más rápidas\n");

    // Verificar que el índice se creó
    const indexes = await prisma.$queryRaw`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'Skill' 
      AND indexname LIKE '%name%';
    `;

    console.log("📋 Índices en tabla Skill relacionados con 'name':");
    console.log(indexes);

  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("ℹ️  El índice ya existe, no es necesario crearlo");
    } else {
      console.error("❌ Error:", error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
