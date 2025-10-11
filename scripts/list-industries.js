#!/usr/bin/env node

/**
 * 📋 Script para ver todas las Industries y sus Keywords
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listIndustries() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 INDUSTRIES E INDUSTRY KEYWORDS EN BASE DE DATOS LOCAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const industries = await prisma.industry.findMany({
    include: {
      keywords: {
        orderBy: {
          priority: 'desc'
        }
      }
    },
    orderBy: {
      displayOrder: 'asc'
    }
  });

  for (const industry of industries) {
    console.log(`${industry.icon || '📋'} ${industry.name}`);
    console.log(`   ID: ${industry.id}`);
    console.log(`   Name EN: ${industry.nameEn || 'N/A'}`);
    console.log(`   Descripción: ${industry.description || 'N/A'}`);
    console.log(`   Activa: ${industry.active ? '✅' : '❌'}`);
    console.log(`   Orden: ${industry.displayOrder}`);
    console.log(`   Keywords (${industry.keywords.length}):`);
    
    // Agrupar keywords por prioridad
    const highPriority = industry.keywords.filter(k => k.priority === 3);
    const medPriority = industry.keywords.filter(k => k.priority === 2);
    const lowPriority = industry.keywords.filter(k => k.priority === 1);

    if (highPriority.length > 0) {
      console.log(`      🔴 Alta prioridad: ${highPriority.map(k => k.keyword).join(', ')}`);
    }
    if (medPriority.length > 0) {
      console.log(`      🟡 Media prioridad: ${medPriority.map(k => k.keyword).join(', ')}`);
    }
    if (lowPriority.length > 0) {
      console.log(`      🟢 Baja prioridad: ${lowPriority.map(k => k.keyword).join(', ')}`);
    }
    
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 TOTAL: ${industries.length} industries, ${industries.reduce((acc, i) => acc + i.keywords.length, 0)} keywords`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
}

listIndustries();
