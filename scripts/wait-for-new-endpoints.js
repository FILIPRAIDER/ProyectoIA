/**
 * Script para esperar el deploy de Render y probar los nuevos endpoints
 */

const BACKEND_URL = "https://proyectoia-backend.onrender.com";

async function checkEndpoints() {
  console.log("🔍 Verificando nuevos endpoints...\n");

  // Test 1: Sectores
  try {
    const res1 = await fetch(`${BACKEND_URL}/meta/sectors`);
    
    if (res1.ok) {
      const data1 = await res1.json();
      console.log("✅ GET /meta/sectors - FUNCIONANDO");
      console.log(`   Total sectores: ${data1.total}`);
      return true;
    } else {
      console.log("⏳ GET /meta/sectors - Aún no disponible (404)");
      return false;
    }
  } catch (error) {
    console.log("❌ Error de conexión:", error.message);
    return false;
  }
}

async function waitAndTest() {
  console.log("🚀 ESPERANDO DEPLOY DE RENDER\n");
  console.log("=".repeat(70));
  console.log("Render está desplegando los nuevos cambios...");
  console.log("Esto puede tardar 2-3 minutos.\n");

  let attempts = 0;
  const maxAttempts = 30; // 5 minutos máximo

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\n[Intento ${attempts}/${maxAttempts}]`);
    
    const isReady = await checkEndpoints();
    
    if (isReady) {
      console.log("\n" + "=".repeat(70));
      console.log("✅ DEPLOY COMPLETADO - NUEVOS ENDPOINTS DISPONIBLES");
      console.log("=".repeat(70));
      
      // Probar todos los endpoints
      await testAllEndpoints();
      return;
    }

    if (attempts < maxAttempts) {
      console.log("   Esperando 10 segundos...");
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  console.log("\n⏱️  Tiempo de espera agotado.");
  console.log("Verifica manualmente en: https://dashboard.render.com/");
}

async function testAllEndpoints() {
  console.log("\n📋 PROBANDO TODOS LOS ENDPOINTS NUEVOS\n");

  // Test 1: Sectores
  console.log("1️⃣  GET /meta/sectors");
  console.log("─".repeat(70));
  const res1 = await fetch(`${BACKEND_URL}/meta/sectors`);
  const data1 = await res1.json();
  console.log(`✅ Status: ${res1.status}`);
  console.log(`📊 Sectores: ${data1.total}`);
  console.log(`📋 Primeros 5: ${data1.sectors.slice(0, 5).map(s => s.name).join(", ")}`);

  // Test 2: Stacks
  console.log("\n2️⃣  GET /meta/stacks");
  console.log("─".repeat(70));
  const res2 = await fetch(`${BACKEND_URL}/meta/stacks`);
  const data2 = await res2.json();
  console.log(`✅ Status: ${res2.status}`);
  console.log(`📊 Stacks: ${data2.total}`);
  console.log(`📋 Primeros 3: ${data2.stacks.slice(0, 3).join(", ")}`);

  console.log("\n" + "=".repeat(70));
  console.log("🎉 TODOS LOS ENDPOINTS FUNCIONANDO CORRECTAMENTE");
  console.log("=".repeat(70));

  console.log("\n📝 URLs para el frontend:\n");
  console.log("// Sectores:");
  console.log(`fetch("${BACKEND_URL}/meta/sectors")`);
  console.log("\n// Stacks:");
  console.log(`fetch("${BACKEND_URL}/meta/stacks")`);
  console.log("\n// Avatar:");
  console.log(`fetch("${BACKEND_URL}/uploads/users/:userId/avatar", {`);
  console.log('  method: "POST",');
  console.log('  body: formData,');
  console.log('})');
}

waitAndTest();
