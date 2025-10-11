import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/bridge_dev'
    }
  }
});

async function main() {
  try {
    console.log('🔍 VERIFICANDO BASE DE DATOS LOCAL...\n');
    
    // Verificar si las columnas existen
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'TeamSkill' 
      AND column_name IN ('level', 'yearsExperience')
      ORDER BY column_name;
    `;
    
    console.log('Columnas encontradas:', JSON.stringify(columns, null, 2));
    
    if (columns.length < 2) {
      console.log('\n❌ Faltan columnas en local');
      return;
    }
    
    // Contar TeamSkills totales
    const totalCount = await prisma.teamSkill.count();
    console.log(`\n📊 Total TeamSkills: ${totalCount}`);
    
    // Contar con valores NULL
    const nullLevels = await prisma.teamSkill.count({
      where: { level: null }
    });
    
    const nullYears = await prisma.teamSkill.count({
      where: { yearsExperience: null }
    });
    
    console.log(`   - Con level NULL: ${nullLevels}`);
    console.log(`   - Con yearsExperience NULL: ${nullYears}`);
    
    if (nullLevels > 0 || nullYears > 0) {
      console.log('\n⚠️ Hay TeamSkills con valores NULL que necesitan ser asignados');
      
      // Mostrar algunos ejemplos
      const examples = await prisma.teamSkill.findMany({
        where: {
          OR: [
            { level: null },
            { yearsExperience: null }
          ]
        },
        take: 5,
        include: {
          skill: true,
          team: true
        }
      });
      
      console.log('\n📋 Ejemplos de TeamSkills con NULL:');
      examples.forEach(ts => {
        console.log(`   - Team: ${ts.team.name}, Skill: ${ts.skill.name}, level: ${ts.level}, years: ${ts.yearsExperience}`);
      });
    } else {
      console.log('\n✅ Todos los TeamSkills tienen valores asignados');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Código:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
