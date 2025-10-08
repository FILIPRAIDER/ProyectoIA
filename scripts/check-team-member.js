// Verificar estructura de TeamMember
import { prisma } from '../src/lib/prisma.js';

async function checkTeamMemberStructure() {
  try {
    console.log('🔍 Verificando estructura de TeamMember...\n');

    // Verificar si la tabla existe
    const tableExists = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'TeamMember'
      );
    `);
    
    console.log('Tabla TeamMember existe:', tableExists[0].exists);

    if (tableExists[0].exists) {
      // Mostrar columnas
      const columns = await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'TeamMember'
        ORDER BY ordinal_position;
      `);

      console.log('\n📋 Columnas de TeamMember:');
      console.table(columns);

      // Verificar específicamente joinedAt
      const hasJoinedAt = columns.some(col => col.column_name === 'joinedAt');
      console.log('\n✅ Tiene columna joinedAt:', hasJoinedAt);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeamMemberStructure();
