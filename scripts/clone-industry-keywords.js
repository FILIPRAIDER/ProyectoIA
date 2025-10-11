#!/usr/bin/env node

/**
 * 📋 Script para clonar Industry e IndustryKeyword desde producción a local
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

// Cliente para producción
const prismaProduction = new PrismaClient({
  datasources: {
    db: {
      url: process.env.PRODUCTION_DATABASE_URL
    }
  }
});

// Cliente para local
const prismaLocal = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function cloneIndustryData() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 CLONANDO INDUSTRY E INDUSTRY KEYWORDS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Obtener datos de producción
    console.log('📡 Conectando a producción (Neon)...');
    const industriesProduction = await prismaProduction.industry.findMany({
      include: {
        keywords: true
      }
    });
    console.log(`✅ ${industriesProduction.length} industries encontradas en producción\n`);

    // 2. Limpiar datos existentes en local
    console.log('🧹 Limpiando datos existentes en local...');
    await prismaLocal.industryKeyword.deleteMany({});
    console.log('✅ IndustryKeywords eliminados');
    
    await prismaLocal.industry.deleteMany({});
    console.log('✅ Industries eliminados\n');

    // 3. Clonar industries
    console.log('📋 Clonando Industries...');
    let industriesCloned = 0;
    let keywordsCloned = 0;

    for (const industry of industriesProduction) {
      // Crear industry
      await prismaLocal.industry.create({
        data: {
          id: industry.id,
          name: industry.name,
          nameEn: industry.nameEn,
          description: industry.description,
          icon: industry.icon,
          active: industry.active,
          displayOrder: industry.displayOrder,
          createdAt: industry.createdAt,
          updatedAt: industry.updatedAt
        }
      });
      industriesCloned++;

      // Crear keywords asociados
      if (industry.keywords && industry.keywords.length > 0) {
        for (const keyword of industry.keywords) {
          await prismaLocal.industryKeyword.create({
            data: {
              id: keyword.id,
              industryId: keyword.industryId,
              keyword: keyword.keyword,
              language: keyword.language,
              priority: keyword.priority,
              createdAt: keyword.createdAt
            }
          });
          keywordsCloned++;
        }
      }

      console.log(`✅ ${industry.icon || '📋'} ${industry.name} (${industry.keywords?.length || 0} keywords)`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN DE CLONACIÓN:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ✅ Industries clonados: ${industriesCloned}`);
    console.log(`   ✅ Keywords clonados: ${keywordsCloned}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 4. Verificar en local
    const localIndustries = await prismaLocal.industry.count();
    const localKeywords = await prismaLocal.industryKeyword.count();
    
    console.log('✅ Verificación:');
    console.log(`   📋 Industries en local: ${localIndustries}`);
    console.log(`   🔤 Keywords en local: ${localKeywords}\n`);

    if (localIndustries === industriesProduction.length) {
      console.log('✅ CLONACIÓN EXITOSA - Todos los datos fueron copiados\n');
    } else {
      console.log('⚠️  ADVERTENCIA - Puede haber diferencias en los datos\n');
    }

  } catch (error) {
    console.error('\n❌ Error durante la clonación:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await prismaProduction.$disconnect();
    await prismaLocal.$disconnect();
  }
}

// Ejecutar
console.log('\n📋 Clonando Industry e IndustryKeyword de producción a local...');
console.log('⏳ Iniciando en 2 segundos... (Ctrl+C para cancelar)\n');

setTimeout(() => {
  cloneIndustryData()
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}, 2000);
