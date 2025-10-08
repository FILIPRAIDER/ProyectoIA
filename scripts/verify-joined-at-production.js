// Script para verificar que joinedAt está funcionando en producción

const PROD_URL = 'https://proyectoia-backend.onrender.com';

console.log('🔍 Verificando campo joinedAt en producción\n');
console.log('═══════════════════════════════════════════════════════════\n');

async function checkJoinedAt() {
  try {
    console.log('1️⃣  Backend en producción: ' + PROD_URL + '\n');
    
    // 2. Para verificar teams/members necesitarías un token y teamId válido
    console.log('2️⃣  Para verificar el endpoint completo necesitas:\n');
    console.log('   📋 Ejecutar desde el frontend o con un token válido:');
    console.log('   ```bash');
    console.log(`   curl -X GET \\`);
    console.log(`     ${PROD_URL}/teams/TEAM_ID/members \\`);
    console.log('     -H "Authorization: Bearer YOUR_TOKEN"');
    console.log('   ```\n');

    console.log('3️⃣  Verificar en la respuesta:');
    console.log('   ✅ Cada miembro debe tener el campo "joinedAt"');
    console.log('   ✅ Formato: "2025-10-07T15:00:00.000Z"');
    console.log('   ✅ No debe ser undefined o null\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📝 INSTRUCCIONES:\n');
    console.log('1. Espera a que Render termine el deploy (~3-5 minutos)');
    console.log('2. Ve al frontend y abre "Gestionar Miembros"');
    console.log('3. Verifica que las fechas se muestren correctamente');
    console.log('4. Si no aparecen, abre la consola del navegador y busca errores\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkJoinedAt();
