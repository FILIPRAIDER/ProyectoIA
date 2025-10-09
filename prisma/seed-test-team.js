/**
 * 🧪 Seed de Equipo de Prueba para Testing de Matching
 * 
 * Crea un equipo completo con:
 * - 1 líder + 4 miembros (5 personas total)
 * - Skills full-stack (React, Node.js, PostgreSQL, etc.)
 * - Ubicación: Bogotá, Colombia
 * - Área: Tecnología
 * 
 * USO:
 * node prisma/seed-test-team.js
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTestTeam() {
  console.log('🌱 Iniciando seed de equipo de prueba...\n');

  try {
    // 1. CREAR USUARIOS (Líder + 4 Miembros)
    console.log('📝 Creando usuarios...');
    
    const hashedLeader = await bcrypt.hash('DevTeam2025!', 10);
    const hashedFrontend = await bcrypt.hash('Frontend2025!', 10);
    const hashedBackend = await bcrypt.hash('Backend2025!', 10);
    const hashedDesigner = await bcrypt.hash('Designer2025!', 10);
    const hashedFullstack = await bcrypt.hash('Fullstack2025!', 10);

    // Líder del equipo
    const leader = await prisma.user.upsert({
      where: { email: 'leader.devteam@test.com' },
      update: {},
      create: {
        email: 'leader.devteam@test.com',
        passwordHash: hashedLeader,
        name: 'Carlos Rodríguez',
        role: 'LIDER',
        avatarUrl: 'https://ui-avatars.com/api/?name=Carlos+Rodriguez&background=0D8ABC&color=fff'
      }
    });
    console.log('  ✅ Líder creado:', leader.email);

    // Miembro 1: Frontend Developer
    const member1 = await prisma.user.upsert({
      where: { email: 'frontend.dev@test.com' },
      update: {},
      create: {
        email: 'frontend.dev@test.com',
        passwordHash: hashedFrontend,
        name: 'Ana María López',
        role: 'ESTUDIANTE',
        avatarUrl: 'https://ui-avatars.com/api/?name=Ana+Lopez&background=10B981&color=fff'
      }
    });
    console.log('  ✅ Frontend dev creado:', member1.email);

    // Miembro 2: Backend Developer
    const member2 = await prisma.user.upsert({
      where: { email: 'backend.dev@test.com' },
      update: {},
      create: {
        email: 'backend.dev@test.com',
        passwordHash: hashedBackend,
        name: 'Jorge Martínez',
        role: 'ESTUDIANTE',
        avatarUrl: 'https://ui-avatars.com/api/?name=Jorge+Martinez&background=F59E0B&color=fff'
      }
    });
    console.log('  ✅ Backend dev creado:', member2.email);

    // Miembro 3: UI/UX Designer
    const member3 = await prisma.user.upsert({
      where: { email: 'designer.dev@test.com' },
      update: {},
      create: {
        email: 'designer.dev@test.com',
        passwordHash: hashedDesigner,
        name: 'Laura Hernández',
        role: 'ESTUDIANTE',
        avatarUrl: 'https://ui-avatars.com/api/?name=Laura+Hernandez&background=EC4899&color=fff'
      }
    });
    console.log('  ✅ Designer creado:', member3.email);

    // Miembro 4: Full-stack Developer
    const member4 = await prisma.user.upsert({
      where: { email: 'fullstack.dev@test.com' },
      update: {},
      create: {
        email: 'fullstack.dev@test.com',
        passwordHash: hashedFullstack,
        name: 'Miguel Ángel Gómez',
        role: 'ESTUDIANTE',
        avatarUrl: 'https://ui-avatars.com/api/?name=Miguel+Gomez&background=8B5CF6&color=fff'
      }
    });
    console.log('  ✅ Fullstack dev creado:', member4.email);

    // 2. CREAR EQUIPO
    console.log('\n👥 Creando equipo...');
    
    // Verificar si ya existe
    let team = await prisma.team.findFirst({
      where: { name: 'DevTeam Colombia' }
    });
    
    if (!team) {
      team = await prisma.team.create({
        data: {
          name: 'DevTeam Colombia',
          description: 'Equipo full-stack especializado en desarrollo web y móvil. Experiencia en React, Node.js, PostgreSQL y AWS. Ubicados en Bogotá, Colombia. Más de 15 proyectos completados exitosamente.',
          city: 'Bogotá',
          area: 'Tecnología'
        }
      });
      console.log('  ✅ Equipo creado:', team.name);
    } else {
      console.log('  ℹ️  Equipo ya existe:', team.name);
    }
    console.log('  📋 ID:', team.id);

    // 3. AGREGAR MIEMBROS AL EQUIPO
    console.log('\n👤 Agregando miembros al equipo...');
    
    // Líder
    await prisma.teamMember.upsert({
      where: { 
        teamId_userId: { 
          teamId: team.id, 
          userId: leader.id 
        } 
      },
      update: {},
      create: {
        teamId: team.id,
        userId: leader.id,
        role: 'LIDER',
        joinedAt: new Date()
      }
    });
    console.log('  ✅ Líder agregado al equipo');

    // Miembro 1
    await prisma.teamMember.upsert({
      where: { 
        teamId_userId: { 
          teamId: team.id, 
          userId: member1.id 
        } 
      },
      update: {},
      create: {
        teamId: team.id,
        userId: member1.id,
        role: 'MIEMBRO',
        joinedAt: new Date()
      }
    });
    console.log('  ✅ Frontend dev agregado');

    // Miembro 2
    await prisma.teamMember.upsert({
      where: { 
        teamId_userId: { 
          teamId: team.id, 
          userId: member2.id 
        } 
      },
      update: {},
      create: {
        teamId: team.id,
        userId: member2.id,
        role: 'MIEMBRO',
        joinedAt: new Date()
      }
    });
    console.log('  ✅ Backend dev agregado');

    // Miembro 3
    await prisma.teamMember.upsert({
      where: { 
        teamId_userId: { 
          teamId: team.id, 
          userId: member3.id 
        } 
      },
      update: {},
      create: {
        teamId: team.id,
        userId: member3.id,
        role: 'MIEMBRO',
        joinedAt: new Date()
      }
    });
    console.log('  ✅ Designer agregado');

    // Miembro 4
    await prisma.teamMember.upsert({
      where: { 
        teamId_userId: { 
          teamId: team.id, 
          userId: member4.id 
        } 
      },
      update: {},
      create: {
        teamId: team.id,
        userId: member4.id,
        role: 'MIEMBRO',
        joinedAt: new Date()
      }
    });
    console.log('  ✅ Fullstack dev agregado');

    // 4. CREAR/OBTENER SKILLS
    console.log('\n🔧 Creando skills...');
    
    const skillsData = [
      // Frontend
      'React', 'Vue.js', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 
      'Tailwind CSS', 'Next.js', 'Redux',
      
      // Backend
      'Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'REST API', 
      'GraphQL', 'Prisma', 'NestJS',
      
      // Mobile
      'React Native', 'Flutter',
      
      // DevOps & Cloud
      'AWS', 'Docker', 'Git', 'CI/CD', 'Kubernetes',
      
      // Design
      'Figma', 'Adobe XD', 'UI Design', 'UX Design', 'Sketch'
    ];

    const skills = [];
    for (const skillName of skillsData) {
      const skill = await prisma.skill.upsert({
        where: { name: skillName },
        update: {},
        create: { name: skillName }
      });
      skills.push(skill);
    }
    console.log(`  ✅ ${skills.length} skills creadas/verificadas`);

    // 5. AGREGAR SKILLS AL EQUIPO
    console.log('\n🎯 Agregando skills al equipo...');
    
    let skillCount = 0;
    for (const skill of skills) {
      await prisma.teamSkill.upsert({
        where: {
          teamId_skillId: {
            teamId: team.id,
            skillId: skill.id
          }
        },
        update: {},
        create: {
          teamId: team.id,
          skillId: skill.id
        }
      });
      skillCount++;
    }
    console.log(`  ✅ ${skillCount} skills agregadas al equipo`);

    // 6. AGREGAR SKILLS A USUARIOS INDIVIDUALES
    console.log('\n👨‍💻 Agregando skills a usuarios individuales...');
    
    // Líder - Full-stack
    const leaderSkills = ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Git', 'Docker'];
    for (const skillName of leaderSkills) {
      const skill = skills.find(s => s.name === skillName);
      if (skill) {
        await prisma.userSkill.upsert({
          where: {
            userId_skillId: {
              userId: leader.id,
              skillId: skill.id
            }
          },
          update: {},
          create: {
            userId: leader.id,
            skillId: skill.id,
            level: 5 // Nivel experto
          }
        });
      }
    }
    console.log(`  ✅ ${leaderSkills.length} skills agregadas al líder`);

    // Miembro 1 - Frontend
    const frontendSkills = ['React', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Next.js'];
    for (const skillName of frontendSkills) {
      const skill = skills.find(s => s.name === skillName);
      if (skill) {
        await prisma.userSkill.upsert({
          where: {
            userId_skillId: {
              userId: member1.id,
              skillId: skill.id
            }
          },
          update: {},
          create: {
            userId: member1.id,
            skillId: skill.id,
            level: 4
          }
        });
      }
    }
    console.log(`  ✅ ${frontendSkills.length} skills agregadas al frontend dev`);

    // Miembro 2 - Backend
    const backendSkills = ['Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'REST API', 'Prisma'];
    for (const skillName of backendSkills) {
      const skill = skills.find(s => s.name === skillName);
      if (skill) {
        await prisma.userSkill.upsert({
          where: {
            userId_skillId: {
              userId: member2.id,
              skillId: skill.id
            }
          },
          update: {},
          create: {
            userId: member2.id,
            skillId: skill.id,
            level: 5
          }
        });
      }
    }
    console.log(`  ✅ ${backendSkills.length} skills agregadas al backend dev`);

    // Miembro 3 - Designer
    const designSkills = ['Figma', 'Adobe XD', 'UI Design', 'UX Design', 'Sketch'];
    for (const skillName of designSkills) {
      const skill = skills.find(s => s.name === skillName);
      if (skill) {
        await prisma.userSkill.upsert({
          where: {
            userId_skillId: {
              userId: member3.id,
              skillId: skill.id
            }
          },
          update: {},
          create: {
            userId: member3.id,
            skillId: skill.id,
            level: 4
          }
        });
      }
    }
    console.log(`  ✅ ${designSkills.length} skills agregadas al designer`);

    // Miembro 4 - Full-stack
    const fullstackSkills = ['React', 'Node.js', 'PostgreSQL', 'React Native', 'Git'];
    for (const skillName of fullstackSkills) {
      const skill = skills.find(s => s.name === skillName);
      if (skill) {
        await prisma.userSkill.upsert({
          where: {
            userId_skillId: {
              userId: member4.id,
              skillId: skill.id
            }
          },
          update: {},
          create: {
            userId: member4.id,
            skillId: skill.id,
            level: 4
          }
        });
      }
    }
    console.log(`  ✅ ${fullstackSkills.length} skills agregadas al fullstack dev`);

    // 7. RESUMEN FINAL
    console.log('\n' + '='.repeat(70));
    console.log('🎉 SEED DE EQUIPO DE PRUEBA COMPLETADO EXITOSAMENTE!');
    console.log('='.repeat(70));
    
    console.log('\n📋 INFORMACIÓN DEL EQUIPO:');
    console.log('  Nombre:', team.name);
    console.log('  ID:', team.id);
    console.log('  Ciudad:', team.city);
    console.log('  Área:', team.area);
    console.log('  Miembros:', 5);
    console.log('  Skills del equipo:', skillCount);
    
    console.log('\n🔐 CREDENCIALES DEL LÍDER:');
    console.log('  📧 Email: leader.devteam@test.com');
    console.log('  🔑 Password: DevTeam2025!');
    console.log('  👤 Nombre:', leader.name);
    console.log('  🎖️  Rol: LIDER');
    console.log('  🆔 User ID:', leader.id);
    
    console.log('\n🔐 CREDENCIALES DE MIEMBROS:');
    console.log('\n  Frontend Developer:');
    console.log('    📧 Email: frontend.dev@test.com');
    console.log('    🔑 Password: Frontend2025!');
    console.log('    👤 Nombre:', member1.name);
    
    console.log('\n  Backend Developer:');
    console.log('    📧 Email: backend.dev@test.com');
    console.log('    🔑 Password: Backend2025!');
    console.log('    👤 Nombre:', member2.name);
    
    console.log('\n  UI/UX Designer:');
    console.log('    📧 Email: designer.dev@test.com');
    console.log('    🔑 Password: Designer2025!');
    console.log('    👤 Nombre:', member3.name);
    
    console.log('\n  Full-stack Developer:');
    console.log('    📧 Email: fullstack.dev@test.com');
    console.log('    🔑 Password: Fullstack2025!');
    console.log('    👤 Nombre:', member4.name);
    
    console.log('\n🔗 ENDPOINTS PARA PROBAR:');
    console.log('  GET  /teams/' + team.id);
    console.log('  GET  /teams/' + team.id + '/members');
    console.log('  GET  /teams?city=Bogotá');
    console.log('  POST /matching/teams (buscar equipos por skills)');
    
    console.log('\n💡 SKILLS PRINCIPALES DEL EQUIPO:');
    console.log('  Frontend: React, Vue.js, Next.js, TypeScript');
    console.log('  Backend: Node.js, Express.js, PostgreSQL, Prisma');
    console.log('  Mobile: React Native, Flutter');
    console.log('  DevOps: AWS, Docker, Git, CI/CD');
    console.log('  Design: Figma, Adobe XD, UI/UX');
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Ahora puedes probar el matching de proyectos con este equipo!');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error durante el seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar seed
seedTestTeam()
  .then(() => {
    console.log('🎉 Proceso completado exitosamente\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
