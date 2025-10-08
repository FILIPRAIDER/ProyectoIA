// Script para agregar la columna joinedAt directamente a la base de datos
import { prisma } from '../src/lib/prisma.js';

async function addJoinedAtColumn() {
  try {
    console.log('🔧 Agregando columna joinedAt a TeamMember...\n');

    // Ejecutar el ALTER TABLE
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "TeamMember" 
      ADD COLUMN IF NOT EXISTS "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    `);

    console.log('✅ Columna joinedAt agregada correctamente\n');

    // Verificar que se agregó
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'TeamMember' AND column_name = 'joinedAt';
    `);

    console.log('📋 Información de la columna:');
    console.table(result);

    // Contar cuántos registros tienen joinedAt
    const count = await prisma.teamMember.count();
    console.log(`\n✅ Total de miembros de equipo: ${count}`);

    // Mostrar algunos ejemplos
    if (count > 0) {
      const samples = await prisma.teamMember.findMany({
        take: 3,
        include: {
          user: { select: { name: true, email: true } },
          team: { select: { name: true } }
        }
      });

      console.log('\n📊 Ejemplos de registros con joinedAt:');
      samples.forEach(m => {
        console.log(`  - ${m.user.name} en ${m.team.name}: ${m.joinedAt?.toISOString() || 'N/A'}`);
      });
    }

    console.log('\n🎉 ¡Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addJoinedAtColumn();
