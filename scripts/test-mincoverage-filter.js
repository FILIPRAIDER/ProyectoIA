import { PrismaClient } from '@prisma/client';
import { computeCandidates } from '../src/services/matching.service.js';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/bridge_dev'
    }
  }
});

async function main() {
  try {
    const projectId = 'cmglvowz40001n5jgan5tle1q';
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        skills: { include: { skill: true } }
      }
    });
    
    if (!project) {
      console.log('❌ Proyecto no encontrado');
      return;
    }
    
    console.log('🔍 TESTING FILTRO minCoverage\n');
    console.log(`Proyecto: ${project.title}`);
    console.log(`Total skills: ${project.skills.length}\n`);
    
    // Test con minCoverage = 0.4 (40%)
    console.log('Test: minCoverage = 0.4 (40%)\n');
    
    const { candidates, filtersApplied } = await computeCandidates({
      prisma,
      project,
      top: 10,
      explain: false,
      minCoverage: 0.4,
      requireArea: false,
      requireCity: false
    });
    
    console.log(`Filtros aplicados: ${filtersApplied.join(', ')}\n`);
    console.log(`Equipos encontrados: ${candidates.length}\n`);
    
    candidates.forEach(team => {
      const coverage = team.breakdown.skillCoverage;
      const passesFilter = coverage >= 40;
      const symbol = passesFilter ? '✅' : '❌';
      
      console.log(`${symbol} ${team.teamName}`);
      console.log(`   skillCoverage: ${coverage}%`);
      console.log(`   matchScore: ${team.score} pts`);
      console.log(`   _coverage01: ${team._coverage01 || 'N/A'}`);
      console.log(`   Debería pasar filtro (>= 40%): ${passesFilter ? 'SÍ' : 'NO'}`);
      console.log('');
    });
    
    // Verificar si el filtro está funcionando
    const wronglyIncluded = candidates.filter(t => t.breakdown.skillCoverage < 40);
    
    if (wronglyIncluded.length > 0) {
      console.log('🐛 BUG DETECTADO:');
      console.log(`   ${wronglyIncluded.length} equipos con < 40% fueron incluidos incorrectamente:`);
      wronglyIncluded.forEach(t => {
        console.log(`   - ${t.teamName}: ${t.breakdown.skillCoverage}%`);
      });
    } else {
      console.log('✅ Filtro funcionando correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
