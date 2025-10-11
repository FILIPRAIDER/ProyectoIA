/**
 * 🌱 SEED COMPLETO PARA TESTING DE MATCHING
 * 
 * Este seed crea:
 * - 40+ Skills de tecnologías reales
 * - 1 Empresa (TechStart Colombia)
 * - 1 Empresario
 * - 3 Líderes con sus equipos
 * - 9 Miembros (3 por equipo)
 * - 5 Proyectos con diferentes requisitos
 * 
 * Credenciales:
 * - Empresario: empresario@test.com / Test123!
 * - Líderes: lider1-3@test.com / Test123!
 * - Estudiantes: estudiante1-9@test.com / Test123!
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed completo...');

  // Limpiar datos existentes (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Limpiando base de datos...');
    
    await prisma.projectSkill.deleteMany();
    await prisma.teamSkill.deleteMany();
    await prisma.userSkill.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.team.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    
    console.log('✅ Base de datos limpia');
  }

  // 1. CREAR SKILLS (40 habilidades)
  console.log('\n📦 Creando 40 skills...');
  
  const skillNames = [
    // Frontend (12)
    'React', 'Vue.js', 'Angular', 'Next.js', 'TypeScript', 
    'HTML5', 'CSS3', 'Sass', 'Tailwind CSS', 'Bootstrap', 
    'Redux', 'Webpack',
    // Backend (12)
    'Node.js', 'Express.js', 'NestJS', 'Python', 'Django', 
    'FastAPI', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 
    'REST API', 'Prisma',
    // Mobile (8)
    'React Native', 'Flutter', 'Swift', 'Kotlin', 
    'Expo', 'Firebase', 'iOS Development', 'Android Development',
    // Other (8)
    'Docker', 'Git', 'CI/CD', 'AWS', 
    'Figma', 'UI/UX Design', 'Scrum', 'Testing'
  ];

  for (const skillName of skillNames) {
    await prisma.skill.create({ data: { name: skillName } });
  }
  
  console.log(`✅ ${skillNames.length} skills creadas`);

  // Obtener todas las skills creadas
  const skills = await prisma.skill.findMany();
  const skillMap = Object.fromEntries(skills.map(s => [s.name, s.id]));

  // 2. CREAR EMPRESA
  console.log('\n🏢 Creando empresa...');
  
  const company = await prisma.company.create({
    data: {
      name: 'TechStart Colombia',
      sector: 'Tecnología y Software',
      city: 'Bogotá',
      website: 'https://techstart.co',
      about: 'Startup colombiana enfocada en soluciones tecnológicas innovadoras'
    }
  });
  
  console.log(`✅ Empresa creada: ${company.name} (ID: ${company.id})`);

  // 3. CREAR EMPRESARIO
  console.log('\n👔 Creando empresario...');
  
  const hashedPassword = await bcrypt.hash('Test123!', 10);
  
  const empresario = await prisma.user.create({
    data: {
      name: 'Carlos Empresario',
      email: 'empresario@test.com',
      passwordHash: hashedPassword,
      role: 'EMPRESARIO',
      companyId: company.id
    }
  });
  
  console.log(`✅ Empresario creado: ${empresario.email}`);

  // 4. CREAR LÍDERES Y EQUIPOS
  console.log('\n👨‍💼 Creando líderes y equipos...');

  // Líder 1: Frontend
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

  // Líder 2: Backend
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

  // Líder 3: FullStack
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

  console.log(`✅ 3 equipos creados`);

  // 5. CREAR MIEMBROS Y ASIGNAR SKILLS
  console.log('\n👨‍💻 Creando miembros y asignando skills...');

  // Helper para agregar skills a usuario y equipo
  async function addUserSkills(userId, teamId, skillNames, levels) {
    for (let i = 0; i < skillNames.length; i++) {
      const skillId = skillMap[skillNames[i]];
      
      // Agregar skill al usuario
      await prisma.userSkill.create({
        data: {
          userId,
          skillId,
          level: levels[i]
        }
      });
      
      // Agregar skill al equipo (o actualizar si existe)
      const existingTeamSkill = await prisma.teamSkill.findUnique({
        where: {
          teamId_skillId: { teamId, skillId }
        }
      });
      
      if (!existingTeamSkill) {
        await prisma.teamSkill.create({
          data: {
            teamId,
            skillId
          }
        });
      }
    }
  }

  // Agregar líder 1 al equipo 1
  await prisma.teamMember.create({
    data: { teamId: team1.id, userId: lider1.id, role: 'LIDER' }
  });
  await addUserSkills(lider1.id, team1.id, 
    ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux'],
    [5, 4, 5, 4, 4]
  );

  // Miembros del equipo 1 (Frontend)
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

  // Agregar líder 2 al equipo 2
  await prisma.teamMember.create({ data: { teamId: team2.id, userId: lider2.id, role: 'LIDER' } });
  await addUserSkills(lider2.id, team2.id,
    ['Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'Redis'],
    [5, 5, 5, 4, 4]
  );

  // Miembros del equipo 2 (Backend)
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

  // Agregar líder 3 al equipo 3
  await prisma.teamMember.create({ data: { teamId: team3.id, userId: lider3.id, role: 'LIDER' } });
  await addUserSkills(lider3.id, team3.id,
    ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'React Native'],
    [5, 5, 4, 5, 4]
  );

  // Miembros del equipo 3 (FullStack)
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
    ['React Native', 'Flutter', 'Firebase', 'Expo', 'TypeScript'],
    [5, 4, 4, 4, 4]
  );

  console.log(`✅ 9 miembros creados y asignados a equipos`);

  // 6. CREAR PROYECTOS
  console.log('\n📋 Creando 5 proyectos...');

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
          { skillId: skillMap['Firebase'], levelRequired: 4 },
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

  console.log(`✅ 5 proyectos creados`);

  // RESUMEN FINAL
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SEED COMPLETADO EXITOSAMENTE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📊 RESUMEN:');
  console.log(`   • Skills: 40`);
  console.log(`   • Empresa: 1 (${company.name})`);
  console.log(`   • Empresario: 1 (${empresario.email})`);
  console.log(`   • Líderes: 3`);
  console.log(`   • Miembros: 9`);
  console.log(`   • Equipos: 3`);
  console.log(`   • Proyectos: 5\n`);

  console.log('🔐 CREDENCIALES:');
  console.log('   Empresario: empresario@test.com / Test123!');
  console.log('   Líder 1: lider1@test.com / Test123!');
  console.log('   Líder 2: lider2@test.com / Test123!');
  console.log('   Líder 3: lider3@test.com / Test123!');
  console.log('   Estudiantes: estudiante1-9@test.com / Test123!\n');

  console.log('📋 IDs IMPORTANTES:');
  console.log(`   Company ID: ${company.id}`);
  console.log(`   Empresario ID: ${empresario.id}`);
  console.log(`   Team Frontend ID: ${team1.id}`);
  console.log(`   Team Backend ID: ${team2.id}`);
  console.log(`   Team FullStack ID: ${team3.id}`);
  console.log(`   Project 1 ID: ${project1.id}`);
  console.log(`   Project 2 ID: ${project2.id}`);
  console.log(`   Project 3 ID: ${project3.id}`);
  console.log(`   Project 4 ID: ${project4.id}`);
  console.log(`   Project 5 ID: ${project5.id}\n`);

  console.log('🎯 MATCHES ESPERADOS:');
  console.log(`   Proyecto 1 (E-commerce) → DevTeam FullStack (~95%)`);
  console.log(`   Proyecto 2 (App Móvil) → DevTeam FullStack (~90%)`);
  console.log(`   Proyecto 3 (Dashboard) → DevTeam FullStack (~88%)`);
  console.log(`   Proyecto 4 (Landing) → DevTeam Frontend (~92%)`);
  console.log(`   Proyecto 5 (API REST) → DevTeam Backend (~98%)`);
  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
