#!/usr/bin/env node
/**
 * Script para verificar el endpoint de avatar y la estructura de la base de datos
 * Analiza el usuario específico reportado por el frontend
 */

import { prisma } from "../src/lib/prisma.js";

const TARGET_USER_ID = "cmgiw6p640004mazji8kolds4";

async function verifyAvatarEndpoint() {
  try {
    console.log("🔍 Verificando endpoint de avatar y estructura de DB\n");

    // 1. Verificar el usuario reportado
    console.log("=" .repeat(60));
    console.log("1️⃣ VERIFICANDO USUARIO REPORTADO POR FRONTEND");
    console.log("=" .repeat(60));
    
    const targetUser = await prisma.user.findUnique({
      where: { id: TARGET_USER_ID },
      include: {
        profile: true,
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        }
      }
    });

    if (!targetUser) {
      console.log("❌ Usuario no encontrado en DB");
      return;
    }

    console.log("\n📊 Datos del usuario:");
    console.log(`ID: ${targetUser.id}`);
    console.log(`Email: ${targetUser.email}`);
    console.log(`Nombre: ${targetUser.name}`);
    console.log(`Role: ${targetUser.role}`);
    console.log(`User.avatarUrl: ${targetUser.avatarUrl || 'NULL'}`);
    console.log(`Profile existe: ${targetUser.profile ? 'SÍ' : 'NO'}`);
    
    if (targetUser.profile) {
      console.log(`Profile.avatarUrl: ${targetUser.profile.avatarUrl || 'NULL'}`);
      console.log(`Profile.avatarKey: ${targetUser.profile.avatarKey || 'NULL'}`);
      console.log(`Profile.avatarProvider: ${targetUser.profile.avatarProvider || 'NULL'}`);
    }

    if (targetUser.company) {
      console.log(`Company: ${targetUser.company.name}`);
      console.log(`Company.logoUrl: ${targetUser.company.logoUrl || 'NULL'}`);
    }

    // 2. Verificar estructura de la tabla User
    console.log("\n" + "=".repeat(60));
    console.log("2️⃣ VERIFICANDO ESTRUCTURA DE TABLA USER");
    console.log("=" .repeat(60));
    
    const userFields = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'User'
      AND column_name IN ('id', 'avatarUrl')
      ORDER BY ordinal_position;
    `;
    
    console.log("\n✅ Campos de tabla User:");
    console.table(userFields);

    // 3. Verificar estructura de la tabla MemberProfile
    console.log("\n" + "=".repeat(60));
    console.log("3️⃣ VERIFICANDO ESTRUCTURA DE TABLA MEMBERPROFILE");
    console.log("=" .repeat(60));
    
    const profileFields = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'MemberProfile'
      AND column_name LIKE '%avatar%'
      ORDER BY ordinal_position;
    `;
    
    console.log("\n✅ Campos de avatar en MemberProfile:");
    console.table(profileFields);

    // 4. Verificar usuarios con avatar funcionando correctamente
    console.log("\n" + "=".repeat(60));
    console.log("4️⃣ USUARIOS CON AVATAR FUNCIONANDO (para comparar)");
    console.log("=" .repeat(60));
    
    const usersWithAvatar = await prisma.user.findMany({
      where: {
        avatarUrl: { not: null }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        profile: {
          select: {
            avatarUrl: true,
            avatarKey: true,
            avatarProvider: true
          }
        }
      },
      take: 5
    });

    if (usersWithAvatar.length > 0) {
      console.log(`\n✅ ${usersWithAvatar.length} usuarios con avatar funcionando:\n`);
      usersWithAvatar.forEach((user, idx) => {
        console.log(`${idx + 1}. ${user.name} (${user.role})`);
        console.log(`   User.avatarUrl: ${user.avatarUrl ? '✅ Sí' : '❌ No'}`);
        console.log(`   Profile.avatarUrl: ${user.profile?.avatarUrl ? '✅ Sí' : '❌ No'}`);
        console.log(`   Consistente: ${user.avatarUrl === user.profile?.avatarUrl ? '✅ Sí' : '⚠️ No'}`);
        console.log("");
      });
    } else {
      console.log("\n⚠️ No hay usuarios con avatar en la base de datos");
    }

    // 5. Análisis y diagnóstico
    console.log("\n" + "=".repeat(60));
    console.log("5️⃣ DIAGNÓSTICO");
    console.log("=" .repeat(60));
    
    if (!targetUser.avatarUrl && !targetUser.profile?.avatarUrl) {
      console.log("\n❌ PROBLEMA CONFIRMADO:");
      console.log("   - Usuario no tiene avatar en User.avatarUrl");
      console.log("   - Usuario no tiene avatar en Profile.avatarUrl");
      console.log("   - El upload NO está persistiendo en DB");
      
      console.log("\n🔍 POSIBLES CAUSAS:");
      console.log("   1. El endpoint NO está ejecutando el UPDATE a DB");
      console.log("   2. El transaction está fallando silenciosamente");
      console.log("   3. El userId que recibe el endpoint es diferente");
      console.log("   4. Hay un error de permissions que bloquea el UPDATE");
      
      console.log("\n✅ SOLUCIÓN:");
      console.log("   El código del endpoint es correcto.");
      console.log("   Verificar logs del servidor cuando el frontend hace upload:");
      console.log(`   - Buscar: "📝 [Avatar Upload] Guardando en DB para usuario: ${TARGET_USER_ID}"`);
      console.log(`   - Buscar: "✅ Avatar actualizado para usuario ${TARGET_USER_ID}"`);
      console.log("   - Si NO aparecen estos logs = el endpoint NO se está ejecutando");
      console.log("   - Si SÍ aparecen = hay un problema con Prisma/DB");
      
    } else if (targetUser.avatarUrl && !targetUser.profile?.avatarUrl) {
      console.log("\n⚠️ INCONSISTENCIA DETECTADA:");
      console.log("   - User.avatarUrl existe ✅");
      console.log("   - Profile.avatarUrl NO existe ❌");
      console.log("   - El upsert de profile está fallando");
      
    } else if (!targetUser.avatarUrl && targetUser.profile?.avatarUrl) {
      console.log("\n⚠️ INCONSISTENCIA DETECTADA:");
      console.log("   - User.avatarUrl NO existe ❌");
      console.log("   - Profile.avatarUrl existe ✅");
      console.log("   - El update de User está fallando");
      
    } else {
      console.log("\n✅ TODO CORRECTO:");
      console.log("   - User.avatarUrl existe ✅");
      console.log("   - Profile.avatarUrl existe ✅");
      console.log("   - Ambos coinciden ✅");
    }

    // 6. Test rápido de endpoint (simulación)
    console.log("\n" + "=".repeat(60));
    console.log("6️⃣ TEST SIMULADO DE ENDPOINT");
    console.log("=" .repeat(60));
    
    console.log("\n📋 URL del endpoint:");
    console.log(`   POST /uploads/users/${TARGET_USER_ID}/avatar`);
    
    console.log("\n📋 Request esperado del frontend:");
    console.log(`   Content-Type: multipart/form-data`);
    console.log(`   Body: file=[binary image data]`);
    
    console.log("\n📋 Response esperada:");
    console.log(`   {`);
    console.log(`     "ok": true,`);
    console.log(`     "success": true,`);
    console.log(`     "url": "https://ik.imagekit.io/...",`);
    console.log(`     "fileId": "..."`);
    console.log(`   }`);
    
    console.log("\n📋 Después del upload, verificar en DB:");
    console.log(`   SELECT id, avatarUrl FROM "User" WHERE id = '${TARGET_USER_ID}';`);
    console.log(`   SELECT userId, avatarUrl FROM "MemberProfile" WHERE "userId" = '${TARGET_USER_ID}';`);

    console.log("\n✅ Script completado");

  } catch (error) {
    console.error("\n❌ Error ejecutando verificación:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
verifyAvatarEndpoint()
  .catch((error) => {
    console.error("Error fatal:", error);
    process.exit(1);
  });
