/**
 * Script de verificación: Revisar estado de budgetCurrency en proyectos
 * 
 * USO:
 * node scripts/verify-budget-currency.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyBudgetCurrency() {
  console.log('🔍 Verificando estado de budgetCurrency en proyectos...\n');

  try {
    // Total de proyectos
    const totalProjects = await prisma.project.count();
    console.log(`📊 Total de proyectos: ${totalProjects}`);

    // Todos los proyectos tienen budgetCurrency porque es NOT NULL con DEFAULT
    console.log(`✅ Todos los proyectos tienen budgetCurrency (campo NOT NULL con default 'COP')`);

    // Distribución por moneda
    const currencyDistribution = await prisma.$queryRaw`
      SELECT "budgetCurrency", COUNT(*) as count
      FROM "Project"
      GROUP BY "budgetCurrency"
      ORDER BY count DESC
    `;

    console.log('\n💱 Distribución por moneda:');
    currencyDistribution.forEach(row => {
      const currency = row.budgetCurrency || 'NULL/EMPTY';
      const percentage = ((Number(row.count) / totalProjects) * 100).toFixed(1);
      console.log(`   - ${currency}: ${row.count} proyectos (${percentage}%)`);
    });

    // Ejemplos de proyectos
    console.log('\n📋 Muestra de proyectos (primeros 5):');
    const sampleProjects = await prisma.project.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        budget: true,
        budgetCurrency: true,
        status: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    sampleProjects.forEach(project => {
      console.log(`\n   ID: ${project.id}`);
      console.log(`   Título: ${project.title}`);
      console.log(`   Presupuesto: ${project.budget || 'N/A'}`);
      console.log(`   Moneda: ${project.budgetCurrency || 'NO ASIGNADO'}`);
      console.log(`   Estado: ${project.status}`);
    });

    // Contar proyectos con COP
    const copCount = await prisma.project.count({
      where: { budgetCurrency: 'COP' }
    });

    // Contar proyectos con USD
    const usdCount = await prisma.project.count({
      where: { budgetCurrency: 'USD' }
    });

    // Verificar si hay proyectos con monedas inválidas
    const invalidCurrencies = await prisma.project.findMany({
      where: {
        AND: [
          { budgetCurrency: { not: 'COP' } },
          { budgetCurrency: { not: 'USD' } }
        ]
      },
      select: {
        id: true,
        title: true,
        budgetCurrency: true
      }
    });

    console.log(`\n💰 Proyectos con COP: ${copCount}`);
    console.log(`💵 Proyectos con USD: ${usdCount}`);

    if (invalidCurrencies.length > 0) {
      console.log('\n⚠️  ADVERTENCIA: Proyectos con monedas inválidas:');
      invalidCurrencies.forEach(project => {
        console.log(`   - ${project.id}: ${project.title} → "${project.budgetCurrency}"`);
      });
    } else {
      console.log('⚠️  Proyectos con monedas inválidas: 0');
      console.log('\n✅ Todos los proyectos tienen monedas válidas (COP o USD)');
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar verificación
verifyBudgetCurrency()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
