import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

/* ========== POST /teams ==========
   Body: { name: string, city?: string, area?: string }
*/
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

/* ========== PATCH /teams/:id ==========
   Body (parcial): { name?, city?, area? }
*/
const TeamIdParams = z.object({ id: z.string().min(1) });
const UpdateTeamBody = z.object({
  name: z.string().trim().min(2).optional(),
  city: z.string().trim().min(2).optional().nullable(),
  area: z.string().trim().min(2).max(50).optional().nullable(),
});

router.patch("/:id", validate(TeamIdParams, "params"), validate(UpdateTeamBody), async (req, res, next) => {
  try {
    const updated = await prisma.team.update({
      where: { id: req.params.id },
      data: {
        ...("name" in req.body ? { name: req.body.name } : {}),
        ...("city" in req.body ? { city: req.body.city ?? null } : {}),
        ...("area" in req.body ? { area: req.body.area ?? null } : {}),
      },
    });
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2025") return next(new HttpError(404, "Equipo no encontrado"));
    next(e);
  }
});

/* ========== GET /teams/:id ========== */
router.get("/:id", validate(TeamIdParams, "params"), async (req, res, next) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
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

/* ========== MEMBERS ========== */
const TeamIdOnlyParams = z.object({ teamId: z.string().min(1) });

router.get("/:teamId/members", validate(TeamIdOnlyParams, "params"), async (req, res, next) => {
  try {
    const exists = await prisma.team.findUnique({ where: { id: req.params.teamId }, select: { id: true } });
    if (!exists) throw new HttpError(404, "Equipo no encontrado");

    const members = await prisma.teamMember.findMany({
      where: { teamId: req.params.teamId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { role: "asc" },
    });

    res.json(members);
  } catch (e) {
    next(e);
  }
});

const AddMemberBody = z.object({
  userId: z.string().min(1),
  role: z.enum(["LIDER", "MIEMBRO"]).optional().default("MIEMBRO"),
});

router.post("/:teamId/members", validate(TeamIdOnlyParams, "params"), validate(AddMemberBody), async (req, res, next) => {
  try {
    const [team, user] = await Promise.all([
      prisma.team.findUnique({ where: { id: req.params.teamId }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: req.body.userId }, select: { id: true } }),
    ]);
    if (!team) throw new HttpError(404, "Equipo no encontrado");
    if (!user) throw new HttpError(404, "Usuario no encontrado");

    const created = await prisma.teamMember.create({
      data: {
        teamId: req.params.teamId,
        userId: req.body.userId,
        role: req.body.role,
      },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    res.status(201).json(created);
  } catch (e) {
    if (e?.code === "P2002") return next(new HttpError(409, "El usuario ya es miembro de este equipo"));
    next(e);
  }
});

const RemoveMemberParams = z.object({ teamId: z.string().min(1), userId: z.string().min(1) });

router.delete("/:teamId/members/:userId", validate(RemoveMemberParams, "params"), async (req, res, next) => {
  try {
    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId: req.params.teamId, userId: req.params.userId } },
    });
    res.status(204).send();
  } catch (e) {
    if (e?.code === "P2025") return next(new HttpError(404, "El usuario no es miembro de este equipo"));
    next(e);
  }
});

/* ========== TEAM SKILLS ========== */
// GET /teams/:teamId/skills
router.get("/:teamId/skills", validate(TeamIdOnlyParams, "params"), async (req, res, next) => {
  try {
    const exists = await prisma.team.findUnique({ where: { id: req.params.teamId }, select: { id: true } });
    if (!exists) throw new HttpError(404, "Equipo no encontrado");

    const rows = await prisma.teamSkill.findMany({
      where: { teamId: req.params.teamId },
      include: { skill: true },
      orderBy: { skill: { name: "asc" } },
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// POST /teams/:teamId/skills  Body: { skillId: string }
const AddTeamSkillBody = z.object({
  skillId: z.string().min(1),
});

router.post("/:teamId/skills", validate(TeamIdOnlyParams, "params"), validate(AddTeamSkillBody), async (req, res, next) => {
  try {
    const [team, skill] = await Promise.all([
      prisma.team.findUnique({ where: { id: req.params.teamId }, select: { id: true } }),
      prisma.skill.findUnique({ where: { id: req.body.skillId }, select: { id: true, name: true } }),
    ]);
    if (!team) throw new HttpError(404, "Equipo no encontrado");
    if (!skill) throw new HttpError(404, "Skill no encontrada");

    const rel = await prisma.teamSkill.create({
      data: { teamId: req.params.teamId, skillId: req.body.skillId },
      include: { skill: true },
    });
    res.status(201).json(rel);
  } catch (e) {
    if (e?.code === "P2002") return next(new HttpError(409, "La skill ya está asignada a este equipo"));
    next(e);
  }
});

// DELETE /teams/:teamId/skills/:skillId
const TeamSkillParams = z.object({ teamId: z.string().min(1), skillId: z.string().min(1) });

router.delete("/:teamId/skills/:skillId", validate(TeamSkillParams, "params"), async (req, res, next) => {
  try {
    await prisma.teamSkill.delete({
      where: { teamId_skillId: { teamId: req.params.teamId, skillId: req.params.skillId } },
    });
    res.status(204).send();
  } catch (e) {
    if (e?.code === "P2025") return next(new HttpError(404, "Esa skill no está asignada al equipo"));
    next(e);
  }
});
