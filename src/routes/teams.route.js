import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";
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

      // 🔄 AUTO-COPIAR: Copiar todas las skills del usuario al equipo
      const userSkills = await prisma.userSkill.findMany({
        where: { userId: req.body.userId },
        select: { skillId: true }
      });

      let skillsCopied = 0;
      for (const { skillId } of userSkills) {
        try {
          await prisma.teamSkill.upsert({
            where: {
              teamId_skillId: {
                teamId: req.params.teamId,
                skillId
              }
            },
            create: {
              teamId: req.params.teamId,
              skillId
            },
            update: {} // No sobrescribir si ya existe
          });
          skillsCopied++;
        } catch (e) {
          // Si ya existe, continuar
          console.warn(`Skill ${skillId} already exists in team or error:`, e.message);
        }
      }

      console.log(`✅ Miembro agregado y ${skillsCopied} skill(s) copiadas al equipo`);

      res.status(201).json({
        ...created,
        skillsCopied, // Información adicional para debugging
      });
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

const RemoveMemberBody = z.object({
  byUserId: z.string().min(1),
});

router.delete(
  "/:teamId/members/:userId",
  validate(RemoveMemberParams, "params"),
  validate(RemoveMemberBody),
  async (req, res, next) => {
    try {
      const { teamId, userId } = req.params;
      const { byUserId } = req.body;

      // ✅ Verificar que el usuario actual es líder del equipo
      await assertLeaderOrAdmin(teamId, byUserId);

      // ✅ No puede expulsarse a sí mismo
      if (userId === byUserId) {
        throw new HttpError(400, "No puedes expulsarte a ti mismo");
      }

      // ✅ Obtener miembro a expulsar
      const memberToRemove = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId } },
        select: { role: true },
      });

      if (!memberToRemove) {
        throw new HttpError(404, "El usuario no es miembro de este equipo");
      }

      // ✅ Si es líder, verificar que haya al menos otro líder
      if (memberToRemove.role === "LIDER") {
        const leaderCount = await prisma.teamMember.count({
          where: { teamId, role: "LIDER" },
        });

        if (leaderCount === 1) {
          throw new HttpError(
            400,
            "Debe haber al menos un líder en el equipo"
          );
        }
      }

      // ✅ Expulsar miembro
      await prisma.teamMember.delete({
        where: { teamId_userId: { teamId, userId } },
      });

      res.json({
        success: true,
        message: "Miembro expulsado correctamente",
      });
    } catch (e) {
      next(e);
    }
  }
);

/* ============================================================================
   CAMBIAR ROL DE MIEMBRO
============================================================================ */
const ChangeMemberRoleParams = z.object({
  teamId: z.string().min(1),
  userId: z.string().min(1),
});

const ChangeMemberRoleBody = z.object({
  role: z.enum(["LIDER", "MIEMBRO"]),
  byUserId: z.string().min(1),
});

router.patch(
  "/:teamId/members/:userId/role",
  validate(ChangeMemberRoleParams, "params"),
  validate(ChangeMemberRoleBody),
  async (req, res, next) => {
    try {
      const { teamId, userId } = req.params;
      const { role, byUserId } = req.body;

      // ✅ Verificar que el usuario actual es líder del equipo
      await assertLeaderOrAdmin(teamId, byUserId);

      // ✅ No puede cambiar su propio rol
      if (userId === byUserId) {
        throw new HttpError(400, "No puedes cambiar tu propio rol");
      }

      // ✅ Obtener miembro a cambiar
      const memberToChange = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId } },
        select: { role: true },
      });

      if (!memberToChange) {
        throw new HttpError(404, "El usuario no es miembro de este equipo");
      }

      // ✅ Si va a cambiar de LIDER a MIEMBRO, verificar que haya otro líder
      if (memberToChange.role === "LIDER" && role === "MIEMBRO") {
        const leaderCount = await prisma.teamMember.count({
          where: { teamId, role: "LIDER" },
        });

        if (leaderCount === 1) {
          throw new HttpError(
            400,
            "Debe haber al menos un líder en el equipo"
          );
        }
      }

      // ✅ Actualizar rol
      const updated = await prisma.teamMember.update({
        where: { teamId_userId: { teamId, userId } },
        data: { role },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          },
        },
      });

      res.json({
        success: true,
        role,
        member: updated,
        message: "Rol actualizado correctamente",
      });
    } catch (e) {
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

      console.log("✅ Invitación creada exitosamente");
      console.log("📧 Email será manejado por el frontend");

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

      console.log("📧 Reenvío de email será manejado por el frontend");

      // Retornar la invitación para que el frontend reenvíe el email
      return res.json({
        ok: true,
        inviteId,
        invitation: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          token: invite.token,
          status: invite.status,
          expiresAt: invite.expiresAt,
          teamId: invite.teamId,
          invitedBy: invite.invitedBy,
          message: invite.message,
        },
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

/* ============================================================================
   MATCHING ENDPOINTS - Para Frontend de Matching
============================================================================ */

/* ========== GET /teams/:teamId/profile ========== */
/**
 * Obtener perfil completo de un equipo para mostrar en modal de matching
 * 
 * Response incluye:
 * - Información básica del equipo
 * - Skills con niveles
 * - Miembros del equipo con sus skills
 * - Portfolio de proyectos (si existe)
 * - Disponibilidad
 * - Rango de presupuesto
 */
router.get(
  "/:teamId/profile",
  validate(TeamIdOnlyParams, "params"),
  async (req, res, next) => {
    try {
      const { teamId } = req.params;

      // Obtener equipo con todas las relaciones necesarias
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          skills: {
            include: {
              skill: true,
            },
            orderBy: {
              skill: { name: "asc" },
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  avatarUrl: true,
                  skills: {
                    include: {
                      skill: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              role: "asc",
            },
          },
        },
      });

      if (!team) {
        throw new HttpError(404, "Equipo no encontrado");
      }

      // Calcular estadísticas
      const totalProjects = 0; // TODO: Implementar cuando exista tabla de proyectos del equipo
      const completedProjects = 0; // TODO: Implementar

      // Calcular años de experiencia promedio por skill
      const skillsWithExperience = team.skills.map((ts) => {
        // Calcular años de experiencia basado en los miembros que tienen esa skill
        const membersWithSkill = team.members.filter((m) =>
          m.user.skills.some((us) => us.skillId === ts.skillId)
        );

        // Años de experiencia estimados (placeholder - mejorar con datos reales)
        const yearsExperience = membersWithSkill.length > 0 ? 
          Math.min(6, 2 + membersWithSkill.length) : 3;

        return {
          id: ts.skill.id,
          name: ts.skill.name,
          level: 4, // TODO: Calcular nivel promedio real de los miembros
          yearsExperience,
        };
      });

      // Formatear miembros
      const formattedMembers = team.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        role: m.role === "LIDER" ? "Team Lead" : "Member",
        avatar: m.user.avatarUrl || null,
        skills: m.user.skills.map((us) => us.skill.name),
        yearsExperience: 3, // TODO: Calcular basado en datos reales
      }));

      // Portfolio (placeholder - implementar cuando exista tabla)
      const portfolio = [];

      // Response
      const profile = {
        id: team.id,
        name: team.name,
        description: team.description || `Equipo especializado en ${team.area || "desarrollo de software"}`,
        city: team.city || "Colombia",
        country: "Colombia",
        profileImage: null, // TODO: Agregar campo en BD
        website: null, // TODO: Agregar campo en BD
        email: formattedMembers.find((m) => m.role === "Team Lead")?.email || null,
        phone: null, // TODO: Agregar campo en BD

        verified: false, // TODO: Implementar sistema de verificación
        rating: 4.5, // TODO: Implementar sistema de ratings
        totalProjects,
        completedProjects,

        skills: skillsWithExperience,
        members: formattedMembers,
        portfolio,

        availability: {
          status: "AVAILABLE", // TODO: Agregar campo en BD
          availableFrom: new Date().toISOString().split("T")[0],
          hoursPerWeek: 40,
        },

        budgetRange: {
          min: 10000000, // TODO: Agregar campos en BD
          max: 50000000,
          currency: "COP",
        },
      };

      res.json(profile);
    } catch (e) {
      next(e);
    }
  }
);

/* ========== POST /teams/:teamId/connect ========== */
/**
 * Enviar solicitud de conexión de un empresario a un equipo
 * 
 * Request body:
 * - projectId: ID del proyecto
 * - companyId: ID de la empresa (del empresario)
 * - message: Mensaje para el equipo
 * 
 * Side effects:
 * - Crea registro en team_connections
 * - Envía email al líder del equipo (TODO)
 * - Crea notificación in-app (TODO)
 */
const ConnectTeamBody = z.object({
  projectId: z.string().min(1, "Project ID es requerido"),
  companyId: z.string().min(1, "Company ID es requerido"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres").max(1000),
});

router.post(
  "/:teamId/connect",
  validate(TeamIdOnlyParams, "params"),
  validate(ConnectTeamBody),
  async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const { projectId, companyId, message } = req.body;

      // Validar que el equipo existe
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, name: true },
      });

      if (!team) {
        throw new HttpError(404, "El equipo no existe");
      }

      // Validar que el proyecto existe
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, title: true, companyId: true },
      });

      if (!project) {
        throw new HttpError(404, "El proyecto no existe");
      }

      // Validar que el companyId coincide con el del proyecto
      if (project.companyId !== companyId) {
        throw new HttpError(403, "No tienes permisos para crear conexiones para este proyecto");
      }

      // Verificar que no exista una conexión duplicada
      const existingConnection = await prisma.teamConnection.findFirst({
        where: {
          teamId,
          projectId,
        },
      });

      if (existingConnection) {
        throw new HttpError(409, "Ya enviaste una solicitud a este equipo para este proyecto");
      }

      // Crear la conexión
      const connection = await prisma.teamConnection.create({
        data: {
          teamId,
          projectId,
          companyId,
          message,
          status: "PENDING",
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      // TODO: Enviar email al líder del equipo
      // TODO: Crear notificación in-app

      res.status(201).json({
        connectionId: connection.id,
        status: connection.status,
        team: connection.team,
        project: connection.project,
        createdAt: connection.createdAt,
        message: "Solicitud enviada. El equipo recibirá una notificación.",
      });
    } catch (e) {
      next(e);
    }
  }
);

/* ========== GET /teams/:teamId/connections ========== */
/**
 * Obtener lista de conexiones/solicitudes de un equipo
 * 
 * Query params:
 * - status: Filtrar por estado (PENDING, ACCEPTED, REJECTED)
 * 
 * Solo el líder o miembros del equipo pueden ver las conexiones
 */
const ListConnectionsQuery = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).optional(),
});

router.get(
  "/:teamId/connections",
  validate(TeamIdOnlyParams, "params"),
  validate(ListConnectionsQuery, "query"),
  async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const { status } = req.query;

      // Validar que el equipo existe
      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        throw new HttpError(404, "Equipo no encontrado");
      }

      // TODO: Validar que el usuario es miembro del equipo

      // Obtener conexiones
      const where = {
        teamId,
        ...(status ? { status } : {}),
      };

      const connections = await prisma.teamConnection.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              budget: true,
              budgetCurrency: true,
              startDate: true,
              endDate: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json({
        connections: connections.map((c) => ({
          id: c.id,
          project: {
            ...c.project,
            timeline: c.project.startDate && c.project.endDate
              ? `${Math.ceil((new Date(c.project.endDate) - new Date(c.project.startDate)) / (1000 * 60 * 60 * 24 * 30))} meses`
              : "No especificado",
          },
          company: c.company,
          message: c.message,
          status: c.status,
          createdAt: c.createdAt,
        })),
        total: connections.length,
      });
    } catch (e) {
      next(e);
    }
  }
);
