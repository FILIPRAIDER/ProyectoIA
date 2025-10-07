// Test del endpoint de skills con búsqueda
const API_URL = 'http://localhost:4001';

async function testSkillsEndpoint() {
  console.log('🧪 Testeando endpoint de Skills con búsqueda...\n');

  const tests = [
    {
      name: 'Todas las skills (primeras 10)',
      url: `${API_URL}/api/skills?limit=10`,
    },
    {
      name: 'Búsqueda: "react"',
      url: `${API_URL}/api/skills?search=react&limit=10`,
    },
    {
      name: 'Búsqueda: "python"',
      url: `${API_URL}/api/skills?search=python`,
    },
    {
      name: 'Búsqueda: "java" (case insensitive)',
      url: `${API_URL}/api/skills?search=JAVA`,
    },
    {
      name: 'Paginación: página 2',
      url: `${API_URL}/api/skills?page=2&limit=20`,
    },
    {
      name: 'Búsqueda: "design"',
      url: `${API_URL}/api/skills?search=design`,
    },
  ];

  for (const test of tests) {
    try {
      console.log(`📋 ${test.name}`);
      console.log(`   URL: ${test.url}`);

      const response = await fetch(test.url);
      const data = await response.json();

      if (data.ok) {
        console.log(`   ✅ Total encontradas: ${data.pagination.total}`);
        console.log(`   📄 Página: ${data.pagination.page}/${data.pagination.totalPages}`);
        console.log(`   🔍 Resultados en esta página: ${data.skills.length}`);

        if (data.skills.length > 0) {
          console.log(`   📌 Primeras 3 skills:`);
          data.skills.slice(0, 3).forEach((skill, i) => {
            console.log(
              `      ${i + 1}. ${skill.name} (${skill.stats.totalUsage} usos totales)`
            );
          });
        }
      } else {
        console.log(`   ❌ Error: ${data.error}`);
      }

      console.log('');
    } catch (error) {
      console.error(`   ❌ Error en request: ${error.message}\n`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Tests completados!\n');
}

// Ejecutar tests
testSkillsEndpoint().catch(console.error);
