/**
 * Script de migración: Agregar budgetCurrency = 'COP' a proyectos existentes
 * 
 * ⚠️ EJECUTAR SOLO DESPUÉS DE:
 * 1. Aplicar migración de Prisma (npx prisma migrate dev)
 * 2. Verificar que el campo budgetCurrency existe en la tabla projects
 * 
 * USO:
 * node scripts/migrate-budget-currency.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateBudgetCurrency() {
  console.log('🔄 Iniciando migración de budgetCurrency...\n');

  try {
    // Contar proyectos sin budgetCurrency
    const countWithoutCurrency = await prisma.project.count({
      where: {
        OR: [
          { budgetCurrency: null },
          { budgetCurrency: '' }
        ]
      }
    });

    console.log(`📊 Proyectos sin budgetCurrency: ${countWithoutCurrency}`);

    if (countWithoutCurrency === 0) {
      console.log('✅ Todos los proyectos ya tienen budgetCurrency asignado.');
      return;
    }

    // Actualizar proyectos sin budgetCurrency → 'COP'
    const result = await prisma.project.updateMany({
      where: {
        OR: [
          { budgetCurrency: null },
          { budgetCurrency: '' }
        ]
      },
      data: {
        budgetCurrency: 'COP'
      }
    });

    console.log(`\n✅ Migración completada:`);
    console.log(`   - ${result.count} proyectos actualizados con budgetCurrency = 'COP'`);

    // Verificar resultado
    const remainingWithoutCurrency = await prisma.project.count({
      where: {
        OR: [
          { budgetCurrency: null },
          { budgetCurrency: '' }
        ]
      }
    });

    if (remainingWithoutCurrency === 0) {
      console.log(`   - ✅ Verificación: Todos los proyectos tienen budgetCurrency`);
    } else {
      console.log(`   - ⚠️  Advertencia: ${remainingWithoutCurrency} proyectos aún sin budgetCurrency`);
    }

    // Mostrar distribución de monedas
    const currencyDistribution = await prisma.$queryRaw`
      SELECT "budgetCurrency", COUNT(*) as count
      FROM "Project"
      GROUP BY "budgetCurrency"
      ORDER BY count DESC
    `;

    console.log('\n📊 Distribución de monedas después de la migración:');
    currencyDistribution.forEach(row => {
      console.log(`   - ${row.budgetCurrency || 'NULL'}: ${row.count} proyectos`);
    });

  } catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrateBudgetCurrency()
  .then(() => {
    console.log('\n🎉 Script de migración finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
