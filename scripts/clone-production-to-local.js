#!/usr/bin/env node

/**
 * 📦 Script para clonar base de datos de Neon (producción) a Local (Docker)
 * 
 * Este script:
 * 1. Exporta todos los datos de la base de datos en Neon
 * 2. Los importa en la base de datos local de Docker
 * 
 * Uso: node scripts/clone-production-to-local.js
 */

import { PrismaClient } from '@prisma/client';

// Cliente para producción (Neon)
const prismaProduction = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_sndjGQl23JRK@ep-morning-forest-aezf0ccr.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

// Cliente para local (Docker)
const prismaLocal = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/bridge_dev?schema=public'
    }
  }
});

async function cloneDatabase() {
  console.log('🔄 Iniciando clonación de base de datos...\n');
  console.log('📍 Origen: Neon (Producción)');
  console.log('📍 Destino: Docker PostgreSQL (Local)\n');

  try {
    // 1. LIMPIAR BASE DE DATOS LOCAL
    console.log('🧹 Limpiando base de datos local...');
    
    await prismaLocal.projectSkill.deleteMany();
    await prismaLocal.teamSkill.deleteMany();
    await prismaLocal.userSkill.deleteMany();
    await prismaLocal.notification.deleteMany();
    await prismaLocal.teamInvite.deleteMany();
    await prismaLocal.teamMember.deleteMany();
    await prismaLocal.experience.deleteMany();
    await prismaLocal.certification.deleteMany();
    await prismaLocal.memberProfile.deleteMany();
    await prismaLocal.project.deleteMany();
    await prismaLocal.team.deleteMany();
    await prismaLocal.user.deleteMany();
    await prismaLocal.company.deleteMany();
    await prismaLocal.skill.deleteMany();
    await prismaLocal.sector.deleteMany();
    
    console.log('✅ Base de datos local limpia\n');

    // 2. CLONAR SECTORES
    console.log('📋 Clonando Sectores...');
    const sectors = await prismaProduction.sector.findMany();
    for (const sector of sectors) {
      await prismaLocal.sector.create({ data: sector });
    }
    console.log(`✅ ${sectors.length} sectores clonados\n`);

    // 3. CLONAR SKILLS
    console.log('💡 Clonando Skills...');
    const skills = await prismaProduction.skill.findMany();
    for (const skill of skills) {
      await prismaLocal.skill.create({ data: skill });
    }
    console.log(`✅ ${skills.length} skills clonados\n`);

    // 4. CLONAR COMPANIES
    console.log('🏢 Clonando Companies...');
    const companies = await prismaProduction.company.findMany();
    for (const company of companies) {
      await prismaLocal.company.create({ data: company });
    }
    console.log(`✅ ${companies.length} empresas clonadas\n`);

    // 5. CLONAR USERS
    console.log('👥 Clonando Users...');
    const users = await prismaProduction.user.findMany();
    for (const user of users) {
      await prismaLocal.user.create({ data: user });
    }
    console.log(`✅ ${users.length} usuarios clonados\n`);

    // 6. CLONAR MEMBER PROFILES
    console.log('👤 Clonando Member Profiles...');
    const profiles = await prismaProduction.memberProfile.findMany();
    for (const profile of profiles) {
      await prismaLocal.memberProfile.create({ data: profile });
    }
    console.log(`✅ ${profiles.length} perfiles clonados\n`);

    // 7. CLONAR USER SKILLS
    console.log('🎯 Clonando User Skills...');
    const userSkills = await prismaProduction.userSkill.findMany();
    for (const userSkill of userSkills) {
      await prismaLocal.userSkill.create({ data: userSkill });
    }
    console.log(`✅ ${userSkills.length} user-skills clonados\n`);

    // 8. CLONAR CERTIFICATIONS
    console.log('📜 Clonando Certifications...');
    const certifications = await prismaProduction.certification.findMany();
    for (const cert of certifications) {
      await prismaLocal.certification.create({ data: cert });
    }
    console.log(`✅ ${certifications.length} certificaciones clonadas\n`);

    // 9. CLONAR EXPERIENCES
    console.log('💼 Clonando Experiences...');
    const experiences = await prismaProduction.experience.findMany();
    for (const exp of experiences) {
      await prismaLocal.experience.create({ data: exp });
    }
    console.log(`✅ ${experiences.length} experiencias clonadas\n`);

    // 10. CLONAR TEAMS
    console.log('👨‍👩‍👧‍👦 Clonando Teams...');
    const teams = await prismaProduction.team.findMany();
    for (const team of teams) {
      await prismaLocal.team.create({ data: team });
    }
    console.log(`✅ ${teams.length} equipos clonados\n`);

    // 11. CLONAR TEAM MEMBERS
    console.log('🤝 Clonando Team Members...');
    const teamMembers = await prismaProduction.teamMember.findMany();
    for (const member of teamMembers) {
      await prismaLocal.teamMember.create({ data: member });
    }
    console.log(`✅ ${teamMembers.length} miembros de equipo clonados\n`);

    // 12. CLONAR TEAM SKILLS
    console.log('⚡ Clonando Team Skills...');
    const teamSkills = await prismaProduction.teamSkill.findMany();
    for (const teamSkill of teamSkills) {
      await prismaLocal.teamSkill.create({ data: teamSkill });
    }
    console.log(`✅ ${teamSkills.length} team-skills clonados\n`);

    // 13. CLONAR PROJECTS
    console.log('📁 Clonando Projects...');
    const projects = await prismaProduction.project.findMany();
    for (const project of projects) {
      await prismaLocal.project.create({ data: project });
    }
    console.log(`✅ ${projects.length} proyectos clonados\n`);

    // 14. CLONAR PROJECT SKILLS
    console.log('🎨 Clonando Project Skills...');
    const projectSkills = await prismaProduction.projectSkill.findMany();
    for (const projectSkill of projectSkills) {
      await prismaLocal.projectSkill.create({ data: projectSkill });
    }
    console.log(`✅ ${projectSkills.length} project-skills clonados\n`);

    // 15. CLONAR TEAM INVITES
    console.log('✉️ Clonando Team Invites...');
    const invites = await prismaProduction.teamInvite.findMany();
    for (const invite of invites) {
      await prismaLocal.teamInvite.create({ data: invite });
    }
    console.log(`✅ ${invites.length} invitaciones clonadas\n`);

    // 16. CLONAR NOTIFICATIONS
    console.log('🔔 Clonando Notifications...');
    const notifications = await prismaProduction.notification.findMany();
    for (const notification of notifications) {
      await prismaLocal.notification.create({ data: notification });
    }
    console.log(`✅ ${notifications.length} notificaciones clonadas\n`);

    // RESUMEN FINAL
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CLONACIÓN COMPLETADA EXITOSAMENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 RESUMEN:');
    console.log(`   • Sectores: ${sectors.length}`);
    console.log(`   • Skills: ${skills.length}`);
    console.log(`   • Empresas: ${companies.length}`);
    console.log(`   • Usuarios: ${users.length}`);
    console.log(`   • Perfiles: ${profiles.length}`);
    console.log(`   • User Skills: ${userSkills.length}`);
    console.log(`   • Certificaciones: ${certifications.length}`);
    console.log(`   • Experiencias: ${experiences.length}`);
    console.log(`   • Equipos: ${teams.length}`);
    console.log(`   • Team Members: ${teamMembers.length}`);
    console.log(`   • Team Skills: ${teamSkills.length}`);
    console.log(`   • Proyectos: ${projects.length}`);
    console.log(`   • Project Skills: ${projectSkills.length}`);
    console.log(`   • Invitaciones: ${invites.length}`);
    console.log(`   • Notificaciones: ${notifications.length}\n`);

    console.log('🎯 Base de datos local ahora es una copia exacta de producción!');
    console.log('   Puedes iniciar el servidor con: bun run dev\n');

  } catch (error) {
    console.error('❌ Error durante la clonación:', error);
    throw error;
  } finally {
    await prismaProduction.$disconnect();
    await prismaLocal.$disconnect();
  }
}

cloneDatabase()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  });
