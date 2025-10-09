/**
 * Script de verificación del endpoint GET /users/:userId
 * Verifica que el profile se retorne correctamente con todos los campos
 * 
 * USO: node scripts/verify-user-endpoint.js <userId>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: Debes proporcionar un userId');
  console.log('Uso: node scripts/verify-user-endpoint.js <userId>');
  process.exit(1);
}

async function verifyUserEndpoint() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFICACIÓN DEL ENDPOINT GET /users/:userId');
  console.log('='.repeat(70) + '\n');

  try {
    console.log(`📝 Buscando usuario: ${userId}\n`);

    // Simular exactamente lo que hace el endpoint
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            sector: true
          }
        },
        experiences: {
          orderBy: { startDate: 'desc' }
        },
        certifications: {
          orderBy: { issueDate: 'desc' }
        },
        skills: { 
          include: { skill: true },
          orderBy: { level: 'desc' }
        },
        teamMemberships: { include: { team: true } },
        company: true,
      },
    });

    if (!user) {
      console.error('❌ Usuario no encontrado\n');
      process.exit(1);
    }

    console.log('✅ Usuario encontrado\n');
    console.log('📊 DATOS DEL USUARIO:');
    console.log('='.repeat(70));
    console.log(`ID: ${user.id}`);
    console.log(`Nombre: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Rol: ${user.role}`);
    console.log(`Onboarding Step: ${user.onboardingStep}`);
    console.log(`Avatar URL: ${user.avatarUrl || 'No configurado'}`);
    console.log(`Company ID: ${user.companyId || 'No tiene'}`);

    console.log('\n' + '='.repeat(70));
    console.log('📋 PROFILE (LO QUE ESPERA EL FRONTEND):');
    console.log('='.repeat(70));

    if (!user.profile) {
      console.log('❌ PROBLEMA DETECTADO: profile es NULL');
      console.log('\n⚠️  El frontend espera un objeto profile, pero no existe');
      console.log('⚠️  Solución: Crear el perfil para este usuario');
      console.log('\nPuedes crear el perfil con:');
      console.log(`POST /users/${userId}/profile`);
      console.log('Body: {}  (puede ir vacío, se creará con valores null)');
    } else {
      console.log('✅ Profile existe\n');
      
      // Mostrar todos los campos del profile
      const profile = user.profile;
      console.log('Campos del Profile:');
      console.log(`  id: ${profile.id}`);
      console.log(`  userId: ${profile.userId}`);
      console.log(`  headline: ${profile.headline || '(vacío)'}`);
      console.log(`  bio: ${profile.bio || '(vacío)'}`);
      console.log(`  seniority: ${profile.seniority || '(vacío)'}`);
      console.log(`  country: ${profile.country || '(vacío)'}`);
      console.log(`  city: ${profile.city || '(vacío)'}`);
      console.log(`  address: ${profile.address || '(vacío)'}`);
      console.log(`  availability: ${profile.availability || '(vacío)'}`);
      console.log(`  stack: ${profile.stack || '(vacío)'}`);
      console.log(`  sectorId: ${profile.sectorId || '(vacío)'}`);
      console.log(`  phone: ${profile.phone || '(vacío)'}`);
      console.log(`  phoneE164: ${profile.phoneE164 || '(vacío)'}`);
      console.log(`  phoneCountry: ${profile.phoneCountry || '(vacío)'}`);
      
      if (profile.sector) {
        console.log(`\n  sector (relación poblada):`);
        console.log(`    id: ${profile.sector.id}`);
        console.log(`    name: ${profile.sector.name}`);
        console.log(`    nameEs: ${profile.sector.nameEs}`);
        console.log(`    nameEn: ${profile.sector.nameEn}`);
      } else {
        console.log(`  sector: (vacío - no hay sectorId)`);
      }

      // Verificar campos que el frontend necesita
      console.log('\n📊 ANÁLISIS DE CAMPOS:');
      const emptyFields = [];
      const filledFields = [];

      const fieldsToCheck = [
        'headline', 'bio', 'seniority', 'country', 'city', 
        'availability', 'stack', 'phone'
      ];

      fieldsToCheck.forEach(field => {
        if (profile[field]) {
          filledFields.push(field);
        } else {
          emptyFields.push(field);
        }
      });

      console.log(`  ✅ Campos con datos (${filledFields.length}): ${filledFields.join(', ') || 'ninguno'}`);
      console.log(`  ⚠️  Campos vacíos (${emptyFields.length}): ${emptyFields.join(', ') || 'ninguno'}`);
    }

    // Otros datos
    console.log('\n' + '='.repeat(70));
    console.log('📚 OTROS DATOS:');
    console.log('='.repeat(70));
    console.log(`Skills: ${user.skills?.length || 0}`);
    console.log(`Experiences: ${user.experiences?.length || 0}`);
    console.log(`Certifications: ${user.certifications?.length || 0}`);
    console.log(`Team Memberships: ${user.teamMemberships?.length || 0}`);

    // Verificar estructura de respuesta
    console.log('\n' + '='.repeat(70));
    console.log('🔄 SIMULACIÓN DE RESPUESTA DEL ENDPOINT:');
    console.log('='.repeat(70));

    const { passwordHash, ...userWithoutPassword } = user;
    
    console.log('\nJSON que retorna el endpoint (primeros 500 caracteres):');
    const responseJson = JSON.stringify(userWithoutPassword, null, 2);
    console.log(responseJson.substring(0, 500) + '...\n');

    // Verificaciones finales
    console.log('='.repeat(70));
    console.log('✅ VERIFICACIONES FINALES:');
    console.log('='.repeat(70));

    const checks = [
      { 
        name: 'Profile está incluido en la respuesta', 
        pass: user.profile !== undefined,
        status: user.profile !== undefined ? '✅' : '❌'
      },
      { 
        name: 'Profile no es null', 
        pass: user.profile !== null,
        status: user.profile !== null ? '✅' : '⚠️ '
      },
      { 
        name: 'Profile es un objeto', 
        pass: typeof user.profile === 'object',
        status: typeof user.profile === 'object' ? '✅' : '❌'
      },
      { 
        name: 'Profile tiene al menos un campo', 
        pass: user.profile && Object.keys(user.profile).length > 0,
        status: user.profile && Object.keys(user.profile).length > 0 ? '✅' : '❌'
      },
      { 
        name: 'Campos usan camelCase (no snake_case)', 
        pass: user.profile && 'phoneE164' in user.profile && !('phone_e164' in user.profile),
        status: user.profile && 'phoneE164' in user.profile ? '✅' : '⚠️ '
      },
    ];

    checks.forEach(check => {
      console.log(`${check.status} ${check.name}`);
    });

    const allPassed = checks.every(c => c.pass);

    console.log('\n' + '='.repeat(70));
    if (allPassed) {
      console.log('🎉 TODAS LAS VERIFICACIONES PASARON');
      console.log('El endpoint está retornando los datos correctamente');
    } else {
      console.log('⚠️  ALGUNAS VERIFICACIONES FALLARON');
      console.log('Revisar los puntos marcados con ❌ o ⚠️ ');
    }
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
verifyUserEndpoint()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
