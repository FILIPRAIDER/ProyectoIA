#!/usr/bin/env node

/**
 * 🧹 Script para limpiar SOLO los datos de prueba de matching
 * 
 * Este script elimina únicamente:
 * - TechStart Colombia y sus datos relacionados
 * - Usuarios de prueba (empresario@test.com, lider1-3@test.com, estudiante1-9@test.com)
 * - Equipos de prueba (DevTeam Frontend, Backend, FullStack)
 * - Proyectos de prueba
 * 
 * IMPORTANTE: NO toca los datos de producción clonados
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestData() {
  console.log('🧹 Limpiando datos de prueba de matching...\n');

  try {
    // Buscar la empresa de prueba
    const testCompany = await prisma.company.findFirst({
      where: { name: 'TechStart Colombia' }
    });

    if (!testCompany) {
      console.log('ℹ️  No se encontraron datos de prueba para limpiar');
      return;
    }

    console.log(`📍 Encontrada empresa de prueba: ${testCompany.name} (${testCompany.id})\n`);

    // Buscar equipos de prueba
    const testTeams = await prisma.team.findMany({
      where: {
        name: {
          in: ['DevTeam Frontend', 'DevTeam Backend', 'DevTeam FullStack']
        }
      }
    });
    const testTeamIds = testTeams.map(t => t.id);
    console.log(`📍 Encontrados ${testTeams.length} equipos de prueba\n`);

    // Buscar usuarios de prueba
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'empresario@test.com' },
          { email: { startsWith: 'lider' } },
          { email: { startsWith: 'estudiante' } }
        ]
      }
    });
    const testUserIds = testUsers.map(u => u.id);
    console.log(`📍 Encontrados ${testUsers.length} usuarios de prueba\n`);

    // LIMPIEZA EN ORDEN (por foreign keys)
    console.log('🗑️  Iniciando limpieza...\n');

    // 1. ProjectSkill
    const deletedProjectSkills = await prisma.projectSkill.deleteMany({
      where: { project: { companyId: testCompany.id } }
    });
    console.log(`✅ ${deletedProjectSkills.count} project skills eliminados`);

    // 2. Proyectos
    const deletedProjects = await prisma.project.deleteMany({
      where: { companyId: testCompany.id }
    });
    console.log(`✅ ${deletedProjects.count} proyectos eliminados`);

    // 3. TeamSkill
    const deletedTeamSkills = await prisma.teamSkill.deleteMany({
      where: { teamId: { in: testTeamIds } }
    });
    console.log(`✅ ${deletedTeamSkills.count} team skills eliminados`);

    // 4. TeamMember
    const deletedTeamMembers = await prisma.teamMember.deleteMany({
      where: { teamId: { in: testTeamIds } }
    });
    console.log(`✅ ${deletedTeamMembers.count} team members eliminados`);

    // 5. Teams
    const deletedTeams = await prisma.team.deleteMany({
      where: { id: { in: testTeamIds } }
    });
    console.log(`✅ ${deletedTeams.count} equipos eliminados`);

    // 6. UserSkill
    const deletedUserSkills = await prisma.userSkill.deleteMany({
      where: { userId: { in: testUserIds } }
    });
    console.log(`✅ ${deletedUserSkills.count} user skills eliminados`);

    // 7. MemberProfile
    const deletedProfiles = await prisma.memberProfile.deleteMany({
      where: { userId: { in: testUserIds } }
    });
    console.log(`✅ ${deletedProfiles.count} perfiles eliminados`);

    // 8. Certification
    const deletedCerts = await prisma.certification.deleteMany({
      where: { userId: { in: testUserIds } }
    });
    console.log(`✅ ${deletedCerts.count} certificaciones eliminadas`);

    // 9. Experience
    const deletedExperiences = await prisma.experience.deleteMany({
      where: { userId: { in: testUserIds } }
    });
    console.log(`✅ ${deletedExperiences.count} experiencias eliminadas`);

    // 10. Usuarios
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: testUserIds } }
    });
    console.log(`✅ ${deletedUsers.count} usuarios eliminados`);

    // 11. Empresa
    const deletedCompany = await prisma.company.delete({
      where: { id: testCompany.id }
    });
    console.log(`✅ Empresa eliminada: ${deletedCompany.name}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ LIMPIEZA COMPLETA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('ℹ️  Los datos de producción siguen intactos');
    console.log('ℹ️  Puedes volver a agregar datos de prueba con:');
    console.log('   node scripts/add-test-matching-data.js\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestData()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  });
