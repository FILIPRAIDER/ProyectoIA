/**
 * Script para verificar el equipo de prueba
 * Uso: node scripts/verify-test-team.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTestTeam() {
  console.log('🔍 Verificando equipo de prueba...\n');

  try {
    // Buscar el equipo por nombre
    const team = await prisma.team.findFirst({
      where: { name: 'DevTeam Colombia' },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        skills: {
          include: {
            skill: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      console.log('❌ No se encontró el equipo "DevTeam Colombia"');
      console.log('   Ejecuta: node prisma/seed-test-team.js');
      return;
    }

    console.log('✅ Equipo encontrado!');
    console.log('');
    console.log('📋 INFORMACIÓN DEL EQUIPO:');
    console.log('  ID:', team.id);
    console.log('  Nombre:', team.name);
    console.log('  Ciudad:', team.city);
    console.log('  Área:', team.area);
    console.log('  Descripción:', team.description);
    console.log('');

    console.log('👥 MIEMBROS (' + team.members.length + '):');
    team.members.forEach((member, index) => {
      console.log(`  ${index + 1}. ${member.user.name} (${member.user.email})`);
      console.log(`     Rol: ${member.role}`);
      console.log(`     User ID: ${member.user.id}`);
    });
    console.log('');

    console.log('🔧 SKILLS (' + team.skills.length + '):');
    const skillsByCategory = {};
    team.skills.forEach(ts => {
      // Categorizar skills por nombre (simplificado)
      let category = 'Other';
      const skillName = ts.skill.name;
      
      if (['React', 'Vue.js', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Next.js', 'Redux'].includes(skillName)) {
        category = 'Frontend';
      } else if (['Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'REST API', 'GraphQL', 'Prisma', 'NestJS'].includes(skillName)) {
        category = 'Backend';
      } else if (['React Native', 'Flutter'].includes(skillName)) {
        category = 'Mobile';
      } else if (['AWS', 'Docker', 'Git', 'CI/CD', 'Kubernetes'].includes(skillName)) {
        category = 'DevOps';
      } else if (['Figma', 'Adobe XD', 'UI Design', 'UX Design', 'Sketch'].includes(skillName)) {
        category = 'Design';
      }
      
      if (!skillsByCategory[category]) {
        skillsByCategory[category] = [];
      }
      skillsByCategory[category].push(skillName);
    });

    Object.keys(skillsByCategory).sort().forEach(category => {
      console.log(`  ${category}:`);
      skillsByCategory[category].forEach(skill => {
        console.log(`    - ${skill}`);
      });
    });
    console.log('');

    console.log('🔗 ENDPOINTS PARA PROBAR:');
    console.log(`  GET  http://localhost:4001/teams/${team.id}`);
    console.log(`  GET  http://localhost:4001/teams?city=Bogotá`);
    console.log('');

    console.log('🧪 EJEMPLO DE REQUEST PARA MATCHING:');
    console.log('POST http://localhost:4001/matching/search-teams');
    console.log('Body:');
    console.log(JSON.stringify({
      skills: ['React', 'Node.js', 'PostgreSQL'],
      city: 'Bogotá',
      top: 5
    }, null, 2));
    console.log('');

    console.log('✅ Verificación completada!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar verificación
verifyTestTeam()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
