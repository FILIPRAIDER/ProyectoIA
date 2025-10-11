import { PrismaClient } from '@prisma/client';

// Conexión explícita a LOCAL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres@localhost:5432/bridge_dev'
    }
  }
});

// Mapeo de skills a niveles basado en complejidad
const SKILL_LEVELS = {
  // Nivel 5: Expert (Tecnologías avanzadas/complejas)
  "React": 5,
  "Node.js": 5,
  "TypeScript": 5,
  "PostgreSQL": 5,
  "AWS": 5,
  "Docker": 5,
  "GraphQL": 5,
  "Next.js": 5,
  "Kubernetes": 5,
  "Microservices": 5,
  "System Design": 5,
  "CI/CD": 5,
  "Redis": 5,
  "WebSockets": 5,
  "OAuth": 5,
  
  // Nivel 4: Advanced (Frameworks/herramientas populares)
  "JavaScript": 4,
  "Express.js": 4,
  "MongoDB": 4,
  "Vue.js": 4,
  "Angular": 4,
  "Python": 4,
  "Django": 4,
  "Flask": 4,
  "REST API": 4,
  "Git": 4,
  "Tailwind CSS": 4,
  "Prisma": 4,
  "Testing": 4,
  "Jest": 4,
  "Cypress": 4,
  
  // Nivel 3: Intermediate (Herramientas estándar)
  "HTML5": 3,
  "CSS3": 3,
  "Bootstrap": 3,
  "Sass": 3,
  "jQuery": 3,
  "Figma": 3,
  "UI Design": 3,
  "UX Design": 3,
  "Responsive Design": 3,
  "Agile": 3,
  "Scrum": 3,
  "Jira": 3,
  "React Hook Form": 3,
  "Redux": 3,
  
  // Nivel 2: Basic (Herramientas básicas)
  "HTML": 2,
  "CSS": 2,
  "Photoshop": 2,
  "Illustrator": 2,
  "Wireframing": 2,
  "Prototyping": 2
};

// Años de experiencia basados en nivel
const YEARS_BY_LEVEL = {
  5: 5,  // Expert: 5+ años
  4: 3,  // Advanced: 3+ años
  3: 2,  // Intermediate: 2+ años
  2: 1,  // Basic: 1+ año
  1: 0   // Beginner: < 1 año
};

function getSkillLevel(skillName) {
  // Buscar coincidencia exacta
  if (SKILL_LEVELS[skillName]) {
    return SKILL_LEVELS[skillName];
  }
  
  // Buscar coincidencia parcial (case insensitive)
  const skillLower = skillName.toLowerCase();
  for (const [key, level] of Object.entries(SKILL_LEVELS)) {
    if (skillLower.includes(key.toLowerCase()) || key.toLowerCase().includes(skillLower)) {
      return level;
    }
  }
  
  // Por defecto: nivel 3 (intermedio)
  return 3;
}

async function main() {
  try {
    console.log('🔧 ASIGNANDO NIVELES A TEAMSKILLS EN LOCAL\n');
    
    // Obtener todos los TeamSkills con NULL
    const teamSkills = await prisma.teamSkill.findMany({
      where: {
        OR: [
          { level: null },
          { yearsExperience: null }
        ]
      },
      include: {
        skill: true,
        team: true
      }
    });
    
    console.log(`TeamSkills a actualizar: ${teamSkills.length}\n`);
    
    if (teamSkills.length === 0) {
      console.log('✅ Todos los TeamSkills ya tienen nivel asignado');
      return;
    }
    
    let updated = 0;
    let skipped = 0;
    
    for (const teamSkill of teamSkills) {
      const skillName = teamSkill.skill.name;
      const level = getSkillLevel(skillName);
      const yearsExperience = YEARS_BY_LEVEL[level] || 2;
      
      try {
        await prisma.teamSkill.update({
          where: { id: teamSkill.id },
          data: {
            level,
            yearsExperience
          }
        });
        
        updated++;
        console.log(`✅ ${teamSkill.team.name} - ${skillName}: nivel ${level}, ${yearsExperience} años`);
      } catch (error) {
        skipped++;
        console.log(`⚠️ Error actualizando ${skillName}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`   ✅ Actualizados: ${updated}`);
    console.log(`   ⚠️ Omitidos: ${skipped}`);
    console.log(`   📝 Total procesados: ${teamSkills.length}`);
    
    // Verificar resultado final
    const remaining = await prisma.teamSkill.count({
      where: {
        OR: [
          { level: null },
          { yearsExperience: null }
        ]
      }
    });
    
    console.log(`\n🔍 TeamSkills con NULL restantes: ${remaining}`);
    
    if (remaining === 0) {
      console.log('\n🎉 ¡COMPLETADO! Todos los TeamSkills tienen niveles asignados');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
