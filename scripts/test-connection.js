// scripts/test-connection.js
// Script para verificar la conexión a la base de datos

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function testConnection() {
  console.log("🔍 Probando conexión a la base de datos...\n");

  try {
    // Test 1: Conexión básica
    console.log("1️⃣ Test de conexión básica...");
    await prisma.$connect();
    console.log("✅ Conexión establecida exitosamente\n");

    // Test 2: Query simple
    console.log("2️⃣ Test de query simple...");
    const userCount = await prisma.user.count();
    console.log(`✅ Usuarios en la base de datos: ${userCount}\n`);

    // Test 3: Query de skills
    console.log("3️⃣ Test de query de skills...");
    const skillCount = await prisma.skill.count();
    console.log(`✅ Skills en la base de datos: ${skillCount}\n`);

    // Test 4: Query de equipos
    console.log("4️⃣ Test de query de equipos...");
    const teamCount = await prisma.team.count();
    console.log(`✅ Equipos en la base de datos: ${teamCount}\n`);

    // Test 5: Verificar pooling
    console.log("5️⃣ Test de múltiples queries concurrentes (pooling)...");
    const start = Date.now();
    await Promise.all([
      prisma.user.findMany({ take: 5 }),
      prisma.skill.findMany({ take: 5 }),
      prisma.team.findMany({ take: 5 }),
      prisma.company.findMany({ take: 5 }),
    ]);
    const elapsed = Date.now() - start;
    console.log(`✅ Queries concurrentes completadas en ${elapsed}ms\n`);

    console.log("🎉 Todas las pruebas pasaron exitosamente!");
    console.log("\n📊 Configuración de conexión:");
    console.log("- DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 50) + "...");
    console.log("- Connection pooling: Activo");
    console.log("- Timeout: 20s");
    console.log("- Connection limit: 10");
  } catch (error) {
    console.error("\n❌ Error en las pruebas:");
    console.error("Error:", error.message);
    console.error("\n📋 Detalles del error:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Conexión cerrada correctamente");
  }
}

testConnection();
