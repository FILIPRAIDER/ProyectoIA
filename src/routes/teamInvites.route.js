import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";
import { sendTeamInviteEmail } from "../lib/mailer.js";

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
  const actor = await prisma.user.findUnique({ where: { id: byUserId }, select: { id: true, role: true } });
  if (!actor) throw new HttpError(404, "Usuario actor (byUserId) no encontrado");

  const isAdmin = actor.role === "ADMIN";
  if (isAdmin) return true;

  const actorMembership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: byUserId } },
    select: { role: true },
  });
  const isLeader = actorMembership?.role === "LIDER";
  if (!isLeader) throw new HttpError(403, "Solo líder del equipo o admin puede gestionar invitaciones");
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

      const team = await prisma.team.findUnique({ where: { id: teamId }, select: { id: true, name: true } });
      if (!team) throw new HttpError(404, "Equipo no encontrado");

      await assertLeaderOrAdmin(teamId, byUserId);

      // ¿Ya es miembro?
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { id: true },
      });
      if (existingUser) {
        const isMember = await prisma.teamMember.findUnique({
          where: { teamId_userId: { teamId, userId: existingUser.id } },
          select: { teamId: true },
        });
        if (isMember) throw new HttpError(409, "Ese email ya pertenece a un miembro de este equipo");
      }

      const token = generateToken();
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

      const invite = await prisma.teamInvite.create({
        data: {
          teamId,
          email,
          role,
          token,
          status: "PENDING",
          invitedBy: byUserId,
          message: message ?? null,
          expiresAt,
        },
      });

      const acceptUrl = buildAcceptUrl({ token, target });

      // Envío de email
      let emailInfo = null;
      try {
        emailInfo = await sendTeamInviteEmail({
          to: email,
          teamName: team.name,
          acceptUrl,
          message,
        });
      } catch (mailErr) {
        console.error("[mailer] Error enviando invitación:", mailErr?.message || mailErr);
      }

      res.status(201).json({
        ...invite,
        emailSent: Boolean(emailInfo?.id), // Resend retorna { id }
        ...(debug ? { emailInfo } : {}),
        acceptUrlExample: acceptUrl,
        token, // útil en dev
      });
    } catch (e) {
      if (e?.code === "P2002") {
        return next(new HttpError(409, "Ya existe una invitación PENDING para ese email en este equipo"));
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
   POST /teams/invites/:token/accept  (frontend)
   GET  /teams/invites/:token/accept  (clic directo en dev)
============================================================ */
async function acceptInviteCore(token, name) {
  const invite = await prisma.teamInvite.findUnique({ where: { token } });
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
      const result = await acceptInviteCore(token, undefined);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);
