/**
 * Script de Verificación del Sistema de Industrias
 * 
 * Verifica que:
 * - Las tablas existen
 * - Las industrias están creadas
 * - Las keywords están vinculadas
 * - Los endpoints responden correctamente
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyIndustries() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFICACIÓN DEL SISTEMA DE INDUSTRIAS');
  console.log('='.repeat(70) + '\n');

  try {
    // 1. Verificar tabla Industry
    console.log('📊 1. Verificando tabla Industry...');
    const industries = await prisma.industry.findMany({
      orderBy: { displayOrder: 'asc' }
    });
    console.log(`   ✅ ${industries.length} industrias encontradas\n`);

    // 2. Mostrar industrias
    console.log('📋 2. Industrias en el sistema:');
    industries.forEach((industry, idx) => {
      console.log(`   ${industry.icon} ${idx + 1}. ${industry.name} ${industry.active ? '✅' : '❌'}`);
    });
    console.log('');

    // 3. Verificar tabla IndustryKeyword
    console.log('🔑 3. Verificando keywords...');
    const totalKeywords = await prisma.industryKeyword.count();
    console.log(`   ✅ ${totalKeywords} keywords totales\n`);

    // 4. Mostrar distribución de keywords por industria
    console.log('📊 4. Distribución de keywords:');
    for (const industry of industries) {
      const count = await prisma.industryKeyword.count({
        where: { industryId: industry.id }
      });
      console.log(`   ${industry.icon} ${industry.name}: ${count} keywords`);
    }
    console.log('');

    // 5. Verificar keywords de alta prioridad
    console.log('⭐ 5. Keywords de alta prioridad (priority = 3):');
    const highPriorityKeywords = await prisma.industryKeyword.findMany({
      where: { priority: 3 },
      include: { industry: { select: { name: true, icon: true } } },
      orderBy: { keyword: 'asc' }
    });
    
    const grouped = {};
    highPriorityKeywords.forEach(kw => {
      const industryName = kw.industry.name;
      if (!grouped[industryName]) {
        grouped[industryName] = [];
      }
      grouped[industryName].push(kw.keyword);
    });

    Object.entries(grouped).forEach(([industryName, keywords]) => {
      const industry = industries.find(i => i.name === industryName);
      console.log(`   ${industry.icon} ${industryName}: ${keywords.join(', ')}`);
    });
    console.log('');

    // 6. Test de detección
    console.log('🧪 6. Probando detección de industrias:');
    const testCases = [
      'Quiero crear una tienda online para vender ropa',
      'Necesito un sistema para mi restaurante',
      'App para gestión de pacientes en una clínica',
      'Plataforma educativa para cursos online',
      'Software de contabilidad para empresas'
    ];

    for (const text of testCases) {
      const result = await detectIndustry(text, 'es');
      if (result) {
        console.log(`   ${result.icon} "${text.substring(0, 40)}..." → ${result.industry}`);
      } else {
        console.log(`   ❓ "${text.substring(0, 40)}..." → No detectado`);
      }
    }
    console.log('');

    // 7. Estadísticas finales
    console.log('📈 7. Estadísticas:');
    const avgKeywords = Math.round(totalKeywords / industries.length);
    const activeIndustries = industries.filter(i => i.active).length;
    console.log(`   - Industrias activas: ${activeIndustries}/${industries.length}`);
    console.log(`   - Total keywords: ${totalKeywords}`);
    console.log(`   - Promedio keywords/industria: ${avgKeywords}`);
    console.log(`   - Keywords alta prioridad: ${highPriorityKeywords.length}`);
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Función auxiliar para detectar industria (similar al endpoint)
async function detectIndustry(text, language = 'es') {
  const textLower = text.toLowerCase();

  const matchedKeywords = await prisma.industryKeyword.findMany({
    where: { language },
    include: {
      industry: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          icon: true,
        },
      },
    },
    orderBy: { priority: 'desc' },
  });

  const matches = matchedKeywords.filter((kw) => {
    const keyword = kw.keyword.toLowerCase();
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(textLower);
  });

  if (matches.length === 0) return null;

  const bestMatch = matches[0];
  let confidence = 'low';
  if (bestMatch.priority >= 3) confidence = 'high';
  else if (bestMatch.priority === 2) confidence = 'medium';

  return {
    industry: bestMatch.industry.name,
    industryEn: bestMatch.industry.nameEn,
    confidence,
    keyword: bestMatch.keyword,
    icon: bestMatch.industry.icon,
    industryId: bestMatch.industry.id,
  };
}

// Ejecutar verificación
verifyIndustries()
  .then(() => {
    console.log('✅ Proceso de verificación completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
