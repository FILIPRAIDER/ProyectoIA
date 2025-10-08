import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";
import { sendTeamInviteEmail } from "../lib/mailer.js";
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
});

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

function buildAcceptUrl({ token, target }) {
  const { APP_BASE_URL, API_BASE_URL } = process.env;
  if (target === "backend") {
    const base = API_BASE_URL ?? "http://localhost:4001";
    return `${base}/teams/invites/${token}/accept`; // GET (dev)
  }
  const app = APP_BASE_URL ?? "http://localhost:3000";
  const url = new URL("/join", app);
  url.searchParams.set("token", token);
  return url.toString();
}

/* ============================================================
   POST /teams/:teamId/invites
   Crea una invitación (PENDING) y envía el email.
============================================================ */
router.post(
  "/:teamId/invites",
  validate(TeamIdParams, "params"),
  validate(CreateInviteBody),
  async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const { email, role, byUserId, message, expiresInDays, target } = req.body;
      const debug = req.query?.debug === "1";

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
      console.log("✅ [4/5] Token generado");

      // Log del payload antes de crear (para debugging)
      console.log("� [5/5] Creando invitación en base de datos...");
      console.log("📝 Data a insertar:", {
        teamId,
        email: email.toLowerCase(),
        role,
        token: token.substring(0, 10) + "...",
        status: "PENDING",
        invitedBy: byUserId,
        hasMessage: !!message,
        expiresAt,
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
          expiresAt,
        },
      });

      const acceptUrl = buildAcceptUrl({ token, target });

      // Obtener nombre del invitador
      const inviter = await prisma.user.findUnique({
        where: { id: byUserId },
        select: { name: true, email: true },
      });
      const inviterName = inviter?.name || inviter?.email || "Un miembro del equipo";

      // Envío de email
      let emailInfo = null;
      try {
        emailInfo = await sendTeamInviteEmail({
          to: email,
          teamName: team.name,
          inviterName,
          acceptUrl,
          message,
        });
      } catch (mailErr) {
        console.error("[mailer] ❌ Error enviando invitación:", mailErr?.message || mailErr);
      }

      // 🔔 CREAR NOTIFICACIÓN si el usuario invitado existe en la plataforma
      try {
        const invitedUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: { id: true },
        });

        if (invitedUser) {
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
        }
      } catch (notifErr) {
        console.error("[notifications] ⚠️ Error creando notificación:", notifErr?.message || notifErr);
        // No fallar si la notificación falla
      }

      res.status(201).json({
        ...invite,
        emailSent: Boolean(emailInfo?.id), // Resend retorna { id }
        ...(debug ? { emailInfo } : {}),
        acceptUrlExample: acceptUrl,
        token, // útil en dev
      });
    } catch (e) {
      // ✨ MEJORADO: Manejo específico de errores de Prisma
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
