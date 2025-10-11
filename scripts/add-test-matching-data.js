#!/usr/bin/env node

/**
 * 🎯 Script para agregar datos de prueba de matching
 * 
 * Este script AGREGA (no reemplaza) los datos de prueba para matching:
 * - 1 Empresa de prueba (TechStart Colombia)
 * - 1 Empresario de prueba
 * - 3 Equipos de prueba (Frontend, Backend, FullStack)
 * - 9 Miembros de prueba
 * - 5 Proyectos de prueba
 * 
 * IMPORTANTE: Este script NO borra los datos existentes de producción
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function addMatchingTestData() {
  console.log('🎯 Agregando datos de prueba para matching...\n');

  const hashedPassword = await bcrypt.hash('Test123!', 10);

  try {
    // Verificar si ya existen los datos de prueba
    const existingCompany = await prisma.company.findFirst({
      where: { name: 'TechStart Colombia' }
    });

    if (existingCompany) {
      console.log('⚠️  Los datos de prueba ya existen. ¿Deseas reemplazarlos?');
      console.log('   Si quieres limpiar, ejecuta primero:');
      console.log('   node scripts/clean-test-data.js\n');
      return;
    }

    // 1. CREAR EMPRESA DE PRUEBA
    console.log('🏢 Creando empresa de prueba...');
    const company = await prisma.company.create({
      data: {
        name: 'TechStart Colombia',
        sector: 'Tecnología y Software',
        city: 'Bogotá',
        website: 'https://techstart.co',
        about: 'Startup colombiana enfocada en soluciones tecnológicas innovadoras'
      }
    });
    console.log(`✅ Empresa creada: ${company.name} (ID: ${company.id})\n`);

    // 2. CREAR EMPRESARIO DE PRUEBA
    console.log('👔 Creando empresario de prueba...');
    const empresario = await prisma.user.create({
      data: {
        name: 'Carlos Empresario',
        email: 'empresario@test.com',
        passwordHash: hashedPassword,
        role: 'EMPRESARIO',
        companyId: company.id
      }
    });
    console.log(`✅ Empresario creado: ${empresario.email}\n`);

    // 3. CREAR LÍDERES Y EQUIPOS
    console.log('👨‍💼 Creando líderes y equipos de prueba...');

    const lider1 = await prisma.user.create({
      data: {
        name: 'Ana García',
        email: 'lider1@test.com',
        passwordHash: hashedPassword,
        role: 'LIDER'
      }
    });

    const team1 = await prisma.team.create({
      data: {
        name: 'DevTeam Frontend',
        description: 'Equipo especializado en desarrollo frontend moderno',
        city: 'Bogotá',
        area: 'Frontend Development'
      }
    });

    const lider2 = await prisma.user.create({
      data: {
        name: 'Luis Rodríguez',
        email: 'lider2@test.com',
        passwordHash: hashedPassword,
        role: 'LIDER'
      }
    });

    const team2 = await prisma.team.create({
      data: {
        name: 'DevTeam Backend',
        description: 'Expertos en arquitectura backend y bases de datos',
        city: 'Medellín',
        area: 'Backend Development'
      }
    });

    const lider3 = await prisma.user.create({
      data: {
        name: 'María López',
        email: 'lider3@test.com',
        passwordHash: hashedPassword,
        role: 'LIDER'
      }
    });

    const team3 = await prisma.team.create({
      data: {
        name: 'DevTeam FullStack',
        description: 'Equipo versátil con experiencia completa en desarrollo web y móvil',
        city: 'Bogotá',
        area: 'Full Stack Development'
      }
    });

    console.log(`✅ 3 equipos creados\n`);

    // 4. OBTENER SKILLS NECESARIAS
    console.log('💡 Obteniendo skills...');
    const skillNames = [
      'React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux',
      'Vue.js', 'HTML5', 'CSS3', 'Angular', 'Bootstrap', 'Sass', 'Webpack',
      'Figma', 'UI/UX Design',
      'Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'Redis',
      'NestJS', 'Prisma', 'GraphQL', 'Python', 'Django', 'FastAPI',
      'Docker', 'AWS', 'CI/CD', 'Git',
      'React Native', 'Flutter', 'Firestore', 'Expo'
    ];

    const skills = await prisma.skill.findMany({
      where: { name: { in: skillNames } }
    });
    const skillMap = Object.fromEntries(skills.map(s => [s.name, s.id]));
    console.log(`✅ ${skills.length} skills encontradas\n`);

    // Helper para agregar skills
    async function addUserSkills(userId, teamId, skillNames, levels) {
      for (let i = 0; i < skillNames.length; i++) {
        const skillId = skillMap[skillNames[i]];
        if (!skillId) continue;

        await prisma.userSkill.create({
          data: { userId, skillId, level: levels[i] }
        });

        const existingTeamSkill = await prisma.teamSkill.findUnique({
          where: { teamId_skillId: { teamId, skillId } }
        });

        if (!existingTeamSkill) {
          await prisma.teamSkill.create({
            data: { teamId, skillId }
          });
        }
      }
    }

    // 5. CREAR MIEMBROS Y ASIGNAR SKILLS
    console.log('👨‍💻 Creando miembros y asignando skills...');

    // Team 1: Frontend
    await prisma.teamMember.create({
      data: { teamId: team1.id, userId: lider1.id, role: 'LIDER' }
    });
    await addUserSkills(lider1.id, team1.id,
      ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux'],
      [5, 4, 5, 4, 4]
    );

    const member1 = await prisma.user.create({
      data: {
        name: 'Pedro Martínez',
        email: 'estudiante1@test.com',
        passwordHash: hashedPassword,
        role: 'ESTUDIANTE'
      }
    });
    await prisma.teamMember.create({ data: { teamId: team1.id, userId: member1.id } });
    await addUserSkills(member1.id, team1.id,
      ['React', 'Vue.js', 'HTML5', 'CSS3', 'TypeScript'],
      [4, 3, 5, 5, 4]
    );

    const member2 = await prisma.user.create({
      data: {
        name: 'Laura Sánchez',
        email: 'estudiante2@test.com',
        passwordHash: hashedPassword,
        role: 'ESTUDIANTE'
      }
    });
    await prisma.teamMember.create({ data: { teamId: team1.id, userId: member2.id } });
    await addUserSkills(member2.id, team1.id,
      ['Angular', 'TypeScript', 'Bootstrap', 'Sass', 'Webpack'],
      [4, 4, 4, 3, 3]
    );

    const member3 = await prisma.user.create({
      data: {
        name: 'Paula Morales',
        email: 'estudiante8@test.com',
        passwordHash: hashedPassword,
        role: 'ESTUDIANTE'
      }
    });
    await prisma.teamMember.create({ data: { teamId: team1.id, userId: member3.id } });
    await addUserSkills(member3.id, team1.id,
      ['Figma', 'UI/UX Design', 'HTML5', 'CSS3', 'Tailwind CSS'],
      [5, 5, 4, 4, 4]
    );

    // Team 2: Backend
    await prisma.teamMember.create({
      data: { teamId: team2.id, userId: lider2.id, role: 'LIDER' }
    });
    await addUserSkills(lider2.id, team2.id,
      ['Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'Redis'],
      [5, 5, 5, 4, 4]
    );

    const member4 = await prisma.user.create({
      data: {
        name: 'Diego Torres',
        email: 'estudiante3@test.com',
        passwordHash: hashedPassword,
        role: 'ESTUDIANTE'
      }
    });
    await prisma.teamMember.create({ data: { teamId: team2.id, userId: member4.id } });
    await addUserSkills(member4.id, team2.id,
      ['NestJS', 'TypeScript', 'Prisma', 'GraphQL', 'PostgreSQL'],
      [4, 5, 4, 4, 4]
    );

    const member5 = await prisma.user.create({
      data: {
        name: 'Carmen Ruiz',
        email: 'estudiante4@test.com',
        passwordHash: hashedPassword,
        role: 'ESTUDIANTE'
      }
    });
    await prisma.teamMember.create({ data: { teamId: team2.id, userId: member5.id } });
    await addUserSkills(member5.id, team2.id,
      ['Python', 'Django', 'FastAPI', 'MongoDB', 'Redis'],
      [5, 4, 4, 4, 3]
    );

    const member6 = await prisma.user.create({
      data: {
        name: 'Miguel Ángel',
        email: 'estudiante9@test.com',
        passwordHash: hashedPassword,
        role: 'ESTUDIANTE'
      }
    });
    await prisma.teamMember.create({ data: { teamId: team2.id, userId: member6.id } });
    await addUserSkills(member6.id, team2.id,
      ['Docker', 'AWS', 'CI/CD', 'Git', 'PostgreSQL'],
      [5, 4, 4, 5, 4]
    );

    // Team 3: FullStack
    await prisma.teamMember.create({
      data: { teamId: team3.id, userId: lider3.id, role: 'LIDER' }
    });
    await addUserSkills(lider3.id, team3.id,
      ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'React Native'],
      [5, 5, 4, 5, 4]
    );

    const member7 = await prisma.user.create({
      data: {
        name: 'Jorge Vargas',
        email: 'estudiante5@test.com',
        passwordHash: hashedPassword,
        role: 'ESTUDIANTE'
      }
    });
    await prisma.teamMember.create({ data: { teamId: team3.id, userId: member7.id } });
    await addUserSkills(member7.id, team3.id,
      ['Vue.js', 'Express.js', 'MongoDB', 'Docker', 'Git'],
      [4, 4, 4, 4, 5]
    );

    const member8 = await prisma.user.create({
      data: {
        name: 'Sofia Castro',
        email: 'estudiante6@test.com',
        passwordHash: hashedPassword,
        role: 'ESTUDIANTE'
      }
    });
    await prisma.teamMember.create({ data: { teamId: team3.id, userId: member8.id } });
    await addUserSkills(member8.id, team3.id,
      ['Next.js', 'NestJS', 'Prisma', 'GraphQL', 'TypeScript'],
      [4, 4, 4, 3, 5]
    );

    const member9 = await prisma.user.create({
      data: {
        name: 'Ricardo Díaz',
        email: 'estudiante7@test.com',
        passwordHash: hashedPassword,
        role: 'ESTUDIANTE'
      }
    });
    await prisma.teamMember.create({ data: { teamId: team3.id, userId: member9.id } });
    await addUserSkills(member9.id, team3.id,
      ['React Native', 'Flutter', 'Firestore', 'Expo', 'TypeScript'],
      [5, 4, 4, 4, 4]
    );

    console.log(`✅ 9 miembros creados y asignados\n`);

    // 6. CREAR PROYECTOS DE PRUEBA
    console.log('📋 Creando proyectos de prueba...');

    const project1 = await prisma.project.create({
      data: {
        companyId: company.id,
        title: 'E-commerce de Ropa Colombiana',
        description: 'Tienda online para venta de ropa tradicional colombiana con pasarela de pago',
        status: 'OPEN',
        budget: '30000000',
        budgetCurrency: 'COP',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2026-02-01'),
        city: 'Bogotá',
        area: 'E-commerce y Retail',
        skills: {
          create: [
            { skillId: skillMap['React'], levelRequired: 4 },
            { skillId: skillMap['Node.js'], levelRequired: 4 },
            { skillId: skillMap['PostgreSQL'], levelRequired: 3 },
            { skillId: skillMap['TypeScript'], levelRequired: 4 },
            { skillId: skillMap['Tailwind CSS'], levelRequired: 3 }
          ]
        }
      }
    });

    const project2 = await prisma.project.create({
      data: {
        companyId: company.id,
        title: 'App Móvil de Delivery de Comida',
        description: 'Aplicación móvil multiplataforma para pedidos de comida a domicilio',
        status: 'OPEN',
        budget: '50000000',
        budgetCurrency: 'COP',
        startDate: new Date('2025-11-15'),
        endDate: new Date('2026-05-01'),
        city: 'Medellín',
        area: 'Alimentos y Bebidas',
        skills: {
          create: [
            { skillId: skillMap['React Native'], levelRequired: 5 },
            { skillId: skillMap['Firestore'], levelRequired: 4 },
            { skillId: skillMap['Node.js'], levelRequired: 4 },
            { skillId: skillMap['MongoDB'], levelRequired: 3 },
            { skillId: skillMap['TypeScript'], levelRequired: 4 }
          ]
        }
      }
    });

    const project3 = await prisma.project.create({
      data: {
        companyId: company.id,
        title: 'Dashboard de Análisis de Datos',
        description: 'Panel de control con visualizaciones y reportes en tiempo real',
        status: 'OPEN',
        budget: '40000000',
        budgetCurrency: 'COP',
        startDate: new Date('2025-12-01'),
        endDate: new Date('2026-03-01'),
        city: 'Bogotá',
        area: 'Tecnología y Software',
        skills: {
          create: [
            { skillId: skillMap['React'], levelRequired: 5 },
            { skillId: skillMap['Next.js'], levelRequired: 4 },
            { skillId: skillMap['NestJS'], levelRequired: 4 },
            { skillId: skillMap['PostgreSQL'], levelRequired: 5 },
            { skillId: skillMap['GraphQL'], levelRequired: 4 },
            { skillId: skillMap['TypeScript'], levelRequired: 5 }
          ]
        }
      }
    });

    const project4 = await prisma.project.create({
      data: {
        companyId: company.id,
        title: 'Landing Page Corporativa',
        description: 'Sitio web institucional con diseño moderno y animaciones',
        status: 'OPEN',
        budget: '8000000',
        budgetCurrency: 'COP',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-12-01'),
        city: 'Bogotá',
        area: 'Marketing y Publicidad',
        skills: {
          create: [
            { skillId: skillMap['React'], levelRequired: 4 },
            { skillId: skillMap['Next.js'], levelRequired: 3 },
            { skillId: skillMap['Tailwind CSS'], levelRequired: 4 },
            { skillId: skillMap['Figma'], levelRequired: 4 },
            { skillId: skillMap['UI/UX Design'], levelRequired: 4 }
          ]
        }
      }
    });

    const project5 = await prisma.project.create({
      data: {
        companyId: company.id,
        title: 'API REST para Integración de Servicios',
        description: 'Backend robusto con microservicios y arquitectura escalable',
        status: 'OPEN',
        budget: '60000000',
        budgetCurrency: 'COP',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-06-01'),
        city: 'Medellín',
        area: 'Tecnología y Software',
        skills: {
          create: [
            { skillId: skillMap['Node.js'], levelRequired: 5 },
            { skillId: skillMap['NestJS'], levelRequired: 5 },
            { skillId: skillMap['PostgreSQL'], levelRequired: 5 },
            { skillId: skillMap['Redis'], levelRequired: 4 },
            { skillId: skillMap['Docker'], levelRequired: 4 },
            { skillId: skillMap['GraphQL'], levelRequired: 4 }
          ]
        }
      }
    });

    console.log(`✅ 5 proyectos creados\n`);

    // RESUMEN
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DATOS DE PRUEBA AGREGADOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 RESUMEN:');
    console.log(`   • Empresa: TechStart Colombia`);
    console.log(`   • Empresario: empresario@test.com`);
    console.log(`   • Líderes: 3`);
    console.log(`   • Miembros: 9`);
    console.log(`   • Equipos: 3`);
    console.log(`   • Proyectos: 5\n`);

    console.log('🔐 CREDENCIALES DE PRUEBA:');
    console.log('   Empresario: empresario@test.com / Test123!');
    console.log('   Líderes: lider1-3@test.com / Test123!');
    console.log('   Estudiantes: estudiante1-9@test.com / Test123!\n');

    console.log('📋 IDs IMPORTANTES:');
    console.log(`   Company ID: ${company.id}`);
    console.log(`   Team Frontend: ${team1.id}`);
    console.log(`   Team Backend: ${team2.id}`);
    console.log(`   Team FullStack: ${team3.id}`);
    console.log(`   Project 1: ${project1.id}`);
    console.log(`   Project 2: ${project2.id}`);
    console.log(`   Project 3: ${project3.id}`);
    console.log(`   Project 4: ${project4.id}`);
    console.log(`   Project 5: ${project5.id}\n`);

    console.log('🎯 Ahora tienes:');
    console.log('   • Datos de producción (17 usuarios, 11 empresas, 7 equipos)');
    console.log('   • Datos de prueba para matching (12 usuarios, 1 empresa, 3 equipos, 5 proyectos)\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addMatchingTestData()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  });
