// scripts/test-notifications.js
import { prisma } from "../src/lib/prisma.js";
import { createNotification, getUserNotifications } from "../src/lib/notifications.js";

async function testNotifications() {
  console.log("\n🧪 Iniciando pruebas del sistema de notificaciones...\n");

  try {
    // 1. Verificar que la tabla existe
    console.log("1️⃣ Verificando que la tabla Notification existe...");
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `;
    console.log("✅ Tabla notifications existe:", tableCheck);

    // 2. Obtener un usuario de prueba
    console.log("\n2️⃣ Buscando usuario de prueba...");
    const testUser = await prisma.user.findFirst({
      select: { id: true, email: true, name: true },
    });

    if (!testUser) {
      console.log("❌ No hay usuarios en la base de datos. Crea uno primero.");
      return;
    }

    console.log(`✅ Usuario de prueba: ${testUser.name} (${testUser.email})`);

    // 3. Crear notificación de prueba
    console.log("\n3️⃣ Creando notificación de prueba...");
    const notification = await createNotification({
      userId: testUser.id,
      type: "REMINDER",
      title: "Notificación de prueba",
      message: "Esta es una notificación de prueba del sistema",
      data: {
        test: true,
        timestamp: new Date().toISOString(),
      },
      actionUrl: "/dashboard",
    });

    console.log("✅ Notificación creada:", {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      read: notification.read,
    });

    // 4. Obtener notificaciones del usuario
    console.log("\n4️⃣ Obteniendo notificaciones del usuario...");
    const result = await getUserNotifications({
      userId: testUser.id,
      limit: 10,
    });

    console.log(`✅ Notificaciones encontradas: ${result.total}`);
    console.log(`   No leídas: ${result.unreadCount}`);
    console.log(`   Últimas ${result.notifications.length}:`);

    result.notifications.forEach((n, i) => {
      console.log(`   ${i + 1}. [${n.read ? "✓" : "○"}] ${n.title} - ${n.type}`);
    });

    // 5. Contar todas las notificaciones
    console.log("\n5️⃣ Estadísticas globales...");
    const totalCount = await prisma.notification.count();
    const unreadCount = await prisma.notification.count({
      where: { read: false },
    });

    console.log(`✅ Total de notificaciones en sistema: ${totalCount}`);
    console.log(`   No leídas: ${unreadCount}`);
    console.log(`   Leídas: ${totalCount - unreadCount}`);

    // 6. Limpiar notificación de prueba
    console.log("\n6️⃣ Limpiando notificación de prueba...");
    await prisma.notification.delete({
      where: { id: notification.id },
    });
    console.log("✅ Notificación de prueba eliminada");

    console.log("\n✅ ¡Todas las pruebas pasaron exitosamente!\n");
    console.log("📊 Resumen:");
    console.log(`   - Tabla notifications: OK`);
    console.log(`   - Crear notificación: OK`);
    console.log(`   - Obtener notificaciones: OK`);
    console.log(`   - Eliminar notificación: OK`);
    console.log(`   - Total en sistema: ${totalCount - 1} (después de limpieza)`);
  } catch (error) {
    console.error("\n❌ Error en las pruebas:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar pruebas
testNotifications()
  .then(() => {
    console.log("\n🎉 Script completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script falló:", error.message);
    process.exit(1);
  });
