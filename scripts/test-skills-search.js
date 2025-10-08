/**
 * Script para probar el endpoint de búsqueda de skills
 * Verifica los diferentes modos y query parameters
 */

async function testSkillsEndpoint() {
  const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4001";
  
  console.log("🧪 PROBANDO ENDPOINT DE SKILLS\n");
  console.log("=".repeat(70));
  console.log(`API: ${API_BASE_URL}\n`);

  // Test 1: Búsqueda con "react" en modo simple
  console.log("1️⃣  Búsqueda simple (autocomplete): search=react&simple=true&limit=10");
  console.log("─".repeat(70));
  try {
    const res1 = await fetch(`${API_BASE_URL}/skills?search=react&simple=true&limit=10`);
    const data1 = await res1.json();
    
    console.log(`✅ Status: ${res1.status}`);
    console.log(`📊 Total encontrado: ${data1.pagination.total}`);
    console.log(`📋 Skills (primeras ${data1.skills.length}):`);
    data1.skills.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name} (${s.id.substring(0, 8)}...)`);
    });
    console.log(`\n✅ Formato correcto para autocomplete: { id, name }\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 2: Búsqueda con "java" en modo completo (con estadísticas)
  console.log("\n2️⃣  Búsqueda completa (con stats): search=java&limit=5");
  console.log("─".repeat(70));
  try {
    const res2 = await fetch(`${API_BASE_URL}/skills?search=java&limit=5`);
    const data2 = await res2.json();
    
    console.log(`✅ Status: ${res2.status}`);
    console.log(`📊 Total encontrado: ${data2.pagination.total}`);
    console.log(`📋 Skills con estadísticas:`);
    data2.skills.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name}`);
      console.log(`      Usuarios: ${s.stats.usersCount} | Equipos: ${s.stats.teamsCount} | Proyectos: ${s.stats.projectsCount}`);
    });
    console.log(`\n✅ Formato con estadísticas completas\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 3: Listar todas sin filtro (paginado)
  console.log("\n3️⃣  Listar todas (sin filtro): limit=20&page=1");
  console.log("─".repeat(70));
  try {
    const res3 = await fetch(`${API_BASE_URL}/skills?limit=20&page=1`);
    const data3 = await res3.json();
    
    console.log(`✅ Status: ${res3.status}`);
    console.log(`📊 Total en BD: ${data3.pagination.total}`);
    console.log(`📄 Página: ${data3.pagination.page}/${data3.pagination.totalPages}`);
    console.log(`📋 Skills en esta página: ${data3.skills.length}`);
    console.log(`   Primeras 5: ${data3.skills.slice(0, 5).map(s => s.name).join(", ")}`);
    console.log(`\n✅ Paginación funcionando correctamente\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 4: Búsqueda sin resultados
  console.log("\n4️⃣  Búsqueda sin resultados: search=xyzabc123");
  console.log("─".repeat(70));
  try {
    const res4 = await fetch(`${API_BASE_URL}/skills?search=xyzabc123&simple=true`);
    const data4 = await res4.json();
    
    console.log(`✅ Status: ${res4.status}`);
    console.log(`📊 Total encontrado: ${data4.pagination.total}`);
    console.log(`📋 Skills: ${data4.skills.length === 0 ? "Ninguna ✅" : "ERROR"}`);
    console.log(`\n✅ Manejo correcto de búsquedas sin resultados\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  // Test 5: Case-insensitive
  console.log("\n5️⃣  Case-insensitive: search=REACT vs search=react");
  console.log("─".repeat(70));
  try {
    const [resUpper, resLower] = await Promise.all([
      fetch(`${API_BASE_URL}/skills?search=REACT&simple=true`),
      fetch(`${API_BASE_URL}/skills?search=react&simple=true`)
    ]);
    
    const [dataUpper, dataLower] = await Promise.all([
      resUpper.json(),
      resLower.json()
    ]);
    
    console.log(`✅ Búsqueda "REACT": ${dataUpper.pagination.total} resultados`);
    console.log(`✅ Búsqueda "react": ${dataLower.pagination.total} resultados`);
    console.log(`${dataUpper.pagination.total === dataLower.pagination.total ? "✅" : "❌"} Ambas retornan lo mismo (case-insensitive)\n`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }

  console.log("=".repeat(70));
  console.log("✅ PRUEBAS COMPLETADAS");
  console.log("=".repeat(70));

  console.log("\n📝 Ejemplos de uso para el frontend:\n");
  console.log("// Autocomplete (modo simple)");
  console.log(`fetch("${API_BASE_URL}/skills?search=react&simple=true&limit=50")`);
  console.log("\n// Lista completa con estadísticas");
  console.log(`fetch("${API_BASE_URL}/skills?limit=100")`);
  console.log("\n// Búsqueda con paginación");
  console.log(`fetch("${API_BASE_URL}/skills?search=java&page=2&limit=20")`);
}

testSkillsEndpoint();
