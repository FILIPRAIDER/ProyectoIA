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
  // área flexible pero no vacía si viene
  area: z
    .string()
    .trim()
    .min(2, "Área muy corta")
    .max(50, "Área muy larga")
    .optional(),
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

/* ========== GET /teams/:id ========== */
const TeamIdParams = z.object({ id: z.string().min(1) });

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
      },
    });
    if (!team) throw new HttpError(404, "Equipo no encontrado");
    res.json(team);
  } catch (e) {
    next(e);
  }
});

/* ========== GET /teams?city=...&area=...&skill=... ==========
   - city: coincidencia exacta insensible a mayúsculas
   - area: coincidencia por contains (insensible)
   - skill: equipos con algún miembro que tenga esa skill por nombre (contains insensible)
*/
const ListTeamsQuery = z.object({
  city: z.string().trim().optional(),
  area: z.string().trim().optional(),
  skill: z.string().trim().optional(),
});

router.get("/", validate(ListTeamsQuery, "query"), async (req, res, next) => {
  try {
    const { city, area, skill } = req.query;
    const where = {};

    if (city) {
      where.city = { equals: city, mode: "insensitive" };
    }
    if (area) {
      // usamos contains para tolerar variantes como "IA", "Inteligencia Artificial"
      where.area = { contains: area, mode: "insensitive" };
    }
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

/* ========== GET /teams/:teamId/members ========== */
const TeamIdOnlyParams = z.object({ teamId: z.string().min(1) });

router.get("/:teamId/members", validate(TeamIdOnlyParams, "params"), async (req, res, next) => {
  try {
    const exists = await prisma.team.findUnique({
      where: { id: req.params.teamId },
      select: { id: true },
    });
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

/* ========== POST /teams/:teamId/members ==========
   Body: { userId: string, role?: "LIDER" | "MIEMBRO" }
*/
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
      if (e?.code === "P2002") {
        return next(new HttpError(409, "El usuario ya es miembro de este equipo"));
      }
      next(e);
    }
  }
);

/* ========== DELETE /teams/:teamId/members/:userId ========== */
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
        where: { teamId_userId: { teamId: req.params.teamId, userId: req.params.userId } },
      });
      res.status(204).send();
    } catch (e) {
      if (e?.code === "P2025") {
        return next(new HttpError(404, "El usuario no es miembro de este equipo"));
      }
      next(e);
    }
  }
);
