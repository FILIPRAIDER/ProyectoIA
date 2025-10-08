import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../lib/notifications.js";

export const router = Router();

/* ============ Schemas ============ */
const GetNotificationsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  type: z
    .enum([
      "TEAM_INVITATION",
      "INVITATION_ACCEPTED",
      "INVITATION_REJECTED",
      "TEAM_MATCH",
      "NEW_MEMBER",
      "ROLE_CHANGE",
      "REMINDER",
    ])
    .optional(),
});

const MarkAsReadBody = z.object({
  read: z.boolean(),
});

const NotificationIdParams = z.object({
  id: z.string().min(1),
});

/* ============================================================
   GET /notifications
   Obtener notificaciones del usuario autenticado
============================================================ */
router.get("/", validate(GetNotificationsQuery, "query"), async (req, res, next) => {
  try {
    // TODO: Implementar middleware de autenticación
    // Por ahora, espera userId en query params (temporal para testing)
    const userId = req.query.userId || req.user?.id;

    if (!userId) {
      throw new HttpError(401, "Usuario no autenticado. Falta userId en query params.");
    }

    const { limit, unreadOnly, type } = req.query;

    const result = await getUserNotifications({
      userId,
      limit,
      unreadOnly,
      type,
    });

    return res.json(result);
  } catch (e) {
    next(e);
  }
});

/* ============================================================
   PATCH /notifications/:id/read
   Marcar notificación como leída/no leída
============================================================ */
router.patch(
  "/:id/read",
  validate(NotificationIdParams, "params"),
  validate(MarkAsReadBody),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { read } = req.body;
      const userId = req.query.userId || req.user?.id;

      if (!userId) {
        throw new HttpError(401, "Usuario no autenticado");
      }

      if (!read) {
        throw new HttpError(400, "Solo se puede marcar como leída (read: true)");
      }

      const updated = await markAsRead(id, userId);

      return res.json(updated);
    } catch (e) {
      if (e.message?.includes("no encontrada")) {
        return next(new HttpError(404, e.message));
      }
      next(e);
    }
  }
);

/* ============================================================
   POST /notifications/mark-all-read
   Marcar todas las notificaciones como leídas
============================================================ */
router.post("/mark-all-read", async (req, res, next) => {
  try {
    const userId = req.query.userId || req.user?.id;

    if (!userId) {
      throw new HttpError(401, "Usuario no autenticado");
    }

    const count = await markAllAsRead(userId);

    return res.json({
      count,
      message: `${count} notificaciones marcadas como leídas`,
    });
  } catch (e) {
    next(e);
  }
});

/* ============================================================
   DELETE /notifications/:id
   Eliminar una notificación
============================================================ */
router.delete("/:id", validate(NotificationIdParams, "params"), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId || req.user?.id;

    if (!userId) {
      throw new HttpError(401, "Usuario no autenticado");
    }

    await deleteNotification(id, userId);

    return res.json({
      message: "Notificación eliminada",
    });
  } catch (e) {
    if (e.message?.includes("no encontrada")) {
      return next(new HttpError(404, e.message));
    }
    next(e);
  }
});

export default router;
