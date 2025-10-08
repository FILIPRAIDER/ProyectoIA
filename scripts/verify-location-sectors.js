// Script para verificar los nuevos endpoints
import { prisma } from '../src/lib/prisma.js';

console.log('🧪 Verificando nueva implementación de ubicación y sectores\n');
console.log('═══════════════════════════════════════════════════════════\n');

async function verify() {
  try {
    // 1. Verificar tabla Sector
    console.log('1️⃣  Verificando tabla Sector...');
    const sectorCount = await prisma.sector.count();
    console.log(`   ✅ ${sectorCount} sectores en la base de datos\n`);

    // 2. Verificar algunos sectores
    console.log('2️⃣  Primeros 5 sectores:');
    const sectors = await prisma.sector.findMany({
      take: 5,
      orderBy: { order: 'asc' },
      select: { icon: true, nameEs: true, nameEn: true, name: true },
    });
    sectors.forEach(s => {
      console.log(`   ${s.icon} ${s.nameEs} (${s.nameEn}) - slug: ${s.name}`);
    });
    console.log();

    // 3. Verificar estructura de MemberProfile
    console.log('3️⃣  Verificando estructura de MemberProfile...');
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'MemberProfile'
      ORDER BY ordinal_position;
    `);
    
    const columnNames = columns.map(c => c.column_name);
    const hasCountry = columnNames.includes('country');
    const hasCity = columnNames.includes('city');
    const hasAddress = columnNames.includes('address');
    const hasSectorId = columnNames.includes('sectorId');
    
    console.log(`   ${hasCountry ? '✅' : '❌'} Campo 'country' ${hasCountry ? 'existe' : 'NO existe'}`);
    console.log(`   ${hasCity ? '✅' : '❌'} Campo 'city' ${hasCity ? 'existe' : 'NO existe'}`);
    console.log(`   ${hasAddress ? '✅' : '❌'} Campo 'address' ${hasAddress ? 'existe' : 'NO existe'}`);
    console.log(`   ${hasSectorId ? '✅' : '❌'} Campo 'sectorId' ${hasSectorId ? 'existe' : 'NO existe'}`);
    console.log();

    // 4. Verificar skills
    console.log('4️⃣  Verificando skills...');
    const skillCount = await prisma.skill.count();
    console.log(`   ✅ ${skillCount} skills en la base de datos\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN:\n');
    console.log(`   • Sectores: ${sectorCount} ✅`);
    console.log(`   • Skills: ${skillCount} ✅`);
    console.log(`   • Campos ubicación: ${hasCountry && hasCity && hasAddress ? 'OK ✅' : 'ERROR ❌'}`);
    console.log(`   • Campo sectorId: ${hasSectorId ? 'OK ✅' : 'ERROR ❌'}`);
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n🎉 Verificación completada!\n');
    console.log('📝 Próximos pasos:');
    console.log('   1. Iniciar el servidor: npm run dev');
    console.log('   2. Probar endpoints:');
    console.log('      • GET /meta/sectors');
    console.log('      • GET /meta/countries');
    console.log('      • GET /meta/cities/CO');
    console.log('      • GET /meta/stacks');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verify();
