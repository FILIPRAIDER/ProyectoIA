import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 VERIFICANDO COLUMNAS EN PRODUCCIÓN...\n');
    
    // Verificar si las columnas existen
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'TeamSkill' 
      AND column_name IN ('level', 'yearsExperience')
      ORDER BY column_name;
    `;
    
    console.log('Columnas encontradas:', columns);
    
    if (columns.length === 0) {
      console.log('\n❌ Las columnas NO EXISTEN en producción');
      console.log('🔧 AGREGANDO COLUMNAS...\n');
      
      // Agregar columna level
      await prisma.$executeRaw`
        ALTER TABLE "TeamSkill" 
        ADD COLUMN IF NOT EXISTS level INT;
      `;
      console.log('✅ Columna "level" agregada');
      
      // Agregar columna yearsExperience
      await prisma.$executeRaw`
        ALTER TABLE "TeamSkill" 
        ADD COLUMN IF NOT EXISTS "yearsExperience" INT;
      `;
      console.log('✅ Columna "yearsExperience" agregada');
      
      // Verificar nuevamente
      const newColumns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'TeamSkill' 
        AND column_name IN ('level', 'yearsExperience')
        ORDER BY column_name;
      `;
      console.log('\n✅ Columnas ahora en producción:', newColumns);
    } else if (columns.length === 2) {
      console.log('\n✅ Ambas columnas ya existen en producción');
    } else {
      console.log('\n⚠️ Solo existe una columna, agregando la faltante...');
    }
    
    // Contar TeamSkills con valores NULL
    const nullCount = await prisma.teamSkill.count({
      where: {
        OR: [
          { level: null },
          { yearsExperience: null }
        ]
      }
    });
    
    console.log(`\n📊 TeamSkills con valores NULL: ${nullCount}`);
    
    if (nullCount > 0) {
      console.log('⏭️ Ejecutar fix-teamskill-levels.js para asignar valores');
    } else {
      console.log('✅ Todos los TeamSkills tienen valores asignados');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Código Prisma:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
