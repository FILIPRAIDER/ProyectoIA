import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Script para corregir inconsistencias de avatares
 * - Usuarios con avatar en User pero no en Profile → Copia a Profile
 * - Usuarios con avatar en Profile pero no en User → Copia a User
 */
async function fixAvatarInconsistencies() {
  console.log("======================================================================");
  console.log("🔧 CORRECCIÓN DE INCONSISTENCIAS DE AVATARES");
  console.log("======================================================================");
  console.log("");

  // Obtener todos los usuarios
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      profile: {
        select: {
          id: true,
          avatarUrl: true,
          avatarKey: true,
          avatarProvider: true,
        }
      }
    }
  });

  let fixed = 0;
  let profilesCreated = 0;

  for (const user of users) {
    const hasAvatarInUser = !!user.avatarUrl;
    const hasAvatarInProfile = !!user.profile?.avatarUrl;

    // Caso 1: Avatar en User pero no en Profile
    if (hasAvatarInUser && !hasAvatarInProfile) {
      console.log(`🔧 Corrigiendo: ${user.name}`);
      console.log(`   User.avatarUrl: ${user.avatarUrl}`);
      console.log(`   Profile.avatarUrl: NULL`);
      console.log(`   Acción: Copiar a Profile`);

      try {
        if (user.profile) {
          // Profile existe, solo actualizar
          await prisma.memberProfile.update({
            where: { id: user.profile.id },
            data: {
              avatarUrl: user.avatarUrl,
              avatarProvider: user.avatarUrl.includes('imagekit') ? 'imagekit' : 'external',
            }
          });
          console.log(`   ✅ Profile actualizado`);
        } else {
          // Profile no existe, crear
          await prisma.memberProfile.create({
            data: {
              userId: user.id,
              avatarUrl: user.avatarUrl,
              avatarProvider: user.avatarUrl.includes('imagekit') ? 'imagekit' : 'external',
            }
          });
          console.log(`   ✅ Profile creado con avatar`);
          profilesCreated++;
        }
        fixed++;
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log("");
    }

    // Caso 2: Avatar en Profile pero no en User
    if (!hasAvatarInUser && hasAvatarInProfile) {
      console.log(`🔧 Corrigiendo: ${user.name}`);
      console.log(`   User.avatarUrl: NULL`);
      console.log(`   Profile.avatarUrl: ${user.profile.avatarUrl}`);
      console.log(`   Acción: Copiar a User`);

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            avatarUrl: user.profile.avatarUrl
          }
        });
        console.log(`   ✅ User actualizado`);
        fixed++;
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log("");
    }

    // Caso 3: URLs diferentes (inconsistencia)
    if (hasAvatarInUser && hasAvatarInProfile && user.avatarUrl !== user.profile.avatarUrl) {
      console.log(`🔧 Corrigiendo: ${user.name}`);
      console.log(`   User.avatarUrl: ${user.avatarUrl}`);
      console.log(`   Profile.avatarUrl: ${user.profile.avatarUrl}`);
      console.log(`   Acción: Usar la de User (más reciente probablemente)`);

      try {
        await prisma.memberProfile.update({
          where: { id: user.profile.id },
          data: {
            avatarUrl: user.avatarUrl
          }
        });
        console.log(`   ✅ Profile sincronizado con User`);
        fixed++;
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      console.log("");
    }
  }

  console.log("======================================================================");
  console.log("📊 RESUMEN:");
  console.log("======================================================================");
  console.log(`Total usuarios analizados: ${users.length}`);
  console.log(`Inconsistencias corregidas: ${fixed}`);
  console.log(`Profiles creados: ${profilesCreated}`);
  console.log("");

  if (fixed > 0) {
    console.log("🎉 Correcciones aplicadas exitosamente");
    console.log("💡 Los avatares ahora están sincronizados");
  } else {
    console.log("✅ No se encontraron inconsistencias");
  }
  console.log("");

  // Verificación final
  console.log("======================================================================");
  console.log("🔍 VERIFICACIÓN FINAL:");
  console.log("======================================================================");
  console.log("");

  const verifyUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      profile: {
        select: {
          avatarUrl: true
        }
      }
    }
  });

  let consistent = 0;
  let inconsistent = 0;

  for (const user of verifyUsers) {
    const hasAvatarInUser = !!user.avatarUrl;
    const hasAvatarInProfile = !!user.profile?.avatarUrl;

    if (hasAvatarInUser && hasAvatarInProfile) {
      if (user.avatarUrl === user.profile.avatarUrl) {
        consistent++;
      } else {
        inconsistent++;
        console.log(`⚠️  ${user.name}: URLs diferentes`);
      }
    } else if (hasAvatarInUser !== hasAvatarInProfile) {
      inconsistent++;
      console.log(`⚠️  ${user.name}: Avatar solo en ${hasAvatarInUser ? 'User' : 'Profile'}`);
    }
  }

  console.log("");
  console.log(`Usuarios con avatar consistente: ${consistent}`);
  console.log(`Usuarios con inconsistencias: ${inconsistent}`);
  console.log("");

  if (inconsistent === 0) {
    console.log("✅ Todos los avatares están consistentes");
  } else {
    console.log("⚠️  Aún hay inconsistencias - revisar manualmente");
  }
  console.log("");

  console.log("✅ Proceso completado");
  console.log("");
}

fixAvatarInconsistencies()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Error:", e);
    prisma.$disconnect();
    process.exit(1);
  });
