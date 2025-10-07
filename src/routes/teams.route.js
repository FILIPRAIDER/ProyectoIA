import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";
import { sendTeamInviteEmail } from "../lib/mailer.js";
import { InviteStatus } from "@prisma/client";

export const router = Router();

/* ============================================================================
   TEAMS CRUD + LISTADO
============================================================================ */
const CreateTeamSchema = z.object({
  name: z.string().min(2, "Nombre del equipo muy corto").trim(),
  city: z.string().min(2).trim().optional(),
  area: z.string().trim().min(2).max(50).optional(),
});

router.post("/", validate(CreateTeamSchema), async (req, res, next) => {
  try {
    const team = await prisma.team.create({
      data: {
        name: req.body.name,
        city: req.body.city ?? null,
        area: req.body.area ?? null,
      },
    });
    res.status(201).json(team);
  } catch (e) {
    next(e);
  }
});

const TeamIdParams = z.object({ id: z.string().min(1) });
const UpdateTeamBody = z.object({
  name: z.string().trim().min(2).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().min(2).optional().nullable(),
  area: z.string().trim().min(2).max(50).optional().nullable(),
});


router.patch(
  "/:id",
  validate(TeamIdParams, "params"),
  validate(UpdateTeamBody),
  async (req, res, next) => {
    try {
      // Validar nombre no vacío si se está actualizando
      if ('name' in req.body && !req.body.name?.trim()) {
        throw new HttpError(400, 'El nombre no puede estar vacío');
      }
      
      const updated = await prisma.team.update({
        where: { id: req.params.id },
        data: {
          ...("name" in req.body ? { name: req.body.name } : {}),
          ...("description" in req.body ? { description: req.body.description ?? null } : {}),
          ...("city" in req.body ? { city: req.body.city ?? null } : {}),
          ...("area" in req.body ? { area: req.body.area ?? null } : {}),
        },
      });
      res.json(updated);
    } catch (e) {
      if (e?.code === "P2025")
        return next(new HttpError(404, "Equipo no encontrado"));
      next(e);
    }
  }
);

/* ========== GET /teams/:id ========== */
router.get("/:id", validate(TeamIdParams, "params"), async (req, res, next) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
          },
          orderBy: { role: "asc" },
        },
        skills: {
          include: { skill: true },
          orderBy: { skill: { name: "asc" } },
        },
      },
    });
    if (!team) throw new HttpError(404, "Equipo no encontrado");
    res.json(team);
  } catch (e) {
    next(e);
  }
});

/* ========== GET /teams?city=...&area=...&skill=... ========== */
const ListTeamsQuery = z.object({
  city: z.string().trim().optional(),
  area: z.string().trim().optional(),
  skill: z.string().trim().optional(),
});

router.get("/", validate(ListTeamsQuery, "query"), async (req, res, next) => {
  try {
    const { city, area, skill } = req.query;
    const where = {};

    if (city) where.city = { equals: city, mode: "insensitive" };
    if (area) where.area = { contains: area, mode: "insensitive" };
    if (skill) {
      where.members = {
        some: {
          user: {
            skills: {
              some: {
                skill: { name: { contains: skill, mode: "insensitive" } },
              },
            },
          },
        },
      };
    }

    const teams = await prisma.team.findMany({
      where,
      orderBy: [{ name: "asc" }],
      include: { _count: { select: { members: true } } },
    });

    res.json(teams);
  } catch (e) {
    next(e);
  }
});

/* ============================================================================
   MEMBERS
============================================================================ */
const TeamIdOnlyParams = z.object({ teamId: z.string().min(1) });
const ListTeamMembersQuery = z.object({
  withSkills: z.coerce.boolean().optional().default(false),
});


router.get(
  "/:teamId/members",
  validate(TeamIdOnlyParams, "params"),
  validate(ListTeamMembersQuery, "query"),
  async (req, res, next) => {
    try {
      const exists = await prisma.team.findUnique({
        where: { id: req.params.teamId },
        select: { id: true },
      });
      if (!exists) throw new HttpError(404, "Equipo no encontrado");

      const includeUser = req.query.withSkills
        ? {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
              skills: {
                include: { skill: true },
                orderBy: { skill: { name: "asc" } },
              },
            },
          }
        : { select: { id: true, name: true, email: true, role: true, avatarUrl: true } };

      const members = await prisma.teamMember.findMany({
        where: { teamId: req.params.teamId },
        include: { user: includeUser },
        orderBy: { role: "asc" },
      });

      res.json(members);
    } catch (e) {
      next(e);
    }
  }
);

const AddMemberBody = z.object({
  userId: z.string().min(1),
  role: z.enum(["LIDER", "MIEMBRO"]).optional().default("MIEMBRO"),
});

router.post(
  "/:teamId/members",
  validate(TeamIdOnlyParams, "params"),
  validate(AddMemberBody),
  async (req, res, next) => {
    try {
      const [team, user] = await Promise.all([
        prisma.team.findUnique({
          where: { id: req.params.teamId },
          select: { id: true },
        }),
        prisma.user.findUnique({
          where: { id: req.body.userId },
          select: { id: true },
        }),
      ]);
      if (!team) throw new HttpError(404, "Equipo no encontrado");
      if (!user) throw new HttpError(404, "Usuario no encontrado");

      const created = await prisma.teamMember.create({
        data: {
          teamId: req.params.teamId,
          userId: req.body.userId,
          role: req.body.role,
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        },
      });
      res.status(201).json(created);
    } catch (e) {
      if (e?.code === "P2002")
        return next(
          new HttpError(409, "El usuario ya es miembro de este equipo")
        );
      next(e);
    }
  }
);

const RemoveMemberParams = z.object({
  teamId: z.string().min(1),
  userId: z.string().min(1),
});

router.delete(
  "/:teamId/members/:userId",
  validate(RemoveMemberParams, "params"),
  async (req, res, next) => {
    try {
      await prisma.teamMember.delete({
        where: {
          teamId_userId: {
            teamId: req.params.teamId,
            userId: req.params.userId,
          },
        },
      });
      res.status(204).send();
    } catch (e) {
      if (e?.code === "P2025")
        return next(
          new HttpError(404, "El usuario no es miembro de este equipo")
        );
      next(e);
    }
  }
);

/* ============================================================================
   TEAM SKILLS
============================================================================ */
// GET /teams/:teamId/skills
/* ============================================================================
   TEAM SKILLS
============================================================================ */



// ➕ NUEVO: query param para pedir agregado desde miembros
const TeamSkillsQuery = z.object({
  aggregate: z.coerce.boolean().optional().default(false), // false = comportamiento actual
});

// GET /teams/:teamId/skills
router.get(
  "/:teamId/skills",
  validate(TeamIdOnlyParams, "params"),
  validate(TeamSkillsQuery, "query"),
  async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const { aggregate } = req.query;

      const exists = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true },
      });
      if (!exists) throw new HttpError(404, "Equipo no encontrado");

      // --- Caso 1: comportamiento actual (skills asignadas al equipo explícitamente) ---
      if (!aggregate) {
        const rows = await prisma.teamSkill.findMany({
          where: { teamId },
          include: { skill: true },
          orderBy: { skill: { name: "asc" } },
        });
        return res.json({
          source: "teamSkill",
          data: rows, // [{ teamId, skillId, skill:{...} }]
        });
      }

      // --- Caso 2: agregado dinámico desde las skills de los miembros ---
      const members = await prisma.teamMember.findMany({
        where: { teamId },
        select: { userId: true },
      });
      const userIds = members.map((m) => m.userId);
      if (userIds.length === 0) {
        return res.json({ source: "membersAggregate", data: [] });
      }

      // Agrupamos por skillId en UserSkill: count de miembros y promedio de nivel
      const grouped = await prisma.userSkill.groupBy({
        by: ["skillId"],
        where: { userId: { in: userIds } },
        _avg: { level: true },
        _count: { _all: true },
      });

      if (grouped.length === 0) {
        return res.json({ source: "membersAggregate", data: [] });
      }

      // Traemos info de las skills
      const skillIds = grouped.map((g) => g.skillId);
      const skills = await prisma.skill.findMany({
        where: { id: { in: skillIds } },
        select: { id: true, name: true },
      });
      const byId = new Map(skills.map((s) => [s.id, s]));

      // Componemos respuesta ordenada por nombre de skill
      const rows = grouped
        .map((g) => ({
          skill: byId.get(g.skillId) ?? { id: g.skillId, name: "(desconocida)" },
          membersCount: g._count._all,
          avgLevel:
            typeof g._avg.level === "number"
              ? Number(g._avg.level.toFixed(2))
              : null,
        }))
        .sort((a, b) => a.skill.name.localeCompare(b.skill.name));

      return res.json({
        source: "membersAggregate",
        data: rows, // [{ skill:{id,name}, membersCount, avgLevel }]
      });
    } catch (e) {
      next(e);
    }
  }
);


// POST /teams/:teamId/skills  Body: { skillId: string }
const AddTeamSkillBody = z.object({
  skillId: z.string().min(1),
});

router.post(
  "/:teamId/skills",
  validate(TeamIdOnlyParams, "params"),
  validate(AddTeamSkillBody),
  async (req, res, next) => {
    try {
      const [team, skill] = await Promise.all([
        prisma.team.findUnique({
          where: { id: req.params.teamId },
          select: { id: true },
        }),
        prisma.skill.findUnique({
          where: { id: req.body.skillId },
          select: { id: true, name: true },
        }),
      ]);
      if (!team) throw new HttpError(404, "Equipo no encontrado");
      if (!skill) throw new HttpError(404, "Skill no encontrada");

      const rel = await prisma.teamSkill.create({
        data: { teamId: req.params.teamId, skillId: req.body.skillId },
        include: { skill: true },
      });
      res.status(201).json(rel);
    } catch (e) {
      if (e?.code === "P2002")
        return next(
          new HttpError(409, "La skill ya está asignada a este equipo")
        );
      next(e);
    }
  }
);

// DELETE /teams/:teamId/skills/:skillId
const TeamSkillParams = z.object({
  teamId: z.string().min(1),
  skillId: z.string().min(1),
});

router.delete(
  "/:teamId/skills/:skillId",
  validate(TeamSkillParams, "params"),
  async (req, res, next) => {
    try {
      await prisma.teamSkill.delete({
        where: {
          teamId_skillId: {
            teamId: req.params.teamId,
            skillId: req.params.skillId,
          },
        },
      });
      res.status(204).send();
    } catch (e) {
      if (e?.code === "P2025")
        return next(new HttpError(404, "Esa skill no está asignada al equipo"));
      next(e);
    }
  }
);

/* ============================================================================
   INVITES (EMAIL) — helpers
============================================================================ */
async function assertLeaderOrAdmin(teamId, byUserId) {
  const actor = await prisma.user.findUnique({
    where: { id: byUserId },
    select: { id: true, role: true },
  });
  if (!actor)
    throw new HttpError(404, "Usuario actor (byUserId) no encontrado");

  const isAdmin = actor.role === "ADMIN";
  if (isAdmin) return true;

  const actorMembership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: byUserId } },
    select: { role: true },
  });
  const isLeader = actorMembership?.role === "LIDER";
  if (!isLeader)
    throw new HttpError(
      403,
      "Solo líder del equipo o admin puede gestionar invitaciones"
    );
  return true;
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex"); // 64 chars
}

function buildAcceptUrl({ token, target }) {
  const { APP_BASE_URL, API_BASE_URL } = process.env;
  if (target === "backend") {
    const base = API_BASE_URL ?? "http://localhost:4001";
    return `${base}/teams/invites/${token}/accept`; // GET
  }
  const app = APP_BASE_URL ?? "http://localhost:3000";
  const url = new URL("/join", app);
  url.searchParams.set("token", token);
  return url.toString();
}

/* ============================================================================
   INVITES — Schemas
============================================================================ */
const CreateInviteBody = z.object({
  email: z.string().email(),
  role: z.enum(["LIDER", "MIEMBRO"]).default("MIEMBRO"),
  byUserId: z.string().min(1),
  message: z.string().max(500).optional(),
  expiresInDays: z.coerce.number().int().min(1).max(60).optional().default(7),
  target: z.enum(["frontend", "backend"]).optional().default("frontend"),
});

const ListInvitesQuery = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "CANCELED", "EXPIRED"]).optional(),
  // Filtros
  email: z.string().email().optional(),          // match exacto (case-insensitive)
  search: z.string().trim().max(100).optional(), // búsqueda en email (contains)
  from: z.string().datetime().optional(),        // ISO (ej. 2025-10-05T00:00:00.000Z)
  to: z.string().datetime().optional(),          // ISO
  // Paginación
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  // Orden
  sortBy: z.enum(["createdAt", "decidedAt", "expiresAt"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
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
  name: z.string().min(2).max(120).optional(),
});

/* ====== NUEVOS schemas ====== */
const ResendInviteParams = CancelInviteParams; // { teamId, inviteId }
const ResendInviteBody = z.object({
  byUserId: z.string().min(1),
  target: z.enum(["frontend", "backend"]).optional().default("frontend"),
});
const ExpireInviteParams = CancelInviteParams;
const ExpireInviteBody = z.object({
  byUserId: z.string().min(1),
});

/* ============================================================================
   POST /teams/:teamId/invites  (crear y enviar email)
============================================================================ */
router.post(
  "/:teamId/invites",
  validate(TeamIdOnlyParams, "params"),
  validate(CreateInviteBody),
  async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const { email, role, byUserId, message, expiresInDays, target } =
        req.body;

      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, name: true },
      });
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
        if (isMember)
          throw new HttpError(
            409,
            "Ese email ya pertenece a un miembro de este equipo"
          );
      }

      // Crear invitación
      const token = generateToken();
      const expiresAt = new Date(
        Date.now() + expiresInDays * 24 * 60 * 60 * 1000
      );

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

      // Enviar correo (errores no invalidan la creación)
      let emailInfo = null;
      try {
        emailInfo = await sendTeamInviteEmail({
          to: email,
          teamName: team.name,
          acceptUrl,
          message,
        });
      } catch (mailErr) {
        console.error(
          "[mailer] Error enviando invitación:",
          mailErr?.message || mailErr
        );
      }

      res.status(201).json({
        ...invite,
        emailSent: Boolean(emailInfo?.id),
        acceptUrlExample: acceptUrl,
        token, // útil en dev
      });
    } catch (e) {
      if (e?.code === "P2002") {
        return next(
          new HttpError(
            409,
            "Ya existe una invitación PENDING para ese email en este equipo"
          )
        );
      }
      next(e);
    }
  }
);

/* ============================================================================
   GET /teams/:teamId/invites?status=...
============================================================================ */
router.get(
  "/:teamId/invites",
  validate(TeamIdOnlyParams, "params"),
  validate(ListInvitesQuery, "query"),
  async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const {
        status,
        email,
        search,
        from,
        to,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortDir = "desc",
      } = req.query;

      // mapear status string -> enum Prisma
      const statusFilter = status ? InviteStatus[status] : undefined;

      // rango de fechas (usamos createdAt por defecto)
      const createdAtFilter =
        from || to
          ? {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            }
          : undefined;

      // email exacto vs búsqueda parcial: si hay email, prioriza exacto
      const emailFilter = email
        ? { equals: email, mode: "insensitive" }
        : search
        ? { contains: search, mode: "insensitive" }
        : undefined;

      const where = {
        teamId,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(emailFilter ? { email: emailFilter } : {}),
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      };

      const orderBy = [{ [sortBy]: sortDir }];

      const take = Number(limit);
      const skip = (Number(page) - 1) * take;

      const [rows, total] = await Promise.all([
        prisma.teamInvite.findMany({
          where,
          orderBy,
          skip,
          take,
        }),
        prisma.teamInvite.count({ where }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / take));
      const meta = {
        page: Number(page),
        limit: take,
        total,
        totalPages,
        hasPrev: Number(page) > 1,
        hasNext: Number(page) < totalPages,
        sortBy,
        sortDir,
      };

      res.json({ data: rows, meta });
    } catch (e) {
      next(e);
    }
  }
);

/* ============================================================================
   POST /teams/:teamId/invites/:inviteId/cancel
============================================================================ */
router.post(
  "/:teamId/invites/:inviteId/cancel",
  validate(CancelInviteParams, "params"),
  validate(CancelInviteBody),
  async (req, res, next) => {
    try {
      const { teamId, inviteId } = req.params;
      const { byUserId } = req.body;

      await assertLeaderOrAdmin(teamId, byUserId);

      const invite = await prisma.teamInvite.findUnique({
        where: { id: inviteId },
      });
      if (!invite || invite.teamId !== teamId)
        throw new HttpError(404, "Invitación no encontrada");
      if (invite.status !== "PENDING")
        throw new HttpError(
          422,
          "Solo se pueden cancelar invitaciones PENDING"
        );

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

/* ============================================================================
   ACEPTAR INVITACIÓN (POST para frontend y GET para dev)
============================================================================ */
async function acceptInviteCore(token, name) {
  const invite = await prisma.teamInvite.findUnique({ where: { token } });
  if (!invite) throw new HttpError(404, "Invitación no válida");

  // Expirada por tiempo
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    if (invite.status === "PENDING") {
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED", decidedAt: new Date() },
      });
    }
    throw new HttpError(410, "La invitación ha expirado");
  }

  if (invite.status !== "PENDING") {
    throw new HttpError(422, "La invitación no está en estado PENDING");
  }

  // Buscar o crear usuario por email
  let user = await prisma.user.findUnique({
    where: { email: invite.email.toLowerCase() },
  });
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
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
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

/* ============================================================================
   NUEVO: POST /teams/:teamId/invites/:inviteId/resend
   - Reenvía el correo si la invitación sigue PENDING y no está expirada por tiempo.
============================================================================ */
router.post(
  "/:teamId/invites/:inviteId/resend",
  validate(ResendInviteParams, "params"),
  validate(ResendInviteBody),
  async (req, res, next) => {
    try {
      const { teamId, inviteId } = req.params;
      const { byUserId, target = "frontend" } = req.body;

      await assertLeaderOrAdmin(teamId, byUserId);

      const invite = await prisma.teamInvite.findUnique({
        where: { id: inviteId },
      });
      if (!invite || invite.teamId !== teamId)
        throw new HttpError(404, "Invitación no encontrada");

      // Si está expirada por tiempo, marcar EXPIRED y 410
      if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
        if (invite.status === "PENDING") {
          await prisma.teamInvite.update({
            where: { id: invite.id },
            data: { status: "EXPIRED", decidedAt: new Date() },
          });
        }
        throw new HttpError(410, "La invitación ha expirado");
      }

      if (invite.status !== "PENDING") {
        if (invite.status === "EXPIRED")
          throw new HttpError(410, "La invitación ha expirado");
        throw new HttpError(
          422,
          `La invitación está en estado ${invite.status}, no es posible reenviar`
        );
      }

      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { name: true },
      });
      const acceptUrl = buildAcceptUrl({ token: invite.token, target });

      let emailInfo = null;
      try {
        emailInfo = await sendTeamInviteEmail({
          to: invite.email,
          teamName: team?.name ?? "Equipo",
          acceptUrl,
          message: invite.message ?? undefined,
        });
      } catch (mailErr) {
        console.error(
          "[mailer] Error reenviando invitación:",
          mailErr?.message || mailErr
        );
      }

      return res.json({
        ok: true,
        inviteId,
        emailSent: Boolean(emailInfo?.id),
        acceptUrlExample: acceptUrl,
      });
    } catch (e) {
      next(e);
    }
  }
);

/* ============================================================================
   NUEVO: POST /teams/:teamId/invites/:inviteId/expire
   - Marca la invitación como EXPIRED si está PENDING.
============================================================================ */
router.post(
  "/:teamId/invites/:inviteId/expire",
  validate(ExpireInviteParams, "params"),
  validate(ExpireInviteBody),
  async (req, res, next) => {
    try {
      const { teamId, inviteId } = req.params;
      const { byUserId } = req.body;

      await assertLeaderOrAdmin(teamId, byUserId);

      const invite = await prisma.teamInvite.findUnique({
        where: { id: inviteId },
      });
      if (!invite || invite.teamId !== teamId)
        throw new HttpError(404, "Invitación no encontrada");

      if (invite.status !== "PENDING") {
        throw new HttpError(
          422,
          `Solo se pueden expirar invitaciones PENDING (actual: ${invite.status})`
        );
      }

      const updated = await prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: "EXPIRED", decidedAt: new Date() },
      });

      return res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

// Export CSV: mismos filtros + opciones de formato
const ListInvitesExportQuery = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "CANCELED", "EXPIRED"]).optional(),
  email: z.string().email().optional(),
  search: z.string().trim().max(100).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  // opciones de exportación
  delimiter: z.enum([",", ";"]).default(","),            // separador CSV
  dateFmt: z.enum(["iso", "local"]).default("iso"),      // formato de fecha
  limit: z.coerce.number().int().min(1).max(20000).optional(), // tope por seguridad
  filename: z.string().trim().max(80).optional(),        // nombre opcional del archivo (sin extensión)
});

// GET /teams/:teamId/invites/export.csv
router.get(
  "/:teamId/invites/export.csv",
  validate(TeamIdOnlyParams, "params"),
  validate(ListInvitesExportQuery, "query"),
  async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const {
        status,
        email,
        search,
        from,
        to,
        delimiter = ",",
        dateFmt = "iso",
        limit,
        filename,
      } = req.query;

      // ---- filtros (mismos del listado) ----
      const statusFilter = status ? InviteStatus[status] : undefined;

      const createdAtFilter =
        from || to
          ? {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(to) : undefined,
            }
          : undefined;

      const emailFilter = email
        ? { equals: email, mode: "insensitive" }
        : search
        ? { contains: search, mode: "insensitive" }
        : undefined;

      const where = {
        teamId,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(emailFilter ? { email: emailFilter } : {}),
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      };

      // ---- límites y orden ----
      const MAX_EXPORT = 20000;
      const cap = Math.min(Number(limit ?? MAX_EXPORT), MAX_EXPORT);

      const rows = await prisma.teamInvite.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        take: cap,
        include: {
          team: { select: { name: true } },
          invitedByUser: { select: { email: true, name: true } },
        },
      });

      // ---- helpers CSV ----
      const fmtDate = (d) => {
        if (!d) return "";
        const dd = typeof d === "string" ? new Date(d) : d;
        if (Number.isNaN(dd.getTime())) return "";
        if (dateFmt === "iso") return dd.toISOString();
        // "local" legible: YYYY-MM-DD HH:mm
        const pad = (n) => String(n).padStart(2, "0");
        return `${dd.getFullYear()}-${pad(dd.getMonth() + 1)}-${pad(dd.getDate())} ${pad(dd.getHours())}:${pad(dd.getMinutes())}`;
      };

      const esc = (v) => {
        if (v === null || v === undefined) return '""';
        const s = String(v);
        // Doble comillas, envolvemos siempre en comillas
        return `"${s.replace(/"/g, '""')}"`;
      };

      // ---- cabeceras y filas ----
      const headers = [
        "inviteId",
        "teamId",
        "teamName",
        "email",
        "role",
        "status",
        "invitedBy",
        "message",
        "createdAt",
        "decidedAt",
        "expiresAt",
        "token", // útil en dev; si luego quieres ocultarlo, quítalo
      ];

      const lines = rows.map((r) => [
        r.id,
        r.teamId,
        r.team?.name ?? "",
        r.email,
        r.role,
        r.status,
        r.invitedByUser?.email ?? r.invitedBy ?? "",
        r.message ?? "",
        fmtDate(r.createdAt),
        fmtDate(r.decidedAt),
        fmtDate(r.expiresAt),
        r.token,
      ].map(esc).join(delimiter));

      const csvBody = [headers.join(delimiter), ...lines].join("\r\n");
      const bom = "\uFEFF"; // BOM para Excel en Windows

      // ---- filename ----
      const safe = (s) => s.replace(/[^\w.-]+/g, "_").slice(0, 80);
      const ts = (() => {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
      })();
      const fname = `${safe(filename || `team-${teamId}-invites`)}-${ts}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
      res.status(200).send(bom + csvBody);
    } catch (e) {
      next(e);
    }
  }
);
