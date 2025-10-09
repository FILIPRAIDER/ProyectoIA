import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Script para diagnosticar el problema del avatar
 * Verifica si los usuarios tienen avatarUrl guardado
 */
async function diagnoseAvatarIssue() {
  console.log("======================================================================");
  console.log("🔍 DIAGNÓSTICO: Avatar URL en Base de Datos");
  console.log("======================================================================");
  console.log("");

  // Obtener todos los usuarios
  const users = await prisma.user.findMany({
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
          avatarProvider: true,
        }
      }
    }
  });

  console.log(`📊 Total de usuarios en DB: ${users.length}`);
  console.log("");

  let usersWithAvatarInUser = 0;
  let usersWithAvatarInProfile = 0;
  let usersWithoutAvatar = 0;
  let inconsistencies = 0;

  console.log("======================================================================");
  console.log("📋 ANÁLISIS POR USUARIO:");
  console.log("======================================================================");
  console.log("");

  for (const user of users) {
    const hasAvatarInUser = !!user.avatarUrl;
    const hasAvatarInProfile = !!user.profile?.avatarUrl;

    console.log(`👤 ${user.name} (${user.role})`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   User.avatarUrl: ${user.avatarUrl || 'NULL'}`);
    console.log(`   Profile.avatarUrl: ${user.profile?.avatarUrl || 'NULL'}`);
    console.log(`   Profile.avatarKey: ${user.profile?.avatarKey || 'NULL'}`);

    if (hasAvatarInUser && hasAvatarInProfile) {
      if (user.avatarUrl === user.profile.avatarUrl) {
        console.log(`   ✅ Consistente: Avatar en ambos lugares`);
        usersWithAvatarInUser++;
        usersWithAvatarInProfile++;
      } else {
        console.log(`   ⚠️  INCONSISTENCIA: URLs diferentes`);
        console.log(`       User: ${user.avatarUrl}`);
        console.log(`       Profile: ${user.profile.avatarUrl}`);
        inconsistencies++;
      }
    } else if (hasAvatarInUser && !hasAvatarInProfile) {
      console.log(`   ⚠️  Avatar solo en User, falta en Profile`);
      usersWithAvatarInUser++;
      inconsistencies++;
    } else if (!hasAvatarInUser && hasAvatarInProfile) {
      console.log(`   ⚠️  Avatar solo en Profile, falta en User`);
      usersWithAvatarInProfile++;
      inconsistencies++;
    } else {
      console.log(`   ℹ️  Sin avatar configurado`);
      usersWithoutAvatar++;
    }
    console.log("");
  }

  console.log("======================================================================");
  console.log("📊 RESUMEN:");
  console.log("======================================================================");
  console.log(`Total usuarios: ${users.length}`);
  console.log(`Con avatar en User: ${usersWithAvatarInUser}`);
  console.log(`Con avatar en Profile: ${usersWithAvatarInProfile}`);
  console.log(`Sin avatar: ${usersWithoutAvatar}`);
  console.log(`Inconsistencias: ${inconsistencies}`);
  console.log("");

  // Buscar el usuario específico del frontend
  const targetUserId = "cmgiw6p640004mazji8kolds4";
  const targetUser = users.find(u => u.id === targetUserId);

  if (targetUser) {
    console.log("======================================================================");
    console.log("🎯 USUARIO ESPECÍFICO DEL REPORTE:");
    console.log("======================================================================");
    console.log(`👤 ${targetUser.name}`);
    console.log(`   ID: ${targetUser.id}`);
    console.log(`   Email: ${targetUser.email}`);
    console.log(`   Role: ${targetUser.role}`);
    console.log(`   User.avatarUrl: ${targetUser.avatarUrl || 'NULL'}`);
    console.log(`   Profile.avatarUrl: ${targetUser.profile?.avatarUrl || 'NULL'}`);
    console.log(`   Profile.avatarKey: ${targetUser.profile?.avatarKey || 'NULL'}`);
    console.log("");

    if (!targetUser.avatarUrl && !targetUser.profile?.avatarUrl) {
      console.log("❌ PROBLEMA CONFIRMADO: Usuario no tiene avatar en ninguna tabla");
      console.log("   Esto confirma el bug reportado por el frontend");
    } else {
      console.log("✅ Usuario tiene avatar configurado");
    }
    console.log("");
  } else {
    console.log("⚠️  Usuario del reporte no encontrado en DB");
    console.log(`   Buscando ID: ${targetUserId}`);
    console.log("");
  }

  console.log("======================================================================");
  console.log("");
}

diagnoseAvatarIssue()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Error:", e);
    prisma.$disconnect();
    process.exit(1);
  });
