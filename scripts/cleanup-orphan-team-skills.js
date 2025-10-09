import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Script de limpieza de skills huérfanas en equipos
 * 
 * Elimina skills de equipos cuando ningún miembro del equipo tiene esa skill.
 * Útil para:
 * - Limpiar datos históricos
 * - Corregir inconsistencias
 * - Mantenimiento periódico (se puede ejecutar semanalmente)
 * 
 * Uso: node scripts/cleanup-orphan-team-skills.js
 */
async function cleanupOrphanTeamSkills() {
  console.log("======================================================================");
  console.log("🔄 LIMPIEZA DE SKILLS HUÉRFANAS EN EQUIPOS");
  console.log("======================================================================");
  console.log("");
  console.log("📊 Obteniendo equipos con skills...");
  console.log("");

  const teams = await prisma.team.findMany({
    include: {
      skills: { include: { skill: true } },
      members: {
        include: {
          user: {
            include: { skills: true }
          }
        }
      }
    }
  });

  console.log(`✅ Encontrados ${teams.length} equipos`);
  console.log("");
  console.log("======================================================================");
  console.log("");

  let totalSkillsRemoved = 0;
  let teamsUpdated = 0;

  for (const team of teams) {
    let skillsRemovedFromTeam = 0;
    const orphanSkills = [];
    
    // Verificar cada skill del equipo
    for (const teamSkill of team.skills) {
      // Verificar si algún miembro tiene esta skill
      const hasMemberWithSkill = team.members.some(member =>
        member.user.skills.some(userSkill => userSkill.skillId === teamSkill.skillId)
      );

      if (!hasMemberWithSkill) {
        // Ningún miembro tiene esta skill, es huérfana
        orphanSkills.push(teamSkill);
      }
    }

    // Si encontramos skills huérfanas, eliminarlas
    if (orphanSkills.length > 0) {
      console.log(`🔧 Procesando: ${team.name} (ID: ${team.id})`);
      console.log(`   Total skills: ${team.skills.length}`);
      console.log(`   Skills huérfanas: ${orphanSkills.length}`);
      console.log(`   Miembros: ${team.members.length}`);
      console.log("");

      for (const orphanSkill of orphanSkills) {
        try {
          await prisma.teamSkill.delete({
            where: { id: orphanSkill.id }
          });
          
          console.log(`   ❌ Eliminada skill huérfana: "${orphanSkill.skill.name}"`);
          skillsRemovedFromTeam++;
          totalSkillsRemoved++;
        } catch (e) {
          console.warn(`   ⚠️  Error eliminando skill "${orphanSkill.skill.name}":`, e.message);
        }
      }

      console.log(`   ✅ Eliminadas ${skillsRemovedFromTeam} skills del equipo`);
      console.log("");
      teamsUpdated++;
    }
  }

  // Resumen final
  console.log("======================================================================");
  console.log("📊 RESUMEN DE LIMPIEZA:");
  console.log("======================================================================");
  console.log(`Total de equipos analizados: ${teams.length}`);
  console.log(`Equipos actualizados: ${teamsUpdated}`);
  console.log(`Skills huérfanas eliminadas: ${totalSkillsRemoved}`);
  console.log("======================================================================");
  console.log("");

  if (totalSkillsRemoved > 0) {
    console.log("🎉 Limpieza completada exitosamente");
    console.log("💡 Los equipos ahora solo tienen skills de sus miembros activos");
  } else {
    console.log("✅ No se encontraron skills huérfanas");
    console.log("💡 El sistema está sincronizado correctamente");
  }
  console.log("");

  // Verificación final
  console.log("======================================================================");
  console.log("🔍 VERIFICACIÓN FINAL:");
  console.log("======================================================================");
  console.log("");

  const verifyTeams = await prisma.team.findMany({
    include: {
      skills: { include: { skill: true } },
      members: { include: { user: { include: { skills: true } } } }
    }
  });

  for (const team of verifyTeams) {
    if (team.skills.length > 0) {
      // Verificar que todas las skills del equipo existen en al menos un miembro
      let allValid = true;
      for (const teamSkill of team.skills) {
        const hasMember = team.members.some(m =>
          m.user.skills.some(s => s.skillId === teamSkill.skillId)
        );
        if (!hasMember) {
          allValid = false;
          break;
        }
      }

      if (allValid) {
        console.log(`${team.name}:`);
        console.log(`  Miembros: ${team.members.length}`);
        console.log(`  Skills: ${team.skills.length}`);
        console.log(`  ✅ Todas las skills válidas`);
      } else {
        console.log(`${team.name}:`);
        console.log(`  Miembros: ${team.members.length}`);
        console.log(`  Skills: ${team.skills.length}`);
        console.log(`  ⚠️  Aún tiene skills huérfanas`);
      }
      console.log("");
    }
  }

  console.log("✅ Proceso completado");
  console.log("");
}

cleanupOrphanTeamSkills()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Error:", e);
    prisma.$disconnect();
    process.exit(1);
  });
