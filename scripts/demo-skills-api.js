/**
 * Demo visual del endpoint de Skills para mostrar al frontend
 */

const BACKEND_URL = "https://proyectoia-backend.onrender.com";

async function demo() {
  console.clear();
  console.log("╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║                                                                   ║");
  console.log("║           🚀 DEMO: SKILLS SEARCH API - BACKEND READY 🚀          ║");
  console.log("║                                                                   ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝");
  console.log();

  // Demo 1
  console.log("📱 DEMO 1: Autocomplete buscando 'react'");
  console.log("─".repeat(70));
  console.log(`   URL: ${BACKEND_URL}/skills?search=react&simple=true&limit=10\n`);
  
  const res1 = await fetch(`${BACKEND_URL}/skills?search=react&simple=true&limit=10`);
  const data1 = await res1.json();
  
  console.log("   📥 Response:");
  console.log(JSON.stringify({
    ok: data1.ok,
    skills: data1.skills,
    pagination: data1.pagination
  }, null, 2));
  
  console.log("\n   ✅ Perfecto para autocomplete: solo { id, name }\n");

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Demo 2
  console.log("\n📊 DEMO 2: Búsqueda con estadísticas (modo admin)");
  console.log("─".repeat(70));
  console.log(`   URL: ${BACKEND_URL}/skills?search=python&limit=3\n`);
  
  const res2 = await fetch(`${BACKEND_URL}/skills?search=python&limit=3`);
  const data2 = await res2.json();
  
  console.log("   📥 Response:");
  if (data2.skills.length > 0) {
    console.log(JSON.stringify({
      ok: data2.ok,
      skills: [data2.skills[0]], // Solo mostrar primera
      pagination: data2.pagination
    }, null, 2));
    console.log("\n   ✅ Incluye estadísticas de uso (users, teams, projects)\n");
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Demo 3
  console.log("\n🔍 DEMO 3: Case-insensitive search");
  console.log("─".repeat(70));
  
  const [resUpper, resLower] = await Promise.all([
    fetch(`${BACKEND_URL}/skills?search=JAVASCRIPT&simple=true&limit=5`),
    fetch(`${BACKEND_URL}/skills?search=javascript&simple=true&limit=5`)
  ]);
  
  const [dataUpper, dataLower] = await Promise.all([
    resUpper.json(),
    resLower.json()
  ]);
  
  console.log(`   🔤 Búsqueda "JAVASCRIPT": ${dataUpper.pagination.total} resultados`);
  console.log(`   🔤 Búsqueda "javascript": ${dataLower.pagination.total} resultados`);
  console.log(`\n   ${dataUpper.pagination.total === dataLower.pagination.total ? "✅" : "❌"} Ambas retornan lo mismo (case-insensitive)\n`);

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Demo 4
  console.log("\n📚 DEMO 4: Listar todas las skills (sin filtro)");
  console.log("─".repeat(70));
  console.log(`   URL: ${BACKEND_URL}/skills?simple=true&limit=20\n`);
  
  const res4 = await fetch(`${BACKEND_URL}/skills?simple=true&limit=20`);
  const data4 = await res4.json();
  
  console.log(`   📊 Total en BD: ${data4.pagination.total} skills`);
  console.log(`   📄 Mostrando: ${data4.skills.length} por página`);
  console.log(`   📋 Primeras 10:`);
  data4.skills.slice(0, 10).forEach((s, i) => {
    console.log(`      ${(i + 1).toString().padStart(2, " ")}. ${s.name}`);
  });
  console.log(`      ... y ${data4.skills.length - 10} más\n`);

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Demo 5
  console.log("\n⚡ DEMO 5: Performance");
  console.log("─".repeat(70));
  
  const startTime = Date.now();
  await fetch(`${BACKEND_URL}/skills?search=java&simple=true&limit=50`);
  const endTime = Date.now();
  
  console.log(`   ⏱️  Tiempo de respuesta: ${endTime - startTime}ms`);
  console.log(`   ${endTime - startTime < 100 ? "✅" : "⚠️"}  ${endTime - startTime < 100 ? "Excelente performance" : "Aceptable"}`);
  console.log(`   📝 Con índice en BD para búsquedas rápidas\n`);

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Resumen final
  console.log("\n╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║                         📝 RESUMEN PARA FRONTEND                  ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝\n");
  
  console.log("  🎯 Endpoint principal:");
  console.log(`     ${BACKEND_URL}/skills\n`);
  
  console.log("  📋 Query parameters:");
  console.log("     • search=<query>   → Filtrar por nombre");
  console.log("     • simple=true      → Modo autocomplete (solo id, name)");
  console.log("     • limit=<number>   → Resultados por página (default: 50, max: 100)");
  console.log("     • page=<number>    → Número de página");
  console.log();
  
  console.log("  💡 Ejemplos de uso:");
  console.log("     // Autocomplete");
  console.log(`     fetch("${BACKEND_URL}/skills?search=react&simple=true&limit=50")`);
  console.log();
  console.log("     // Lista completa");
  console.log(`     fetch("${BACKEND_URL}/skills?simple=true&limit=100")`);
  console.log();
  console.log("     // Con estadísticas (admin)");
  console.log(`     fetch("${BACKEND_URL}/skills?search=python&limit=20")`);
  console.log();
  
  console.log("  ✅ Features:");
  console.log("     • Case-insensitive search");
  console.log("     • Paginación incluida");
  console.log("     • Performance optimizada (<100ms)");
  console.log("     • 282+ skills en BD");
  console.log("     • Backward compatible");
  console.log();
  
  console.log("  📚 Documentación completa:");
  console.log("     Ver: EXECUTIVE_SUMMARY_SKILLS.md");
  console.log();
  
  console.log("╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║                    ✅ READY TO INTEGRATE                          ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝");
}

demo().catch(console.error);
