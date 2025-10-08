// src/lib/notifications.js
import { prisma } from "./prisma.js";

/**
 * Crea una notificación para un usuario
 * @param {Object} input
 * @param {string} input.userId - ID del usuario que recibirá la notificación
 * @param {string} input.type - Tipo de notificación (NotificationType)
 * @param {string} input.title - Título corto de la notificación
 * @param {string} input.message - Mensaje descriptivo
 * @param {Object} [input.data] - Datos adicionales en formato JSON
 * @param {string} [input.actionUrl] - URL para acción (opcional)
 * @returns {Promise<Object>} La notificación creada
 */
export async function createNotification(input) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data || {},
        actionUrl: input.actionUrl || null,
      },
    });

    console.log(`✅ Notification created: ${notification.type} for user ${input.userId}`);
    return notification;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error;
  }
}

/**
 * Marca una notificación como leída
 * @param {string} notificationId - ID de la notificación
 * @param {string} userId - ID del usuario (validación de propiedad)
 * @returns {Promise<Object>} La notificación actualizada
 */
export async function markAsRead(notificationId, userId) {
  try {
    // Verificar propiedad
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error("Notificación no encontrada o no pertenece al usuario");
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Marca todas las notificaciones de un usuario como leídas
 * @param {string} userId - ID del usuario
 * @returns {Promise<number>} Cantidad de notificaciones actualizadas
 */
export async function markAllAsRead(userId) {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    console.log(`✅ Marked ${result.count} notifications as read for user ${userId}`);
    return result.count;
  } catch (error) {
    console.error("❌ Error marking all as read:", error);
    throw error;
  }
}

/**
 * Obtiene notificaciones de un usuario con filtros
 * @param {Object} params
 * @param {string} params.userId - ID del usuario
 * @param {number} [params.limit] - Límite de resultados (default: 20)
 * @param {boolean} [params.unreadOnly] - Solo no leídas (default: false)
 * @param {string} [params.type] - Filtrar por tipo
 * @returns {Promise<Object>} { notifications, unreadCount, total }
 */
export async function getUserNotifications(params) {
  try {
    const { userId, limit = 20, unreadOnly = false, type } = params;

    const where = { userId };

    if (unreadOnly) {
      where.read = false;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, unreadCount, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Number(limit),
      }),
      prisma.notification.count({
        where: { userId, read: false },
      }),
      prisma.notification.count({
        where: { userId },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      total,
    };
  } catch (error) {
    console.error("❌ Error getting notifications:", error);
    throw error;
  }
}

/**
 * Elimina una notificación
 * @param {string} notificationId - ID de la notificación
 * @param {string} userId - ID del usuario (validación de propiedad)
 * @returns {Promise<void>}
 */
export async function deleteNotification(notificationId, userId) {
  try {
    // Verificar propiedad
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error("Notificación no encontrada o no pertenece al usuario");
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    console.log(`✅ Notification deleted: ${notificationId}`);
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    throw error;
  }
}
