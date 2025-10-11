import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/bridge_dev'
    }
  }
});

async function main() {
  try {
    console.log('🔍 VERIFICANDO BUG DE MATCHING\n');
    
    // Buscar el proyecto
    const projectId = 'cmglvowz40001n5jgan5tle1q';
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        skills: {
          include: { skill: true }
        }
      }
    });
    
    if (!project) {
      console.log('❌ Proyecto no encontrado en LOCAL');
      return;
    }
    
    console.log('📋 PROYECTO:', project.title);
    console.log('   Total Skills:', project.skills.length);
    console.log('\n🎯 Skills del proyecto:');
    project.skills.forEach((ps, i) => {
      console.log(`   ${i + 1}. ${ps.skill.name} (Level ${ps.levelRequired || 'N/A'})`);
    });
    
    // Obtener equipos
    const teams = ['DevTeam FullStack', 'DevTeam Backend', 'DevTeam Frontend'];
    
    for (const teamName of teams) {
      console.log(`\n\n📦 EQUIPO: ${teamName}`);
      console.log('─'.repeat(50));
      
      const team = await prisma.team.findFirst({
        where: { name: teamName },
        include: {
          skills: { include: { skill: true } },
          members: {
            include: {
              user: {
                include: {
                  skills: {
                    include: { skill: true }
                  }
                }
              }
            }
          }
        }
      });
      
      if (!team) {
        console.log('❌ Equipo no encontrado');
        continue;
      }
      
      // Obtener skills del equipo desde UserSkills (nivel máximo por skill)
      const teamSkillsMap = new Map();
      
      for (const member of team.members) {
        for (const userSkill of member.user.skills) {
          const skillId = userSkill.skillId;
          const currentMax = teamSkillsMap.get(skillId) || { name: userSkill.skill.name, level: 0 };
          
          if (userSkill.level > currentMax.level) {
            teamSkillsMap.set(skillId, {
              name: userSkill.skill.name,
              level: userSkill.level
            });
          }
        }
      }
      
      console.log(`\n   Skills únicos del equipo: ${teamSkillsMap.size}`);
      
      // Comparar con skills del proyecto
      const projectSkillIds = new Set(project.skills.map(ps => ps.skillId));
      const projectSkillNames = project.skills.map(ps => ps.skill.name);
      
      let matchCount = 0;
      let partialMatchCount = 0;
      const matchingSkills = [];
      const partialSkills = [];
      const missingSkills = [];
      
      console.log('\n   ✅ MATCHING:');
      for (const ps of project.skills) {
        const teamSkill = teamSkillsMap.get(ps.skillId);
        
        if (teamSkill) {
          const requiredLevel = ps.levelRequired || 1;
          
          if (teamSkill.level >= requiredLevel) {
            matchCount++;
            matchingSkills.push(ps.skill.name);
            console.log(`      ✅ ${ps.skill.name}: Tiene nivel ${teamSkill.level} (requiere ${requiredLevel})`);
          } else if (teamSkill.level === requiredLevel - 1) {
            partialMatchCount++;
            partialSkills.push(ps.skill.name);
            console.log(`      ⚠️  ${ps.skill.name}: Tiene nivel ${teamSkill.level} (requiere ${requiredLevel}) - PARCIAL`);
          } else {
            missingSkills.push(ps.skill.name);
            console.log(`      ❌ ${ps.skill.name}: Tiene nivel ${teamSkill.level} (requiere ${requiredLevel}) - BAJO`);
          }
        } else {
          missingSkills.push(ps.skill.name);
          console.log(`      ❌ ${ps.skill.name}: NO LA TIENE`);
        }
      }
      
      // Cálculo ACTUAL del backend (con unitScore)
      const totalUnits = matchCount + (partialMatchCount * 0.5);
      const backendCoverage = (totalUnits / project.skills.length) * 100;
      
      // Cálculo ESPERADO por AI (simple match)
      const simpleCoverage = (matchCount / project.skills.length) * 100;
      
      console.log('\n   📊 CÁLCULOS:');
      console.log(`      Skills que cumplen nivel: ${matchCount}/${project.skills.length}`);
      console.log(`      Skills parciales (nivel-1): ${partialMatchCount}`);
      console.log(`      Skills faltantes: ${missingSkills.length}`);
      
      console.log('\n   🔢 ALGORITMO ACTUAL (Backend):');
      console.log(`      Units = ${matchCount} + (${partialMatchCount} × 0.5) = ${totalUnits}`);
      console.log(`      Coverage = ${totalUnits} / ${project.skills.length} × 100 = ${backendCoverage.toFixed(2)}%`);
      console.log(`      Score (70% peso) = ${backendCoverage.toFixed(2)}% × 0.7 = ${(backendCoverage * 0.7).toFixed(1)} pts`);
      
      console.log('\n   💡 ALGORITMO ESPERADO (AI):');
      console.log(`      Matching = ${matchCount} / ${project.skills.length} × 100 = ${simpleCoverage.toFixed(2)}%`);
      console.log(`      Score (70% peso) = ${simpleCoverage.toFixed(2)}% × 0.7 = ${(simpleCoverage * 0.7).toFixed(1)} pts`);
      
      console.log('\n   📈 DIFERENCIA:');
      console.log(`      ${(simpleCoverage - backendCoverage).toFixed(2)} puntos porcentuales`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
