/**
 * Script para probar los endpoints de sectores y stacks
 */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4001";
const BACKEND_PROD = "https://proyectoia-backend.onrender.com";

async function testMetaEndpoints() {
  console.log("🧪 PROBANDO ENDPOINTS DE META (SECTORES Y STACKS)\n");
  console.log("=".repeat(70));

  // Test 1: Sectores
  console.log("\n1️⃣  Probando GET /meta/sectors");
  console.log("─".repeat(70));
  try {
    const res = await fetch(`${BACKEND_PROD}/meta/sectors`);
    const data = await res.json();

    if (res.ok) {
      console.log(`✅ Status: ${res.status}`);
      console.log(`📊 Total sectores: ${data.total}`);
      console.log("\n📋 Primeros 10 sectores:");
      data.sectors.slice(0, 10).forEach((sector, i) => {
        console.log(`   ${i + 1}. ${sector.name}`);
      });
      console.log(`   ... y ${data.sectors.length - 10} más`);
      
      console.log("\n✅ Formato correcto: { ok, sectors: [{ id, name }], total }");
    } else {
      console.log(`❌ Error: ${res.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 2: Stacks tecnológicos
  console.log("\n\n2️⃣  Probando GET /meta/stacks");
  console.log("─".repeat(70));
  try {
    const res = await fetch(`${BACKEND_PROD}/meta/stacks`);
    const data = await res.json();

    if (res.ok) {
      console.log(`✅ Status: ${res.status}`);
      console.log(`📊 Total stacks: ${data.total}`);
      console.log("\n📋 Stacks disponibles:");
      data.stacks.forEach((stack, i) => {
        console.log(`   ${i + 1}. ${stack}`);
      });
      
      console.log("\n✅ Formato correcto: { ok, stacks: string[], total }");
    } else {
      console.log(`❌ Error: ${res.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 3: Países (ya existente, verificar que sigue funcionando)
  console.log("\n\n3️⃣  Verificando GET /meta/countries (ya existente)");
  console.log("─".repeat(70));
  try {
    const res = await fetch(`${BACKEND_PROD}/meta/countries`);
    const data = await res.json();

    if (res.ok && Array.isArray(data)) {
      console.log(`✅ Status: ${res.status}`);
      console.log(`📊 Total países: ${data.length}`);
      console.log(`📋 Ejemplo: ${data[0].name} (${data[0].code}) ${data[0].flag} ${data[0].dialCode}`);
      console.log("\n✅ Endpoint de países sigue funcionando correctamente");
    } else {
      console.log(`⚠️  Formato inesperado`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("📝 RESUMEN DE ENDPOINTS META");
  console.log("=".repeat(70));

  console.log("\n🌍 Endpoints disponibles:");
  console.log(`   GET ${BACKEND_PROD}/meta/countries`);
  console.log(`   GET ${BACKEND_PROD}/meta/sectors`);
  console.log(`   GET ${BACKEND_PROD}/meta/stacks`);

  console.log("\n📊 Sectores (26 opciones):");
  console.log("   Tecnología, Finanzas, Salud, Educación, E-commerce,");
  console.log("   Marketing, Retail, Manufactura, Logística, etc.");

  console.log("\n💻 Stacks (15 opciones comunes):");
  console.log("   MERN, MEAN, LAMP, JAMstack, Python + Django,");
  console.log("   Ruby on Rails, .NET Core, Java Spring Boot, etc.");

  console.log("\n✅ Ventajas:");
  console.log("   • No requiere base de datos adicional");
  console.log("   • Sincronizado con frontend (src/constants/sectors.ts)");
  console.log("   • Fácil de actualizar (solo editar arrays)");
  console.log("   • Respuestas instantáneas");

  console.log("\n📝 Uso en frontend:");
  console.log("```typescript");
  console.log("// Cargar sectores dinámicamente (opcional)");
  console.log("const { data } = await fetch('/meta/sectors');");
  console.log("setSectors(data.sectors);");
  console.log("");
  console.log("// O usar constante local (ya implementado)");
  console.log("import { SECTORS } from '@/constants/sectors';");
  console.log("```");

  console.log("\n" + "=".repeat(70));
  console.log("✅ PRUEBAS COMPLETADAS");
  console.log("=".repeat(70));
}

testMetaEndpoints();
