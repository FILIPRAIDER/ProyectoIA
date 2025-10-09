// 🔄 Script de Sincronización de Skills de Usuarios a Equipos
// Fecha: 8 de Octubre 2025
// Propósito: Fix inmediato para habilitar matching de equipos

import { prisma } from '../src/lib/prisma.js';

async function syncTeamSkills() {
  console.log('🔄 Iniciando sincronización de skills de usuarios a equipos...\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Obtener todos los miembros de equipos con sus skills
    console.log('\n📊 [1/4] Obteniendo miembros de equipos y sus skills...');
    
    const teamMembers = await prisma.teamMember.findMany({
      include: {
        team: {
          select: { id: true, name: true }
        },
        user: {
          select: {
            id: true,
            name: true,
            skills: {
              include: {
                skill: true
              }
            }
          }
        }
      }
    });
    
    console.log(`✅ Encontrados ${teamMembers.length} miembros en equipos`);
    
    // 2. Agrupar por equipo
    console.log('\n🔍 [2/4] Analizando skills por equipo...');
    
    const teamSkillsMap = new Map();
    
    for (const member of teamMembers) {
      const teamId = member.teamId;
      
      if (!teamSkillsMap.has(teamId)) {
        teamSkillsMap.set(teamId, {
          teamName: member.team.name,
          skills: new Map() // skillId -> { skillName, maxLevel }
        });
      }
      
      const teamData = teamSkillsMap.get(teamId);
      
      // Agregar skills del miembro al mapa del equipo
      for (const userSkill of member.user.skills) {
        const skillId = userSkill.skillId;
        const skillName = userSkill.skill.name;
        const level = userSkill.level;
        
        // Si la skill ya existe en el equipo, mantener el nivel más alto
        if (teamData.skills.has(skillId)) {
          const existing = teamData.skills.get(skillId);
          if (level > existing.maxLevel) {
            existing.maxLevel = level;
          }
        } else {
          teamData.skills.set(skillId, {
            skillName,
            maxLevel: level
          });
        }
      }
    }
    
    console.log(`✅ Analizados ${teamSkillsMap.size} equipos`);
    
    // 3. Crear/actualizar TeamSkills
    console.log('\n💾 [3/4] Creando TeamSkills en base de datos...');
    
    let skillsCreated = 0;
    let skillsSkipped = 0;
    
    for (const [teamId, teamData] of teamSkillsMap.entries()) {
      console.log(`\n  📦 Equipo: ${teamData.teamName}`);
      console.log(`     Skills a agregar: ${teamData.skills.size}`);
      
      for (const [skillId, skillInfo] of teamData.skills.entries()) {
        try {
          await prisma.teamSkill.upsert({
            where: {
              teamId_skillId: {
                teamId,
                skillId
              }
            },
            create: {
              teamId,
              skillId
            },
            update: {} // No actualizar si ya existe
          });
          
          skillsCreated++;
          console.log(`     ✅ ${skillInfo.skillName} (nivel ${skillInfo.maxLevel})`);
          
        } catch (error) {
          skillsSkipped++;
          console.log(`     ⚠️  ${skillInfo.skillName} (ya existe o error)`);
        }
      }
    }
    
    // 4. Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ [4/4] Sincronización completada\n');
    console.log('📊 RESUMEN:');
    console.log(`   • Miembros analizados: ${teamMembers.length}`);
    console.log(`   • Equipos procesados: ${teamSkillsMap.size}`);
    console.log(`   • Skills creadas: ${skillsCreated}`);
    console.log(`   • Skills omitidas (duplicados): ${skillsSkipped}`);
    console.log(`   • Total procesado: ${skillsCreated + skillsSkipped}`);
    
    // Verificar algunos equipos
    console.log('\n🔍 Verificación de equipos actualizados:');
    
    const teamsWithSkills = await prisma.team.findMany({
      include: {
        skills: {
          include: {
            skill: true
          }
        },
        _count: {
          select: { skills: true }
        }
      },
      orderBy: {
        skills: {
          _count: 'desc'
        }
      },
      take: 5
    });
    
    for (const team of teamsWithSkills) {
      console.log(`\n   📦 ${team.name}`);
      console.log(`      Skills: ${team._count.skills}`);
      if (team.skills.length > 0) {
        console.log(`      ${team.skills.map(ts => ts.skill.name).join(', ')}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 ¡Proceso completado exitosamente!');
    console.log('💡 Ahora el sistema de matching debería funcionar correctamente.\n');
    
  } catch (error) {
    console.error('\n❌ Error durante la sincronización:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
syncTeamSkills().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
