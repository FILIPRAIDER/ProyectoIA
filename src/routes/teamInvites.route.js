import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";
import { createNotification } from "../lib/notifications.js";

export const router = Router();

/* ============ Schemas ============ */
const TeamIdParams = z.object({ teamId: z.string().min(1) });

const CreateInviteBody = z.object({
  email: z.string().email(),
  role: z.enum(["LIDER", "MIEMBRO"]).default("MIEMBRO"),
  byUserId: z.string().min(1),                    // actor (líder/admin)
  message: z.string().max(500).optional(),
  expiresInDays: z.coerce.number().int().min(1).max(60).optional().default(7),
  target: z.enum(["frontend", "backend"]).optional().default("frontend"),
}).strict(); // 🛡️ Rechazar campos extra del frontend

const ListInvitesQuery = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "CANCELED", "EXPIRED"]).optional(),
});

const CancelInviteParams = z.object({
  teamId: z.string().min(1),
  inviteId: z.string().min(1),
});
const CancelInviteBody = z.object({
  byUserId: z.string().min(1),
});

const AcceptInviteParams = z.object({
  token: z.string().min(10),
});
const AcceptInviteBody = z.object({
  name: z.string().min(2).max(120).optional(),   // opcional si creamos usuario
});

/* ============ Helpers ============ */
async function assertLeaderOrAdmin(teamId, byUserId) {
  // ✨ MEJORADO: Verificar que el usuario existe
  const actor = await prisma.user.findUnique({ 
    where: { id: byUserId }, 
    select: { id: true, role: true, name: true, email: true } 
  });
  
  if (!actor) {
    console.error(`❌ Usuario no encontrado: ${byUserId}`);
    throw new HttpError(404, "Usuario no encontrado. Por favor inicia sesión nuevamente.");
  }

  // ✨ MEJORADO: Los admins pueden gestionar cualquier equipo
  const isAdmin = actor.role === "ADMIN";
  if (isAdmin) {
    console.log(`✅ Admin detectado: ${actor.email}`);
    return true;
  }

  // ✨ MEJORADO: Verificar que el usuario es miembro del equipo
  const actorMembership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: byUserId } },
    select: { role: true, joinedAt: true },
  });
  
  if (!actorMembership) {
    console.error(`❌ Usuario ${actor.email} no es miembro del equipo ${teamId}`);
    throw new HttpError(403, "No eres miembro de este equipo");
  }
  
  const isLeader = actorMembership.role === "LIDER";
  if (!isLeader) {
    console.error(`❌ Usuario ${actor.email} no es líder (rol: ${actorMembership.role})`);
    throw new HttpError(403, "Solo los líderes del equipo pueden gestionar invitaciones");
  }
  
  console.log(`✅ Líder verificado: ${actor.email} en equipo ${teamId}`);
  return true;
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex"); // 64 chars
}

/* ============================================================
   POST /teams/:teamId/invites
   Crea una invitación (PENDING) y envía el email.
============================================================ */
router.post(
  "/:teamId/invites",
  // Middleware de debugging ANTES de validación
  (req, res, next) => {
    // Forzar logs inmediatos con process.stdout.write
    process.stdout.write("\n" + "=".repeat(60) + "\n");
    process.stdout.write("🚀 POST /teams/:teamId/invites RECIBIDO\n");
    process.stdout.write("📦 req.params: " + JSON.stringify(req.params) + "\n");
    process.stdout.write("📦 req.body: " + JSON.stringify(req.body, null, 2) + "\n");
    process.stdout.write("📦 req.query: " + JSON.stringify(req.query) + "\n");
    process.stdout.write("=".repeat(60) + "\n\n");
    next();
  },
  validate(TeamIdParams, "params"),
  validate(CreateInviteBody),
  async (req, res, next) => {
    try {
      const { teamId } = req.validated?.params || req.params;
      
      // 🛡️ FILTRADO EXPLÍCITO: Solo extraer los campos que necesitamos
      // Esto previene que campos extra (como expiresAt mal formateado) causen errores
      const bodyData = req.validated?.body || req.body;
      const email = bodyData.email;
      const role = bodyData.role || "MIEMBRO";
      const byUserId = bodyData.byUserId;
      const message = bodyData.message;
      const target = bodyData.target || "frontend";
      
      // ✅ DEFENSA: Garantizar que expiresInDays NUNCA sea undefined/null/NaN
      // Si viene del frontend, puede ser string, así que lo convertimos
      let expiresInDays = bodyData.expiresInDays;
      if (expiresInDays) {
        expiresInDays = parseInt(expiresInDays, 10);
        if (isNaN(expiresInDays) || expiresInDays < 1 || expiresInDays > 60) {
          expiresInDays = 7; // valor por defecto si es inválido
        }
      } else {
        expiresInDays = 7; // valor por defecto
      }
      
      const debug = req.query?.debug === "1";

      // Log para confirmar que expiresInDays tiene valor
      console.log("✅ Valores extraídos del body validado:");
      console.log("  - expiresInDays:", expiresInDays, "(tipo:", typeof expiresInDays, ")");
      console.log("  - email:", email);
      console.log("  - role:", role);

      // ✨ MEJORADO: Verificar conexión a base de datos
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (dbError) {
        console.error("❌ Error de conexión a base de datos:", dbError);
        throw new HttpError(503, "Error de conexión a base de datos. Por favor intenta de nuevo.");
      }

      const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true, name: true } });
      if (!team) throw new HttpError(404, "Equipo no encontrado");

      // ✨ MEJORADO: Mejor mensaje de error en validación de líder
      console.log("🔍 [1/5] Verificando permisos del usuario...");
      try {
        await assertLeaderOrAdmin(teamId, byUserId);
        console.log("✅ [1/5] Permisos verificados");
      } catch (authError) {
        console.error("❌ Error de autorización:", authError.message);
        throw authError;
      }

      // ¿Ya es miembro?
      console.log("🔍 [2/5] Verificando si el email ya es miembro...");
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true },
      });
      if (existingUser) {
        const isMember = await prisma.teamMember.findUnique({
          where: { teamId_userId: { teamId, userId: existingUser.id } },
          select: { teamId: true },
        });
        if (isMember) {
          console.log("⚠️ [2/5] Email ya es miembro del equipo");
          throw new HttpError(409, "Ese email ya pertenece a un miembro de este equipo");
        }
      }
      console.log("✅ [2/5] Email no es miembro");

      // ✨ MEJORADO: Verificar invitaciones pendientes existentes
      console.log("🔍 [3/5] Verificando invitaciones pendientes...");
      try {
        const existingInvite = await prisma.teamInvite.findFirst({
          where: {
            teamId,
            email: email.toLowerCase(),
            status: "PENDING",
          },
        });
        if (existingInvite) {
          console.log("⚠️ [3/5] Ya existe invitación pendiente");
          throw new HttpError(409, "Ya existe una invitación pendiente para este email");
        }
        console.log("✅ [3/5] No hay invitaciones pendientes");
      } catch (error) {
        // Si el error NO es el HttpError 409 que lanzamos arriba, es un error de Prisma
        if (error.statusCode !== 409) {
          console.error("❌ [3/5] Error en findFirst de TeamInvite:", error);
          throw error;
        }
        throw error;
      }

      console.log("🔍 [4/5] Generando token y fecha de expiración...");
      const token = generateToken();
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
      
      // ✅ VALIDACIÓN: Verificar que la fecha sea válida
      if (isNaN(expiresAt.getTime())) {
        console.error("❌ Fecha inválida generada:", {
          expiresInDays,
          calculation: `Date.now() + ${expiresInDays} * 24 * 60 * 60 * 1000`,
          result: expiresAt
        });
        throw new HttpError(400, `Error calculando fecha de expiración. expiresInDays: ${expiresInDays}`);
      }
      
      console.log("✅ [4/5] Token y fecha generados correctamente");
      console.log("📅 expiresAt details:");
      console.log("  - Value:", expiresAt);
      console.log("  - Type:", typeof expiresAt);
      console.log("  - Is Date?:", expiresAt instanceof Date);
      console.log("  - Is Valid?:", !isNaN(expiresAt.getTime()));
      console.log("  - ISO String:", expiresAt.toISOString());

      // 🛡️ VALIDACIÓN FINAL: Asegurarnos de que expiresAt es una fecha válida
      const finalExpiresAt = new Date(expiresAt);
      if (isNaN(finalExpiresAt.getTime())) {
        console.error("❌ CRÍTICO: expiresAt inválido después de conversión");
        throw new HttpError(500, "Error interno: Fecha de expiración inválida");
      }

      // Log del payload antes de crear (para debugging)
      console.log("🗄️ [5/5] Creando invitación en base de datos...");
      console.log("📝 Data a insertar:", {
        teamId,
        email: email.toLowerCase(),
        role,
        token: token.substring(0, 10) + "...",
        status: "PENDING",
        invitedBy: byUserId,
        hasMessage: !!message,
        expiresAt: finalExpiresAt.toISOString(),
      });

      const invite = await prisma.teamInvite.create({
        data: {
          teamId,
          email: email.toLowerCase(),
          role,
          token,
          status: "PENDING",
          invitedBy: byUserId,
          message: message ?? null,
          expiresAt: finalExpiresAt,
        },
      });

      console.log("✅ [5/5] Invitación creada exitosamente");
      console.log("📧 Email será manejado por el frontend");

      // 🔔 CREAR NOTIFICACIÓN si el usuario invitado existe en la plataforma
      try {
        const invitedUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: { id: true },
        });

        if (invitedUser) {
          // Obtener nombre del invitador para la notificación
          const inviter = await prisma.user.findUnique({
            where: { id: byUserId },
            select: { name: true, email: true },
          });
          const inviterName = inviter?.name || inviter?.email || "Un miembro del equipo";

          await createNotification({
            userId: invitedUser.id,
            type: "TEAM_INVITATION",
            title: "Nueva invitación a equipo",
            message: `${inviterName} te invitó a unirte a ${team.name}`,
            data: {
              teamId: team.id,
              teamName: team.name,
              inviteId: invite.id,
              token: invite.token,
              inviterName,
              role: invite.role,
            },
            actionUrl: `/join?token=${invite.token}`,
          });
          console.log("🔔 Notificación in-app creada");
        }
      } catch (notifErr) {
        console.error("[notifications] ⚠️ Error creando notificación:", notifErr?.message || notifErr);
        // No fallar si la notificación falla
      }

      // Retornar la invitación con el token para que el frontend envíe el email
      res.status(201).json({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        status: invite.status,
        expiresAt: invite.expiresAt,
        teamId: invite.teamId,
        invitedBy: invite.invitedBy,
        message: invite.message,
        createdAt: invite.createdAt,
      });
    } catch (e) {
      // ✨ MEJORADO: Manejo específico de errores de Prisma
      
      // 🛡️ Error de validación de Prisma (PrismaClientValidationError)
      if (e?.name === "PrismaClientValidationError" || e?.constructor?.name === "PrismaClientValidationError") {
        console.error("❌❌❌ PrismaClientValidationError detectado ❌❌❌");
        console.error("Full error message:", e.message);
        console.error("Stack:", e.stack);
        
        // Si el error menciona "Invalid Date" o "expiresAt"
        if (e.message?.includes("Invalid Date") || e.message?.includes("expiresAt")) {
          return next(new HttpError(400, "Error en formato de fecha. Por favor intenta de nuevo."));
        }
        
        return next(new HttpError(400, "Error de validación en la consulta a base de datos", {
          details: e.message?.split("\n")[0] || "Error de validación",
          fullError: e.message,
          stack: e.stack
        }));
      }
      
      if (e?.code === "P2002") {
        return next(new HttpError(409, "Ya existe una invitación PENDING para ese email en este equipo"));
      }
      if (e?.code === "P2003") {
        console.error("❌ Error de clave foránea:", e);
        return next(new HttpError(400, "Usuario o equipo no válido"));
      }
      if (e?.code === "P2025") {
        return next(new HttpError(404, "Registro no encontrado"));
      }
      if (e?.message?.includes('Closed') || e?.message?.includes('connection')) {
        console.error("❌ Error de conexión cerrada:", e);
        return next(new HttpError(503, "Error de conexión a base de datos. Por favor intenta de nuevo."));
      }
      next(e);
    }
  }
);

/* ============================================================
   GET /teams/:teamId/invites?status=...
============================================================ */
router.get(
  "/:teamId/invites",
  validate(TeamIdParams, "params"),
  validate(ListInvitesQuery, "query"),
  async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const { status } = req.query;

      const invites = await prisma.teamInvite.findMany({
        where: { teamId, ...(status ? { status } : {}) },
        orderBy: [{ createdAt: "desc" }],
      });

      res.json(invites);
    } catch (e) {
      next(e);
    }
  }
);

/* ============================================================
   GET /teams/:teamId/invites/:invitationId
   Obtiene una invitación específica (para reenviar email desde frontend)
============================================================ */
const InvitationIdParams = z.object({
  teamId: z.string().min(1),
  invitationId: z.string().min(1),
});

router.get(
  "/:teamId/invites/:invitationId",
  validate(InvitationIdParams, "params"),
  async (req, res, next) => {
    try {
      const { teamId, invitationId } = req.params;

      const invite = await prisma.teamInvite.findFirst({
        where: {
          id: invitationId,
          teamId,
        },
      });

      if (!invite) {
        throw new HttpError(404, "Invitación no encontrada");
      }

      res.json({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        status: invite.status,
        expiresAt: invite.expiresAt,
        teamId: invite.teamId,
        invitedBy: invite.invitedBy,
        message: invite.message,
        createdAt: invite.createdAt,
      });
    } catch (e) {
      next(e);
    }
  }
);

/* ============================================================
   POST /teams/:teamId/invites/:inviteId/cancel
============================================================ */
router.post(
  "/:teamId/invites/:inviteId/cancel",
  validate(CancelInviteParams, "params"),
  validate(CancelInviteBody),
  async (req, res, next) => {
    try {
      const { teamId, inviteId } = req.params;
      const { byUserId } = req.body;

      await assertLeaderOrAdmin(teamId, byUserId);

      const invite = await prisma.teamInvite.findUnique({ where: { id: inviteId } });
      if (!invite || invite.teamId !== teamId) throw new HttpError(404, "Invitación no encontrada");
      if (invite.status !== "PENDING") throw new HttpError(422, "Solo se pueden cancelar invitaciones PENDING");

      const updated = await prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: "CANCELED", decidedAt: new Date() },
      });

      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

/* ============================================================
   GET /teams/invites/:token/info
   Obtiene información de la invitación SIN aceptarla
   Para que el frontend pueda mostrar datos antes de aceptar
============================================================ */
router.get(
  "/invites/:token/info",
  validate(AcceptInviteParams, "params"),
  async (req, res, next) => {
    try {
      const { token } = req.params;

      const invite = await prisma.teamInvite.findUnique({
        where: { token },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              description: true,
              area: true,
              members: {
                select: {
                  id: true,
                  role: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!invite) {
        throw new HttpError(404, "Invitación no encontrada");
      }

      // Verificar expiración
      const isExpired = invite.expiresAt && invite.expiresAt.getTime() < Date.now();
      
      // Obtener nombre del invitador
      const inviter = await prisma.user.findUnique({
        where: { id: invite.invitedBy },
        select: { id: true, name: true, email: true }
      });

      res.json({
        token: invite.token,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        message: invite.message,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
        isExpired,
        canAccept: invite.status === "PENDING" && !isExpired,
        team: invite.team,
        inviter: inviter ? {
          name: inviter.name || inviter.email,
          email: inviter.email
        } : null,
        memberCount: invite.team.members.length
      });
    } catch (e) {
      next(e);
    }
  }
);

/* ============================================================
   POST /teams/invites/:token/accept  (frontend)
   GET  /teams/invites/:token/accept  (clic directo en dev)
============================================================ */
async function acceptInviteCore(token, name) {
  const invite = await prisma.teamInvite.findUnique({ 
    where: { token },
    include: {
      team: { select: { id: true, name: true } }
    }
  });
  if (!invite) throw new HttpError(404, "Invitación no válida");
  if (invite.status !== "PENDING") throw new HttpError(422, "La invitación no está en estado PENDING");
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED", decidedAt: new Date() },
    });
    throw new HttpError(410, "La invitación ha expirado");
  }

  // Buscar o crear usuario por email
  let user = await prisma.user.findUnique({ where: { email: invite.email.toLowerCase() } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: name ?? invite.email.split("@")[0],
        email: invite.email.toLowerCase(),
        role: "ESTUDIANTE",
      },
    });
  }

  // ¿Ya es miembro?
  const existingMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: invite.teamId, userId: user.id } },
  });

  let membership = existingMember;
  if (!existingMember) {
    membership = await prisma.teamMember.create({
      data: { teamId: invite.teamId, userId: user.id, role: invite.role },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
  }

  const updatedInvite = await prisma.teamInvite.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED", decidedAt: new Date() },
  });

  // 🔔 NOTIFICAR AL LÍDER QUE ENVIÓ LA INVITACIÓN
  try {
    await createNotification({
      userId: invite.invitedBy,
      type: "INVITATION_ACCEPTED",
      title: "Invitación aceptada",
      message: `${user.name || user.email} aceptó tu invitación y se unió a ${invite.team.name}`,
      data: {
        teamId: invite.team.id,
        teamName: invite.team.name,
        newMemberId: user.id,
        newMemberName: user.name,
        newMemberEmail: user.email,
      },
      actionUrl: `/dashboard/lider?tab=members`,
    });
  } catch (notifErr) {
    console.error("[notifications] ⚠️ Error notificando al líder:", notifErr?.message);
  }

  // 🔔 NOTIFICAR A TODOS LOS MIEMBROS DEL EQUIPO (excepto al nuevo)
  try {
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId: invite.team.id,
        userId: { not: user.id },
      },
      select: { userId: true, role: true },
    });

    // Crear notificaciones en paralelo
    await Promise.all(
      teamMembers.map((member) =>
        createNotification({
          userId: member.userId,
          type: "NEW_MEMBER",
          title: "Nuevo miembro en el equipo",
          message: `${user.name || user.email} se unió a ${invite.team.name}`,
          data: {
            teamId: invite.team.id,
            teamName: invite.team.name,
            newMemberId: user.id,
            newMemberName: user.name,
          },
          actionUrl: `/dashboard/${member.role === "LIDER" ? "lider" : "miembro"}?tab=members`,
        })
      )
    );
  } catch (notifErr) {
    console.error("[notifications] ⚠️ Error notificando a miembros:", notifErr?.message);
  }

  return { invite: updatedInvite, user, membership };
}

router.post(
  "/invites/:token/accept",
  validate(AcceptInviteParams, "params"),
  validate(AcceptInviteBody),
  async (req, res, next) => {
    try {
      const { token } = req.params;
      const { name } = req.body;
      const result = await acceptInviteCore(token, name);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/invites/:token/accept",
  validate(AcceptInviteParams, "params"),
  async (req, res, next) => {
    try {
      const { token } = req.params;
      
      // Si viene ?redirect=false, devuelve JSON (para testing)
      if (req.query.redirect === "false") {
        const result = await acceptInviteCore(token, undefined);
        return res.json(result);
      }

      // Por defecto, redirige al frontend
      const { APP_BASE_URL } = process.env;
      const frontendUrl = APP_BASE_URL || "http://localhost:3000";
      
      try {
        // Intenta aceptar la invitación
        const result = await acceptInviteCore(token, undefined);
        
        // Redirige al frontend con éxito
        const redirectUrl = new URL("/join/success", frontendUrl);
        redirectUrl.searchParams.set("team", result.membership.teamId);
        redirectUrl.searchParams.set("role", result.membership.role);
        
        res.redirect(redirectUrl.toString());
      } catch (error) {
        // Redirige al frontend con error
        const redirectUrl = new URL("/join/error", frontendUrl);
        redirectUrl.searchParams.set("message", error.message || "Error al aceptar invitación");
        
        res.redirect(redirectUrl.toString());
      }
    } catch (e) {
      next(e);
    }
  }
);
