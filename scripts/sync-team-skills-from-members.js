/**
 * Script para sincronizar skills de equipos desde sus miembros
 * 
 * Este script:
 * 1. Busca todos los equipos
 * 2. Para cada equipo, obtiene las skills de todos sus miembros
 * 3. Copia esas skills al equipo (sin duplicados)
 * 4. Reporta resultados
 * 
 * USO: node scripts/sync-team-skills-from-members.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncTeamSkills() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 SINCRONIZANDO SKILLS DE EQUIPOS DESDE MIEMBROS');
  console.log('='.repeat(70) + '\n');

  try {
    // 1. Obtener todos los equipos con sus miembros
    console.log('📊 Obteniendo equipos y miembros...\n');
    
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: {
              include: {
                skills: {
                  include: {
                    skill: true
                  }
                }
              }
            }
          }
        },
        skills: {
          include: {
            skill: true
          }
        }
      }
    });

    if (teams.length === 0) {
      console.log('⚠️  No hay equipos en la base de datos\n');
      return;
    }

    console.log(`✅ Encontrados ${teams.length} equipos\n`);
    console.log('='.repeat(70));

    let totalTeamsUpdated = 0;
    let totalSkillsAdded = 0;

    // 2. Para cada equipo, sincronizar skills
    for (const team of teams) {
      console.log(`\n🔧 Procesando: ${team.name} (ID: ${team.id})`);
      console.log(`   Miembros: ${team.members.length}`);
      console.log(`   Skills actuales: ${team.skills.length}`);

      // Recopilar todas las skills únicas de los miembros
      const memberSkillIds = new Set();
      
      team.members.forEach(member => {
        member.user.skills.forEach(userSkill => {
          memberSkillIds.add(userSkill.skillId);
        });
      });

      console.log(`   Skills de miembros: ${memberSkillIds.size}`);

      if (memberSkillIds.size === 0) {
        console.log(`   ⚠️  Ningún miembro tiene skills configuradas`);
        continue;
      }

      // Skills que el equipo ya tiene
      const existingTeamSkillIds = new Set(
        team.skills.map(ts => ts.skillId)
      );

      // Skills que necesitamos agregar
      const skillsToAdd = [...memberSkillIds].filter(
        skillId => !existingTeamSkillIds.has(skillId)
      );

      if (skillsToAdd.length === 0) {
        console.log(`   ✅ Equipo ya tiene todas las skills de sus miembros`);
        continue;
      }

      console.log(`   📝 Agregando ${skillsToAdd.length} skills nuevas...`);

      let addedCount = 0;
      let errorCount = 0;

      for (const skillId of skillsToAdd) {
        try {
          await prisma.teamSkill.create({
            data: {
              teamId: team.id,
              skillId: skillId
            }
          });
          addedCount++;
        } catch (error) {
          // Si ya existe (por race condition) o error, continuar
          console.warn(`      ⚠️  Error agregando skill ${skillId}: ${error.message}`);
          errorCount++;
        }
      }

      if (addedCount > 0) {
        totalTeamsUpdated++;
        totalSkillsAdded += addedCount;
        console.log(`   ✅ Agregadas ${addedCount} skills al equipo`);
      }

      if (errorCount > 0) {
        console.log(`   ⚠️  ${errorCount} errors (probablemente duplicados)`);
      }

      // Mostrar skills agregadas
      if (addedCount > 0) {
        const updatedTeam = await prisma.team.findUnique({
          where: { id: team.id },
          include: {
            skills: {
              include: {
                skill: true
              }
            }
          }
        });
        
        console.log(`   📋 Skills totales ahora: ${updatedTeam.skills.length}`);
        const skillNames = updatedTeam.skills.map(ts => ts.skill.name).join(', ');
        console.log(`      ${skillNames}`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE SINCRONIZACIÓN:');
    console.log('='.repeat(70));
    console.log(`Total de equipos: ${teams.length}`);
    console.log(`Equipos actualizados: ${totalTeamsUpdated}`);
    console.log(`Skills agregadas: ${totalSkillsAdded}`);
    console.log('='.repeat(70) + '\n');

    if (totalTeamsUpdated > 0) {
      console.log('🎉 Sincronización completada exitosamente');
      console.log('💡 Los equipos ahora tienen las skills de sus miembros\n');
    } else {
      console.log('ℹ️  No se necesitaron actualizaciones');
      console.log('💡 Los equipos ya tenían las skills de sus miembros\n');
    }

    // 3. Verificación final
    console.log('='.repeat(70));
    console.log('🔍 VERIFICACIÓN FINAL:');
    console.log('='.repeat(70) + '\n');

    for (const team of teams) {
      const updatedTeam = await prisma.team.findUnique({
        where: { id: team.id },
        include: {
          skills: true,
          members: true
        }
      });

      console.log(`${updatedTeam.name}:`);
      console.log(`  Miembros: ${updatedTeam.members.length}`);
      console.log(`  Skills: ${updatedTeam.skills.length}`);
      
      if (updatedTeam.skills.length === 0 && updatedTeam.members.length > 0) {
        console.log(`  ⚠️  Equipo con miembros pero sin skills (miembros sin skills configuradas)`);
      } else if (updatedTeam.skills.length > 0) {
        console.log(`  ✅ Equipo con skills configuradas`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error durante la sincronización:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
syncTeamSkills()
  .then(() => {
    console.log('✅ Proceso completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
