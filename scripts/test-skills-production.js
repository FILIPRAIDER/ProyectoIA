/**
 * Script para verificar el endpoint de skills en PRODUCCIÓN
 */

const BACKEND_URL = "https://proyectoia-backend.onrender.com";

async function testProductionSkills() {
  console.log("🌍 PROBANDO ENDPOINT DE SKILLS EN PRODUCCIÓN\n");
  console.log("=".repeat(70));
  console.log(`Backend: ${BACKEND_URL}\n`);

  // Test 1: Modo simple para autocomplete
  console.log("1️⃣  Autocomplete (simple=true): search=react&limit=10");
  console.log("─".repeat(70));
  try {
    const res = await fetch(`${BACKEND_URL}/skills?search=react&simple=true&limit=10`);
    const data = await res.json();
    
    if (res.ok) {
      console.log(`✅ Status: ${res.status}`);
      console.log(`📊 Total: ${data.pagination.total}`);
      console.log(`📋 Skills (formato { id, name }):`);
      data.skills.slice(0, 5).forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.name} (${s.id.substring(0, 8)}...)`);
      });
      
      // Verificar que NO tiene stats (modo simple)
      const hasStats = data.skills[0]?.stats !== undefined;
      console.log(`${hasStats ? "❌" : "✅"} Modo simple activado (sin estadísticas)`);
    } else {
      console.log(`❌ Error: ${res.status} - ${data.message || "Unknown"}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 2: Modo completo con estadísticas
  console.log("\n2️⃣  Modo completo (con estadísticas): search=python&limit=5");
  console.log("─".repeat(70));
  try {
    const res = await fetch(`${BACKEND_URL}/skills?search=python&limit=5`);
    const data = await res.json();
    
    if (res.ok) {
      console.log(`✅ Status: ${res.status}`);
      console.log(`📊 Total: ${data.pagination.total}`);
      if (data.skills.length > 0) {
        console.log(`📋 Primera skill con estadísticas:`);
        const first = data.skills[0];
        console.log(`   Nombre: ${first.name}`);
        console.log(`   Stats: Users=${first.stats?.usersCount}, Teams=${first.stats?.teamsCount}, Projects=${first.stats?.projectsCount}`);
        console.log(`✅ Modo completo activado (con estadísticas)`);
      }
    } else {
      console.log(`❌ Error: ${res.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 3: Sin filtro (listar todas)
  console.log("\n3️⃣  Listar todas (sin filtro): limit=20");
  console.log("─".repeat(70));
  try {
    const res = await fetch(`${BACKEND_URL}/skills?limit=20&simple=true`);
    const data = await res.json();
    
    if (res.ok) {
      console.log(`✅ Status: ${res.status}`);
      console.log(`📊 Total en BD: ${data.pagination.total}`);
      console.log(`📄 Mostrando: ${data.skills.length} skills`);
      console.log(`   Primeras 5: ${data.skills.slice(0, 5).map(s => s.name).join(", ")}`);
    } else {
      console.log(`❌ Error: ${res.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(70));
  console.log("✅ PRUEBAS COMPLETADAS");
  console.log("=".repeat(70));

  console.log("\n📝 URLs para el frontend:\n");
  console.log("// Autocomplete:");
  console.log(`${BACKEND_URL}/skills?search={query}&simple=true&limit=50\n`);
  console.log("// Lista completa:");
  console.log(`${BACKEND_URL}/skills?limit=100&simple=true\n`);
}

async function waitAndTest() {
  console.log("⏳ Esperando 30 segundos para que Render despliegue...\n");
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  await testProductionSkills();
}

waitAndTest();
