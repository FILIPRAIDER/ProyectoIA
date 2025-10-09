/**
 * Script para crear perfiles vacíos para usuarios que no tienen
 * 
 * Este script:
 * 1. Busca usuarios sin perfil (profile == null)
 * 2. Crea un perfil vacío para cada uno
 * 3. Reporta los resultados
 * 
 * USO: node scripts/create-missing-profiles.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMissingProfiles() {
  console.log('\n' + '='.repeat(70));
  console.log('🔧 CREANDO PERFILES FALTANTES');
  console.log('='.repeat(70) + '\n');

  try {
    // 1. Buscar usuarios sin perfil
    console.log('📝 Buscando usuarios sin perfil...\n');
    
    const usersWithoutProfile = await prisma.user.findMany({
      where: {
        profile: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    if (usersWithoutProfile.length === 0) {
      console.log('✅ Todos los usuarios ya tienen perfil creado\n');
      return;
    }

    console.log(`⚠️  Encontrados ${usersWithoutProfile.length} usuarios sin perfil:\n`);
    
    usersWithoutProfile.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Rol: ${user.role}`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('⚙️  CREANDO PERFILES...\n');

    let created = 0;
    let errors = 0;

    for (const user of usersWithoutProfile) {
      try {
        const profile = await prisma.memberProfile.create({
          data: {
            userId: user.id,
            // Todos los campos opcionales, se crean como null
          }
        });
        
        console.log(`✅ Perfil creado para: ${user.name} (${user.email})`);
        created++;
      } catch (error) {
        console.error(`❌ Error creando perfil para ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN:');
    console.log('='.repeat(70));
    console.log(`✅ Perfiles creados: ${created}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📋 Total procesados: ${usersWithoutProfile.length}`);
    console.log('='.repeat(70) + '\n');

    if (created > 0) {
      console.log('🎉 Perfiles creados exitosamente');
      console.log('💡 Los usuarios ahora pueden editar su perfil en el dashboard\n');
    }

  } catch (error) {
    console.error('\n❌ Error durante la creación de perfiles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
createMissingProfiles()
  .then(() => {
    console.log('✅ Proceso completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
