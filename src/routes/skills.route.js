import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

// ---------- POST /skills ----------
const CreateSkillSchema = z.object({
  name: z.string().min(2, "Nombre de la skill muy corto").trim(),
});

router.post("/", validate(CreateSkillSchema), async (req, res, next) => {
  try {
    const skill = await prisma.skill.create({
      data: { name: req.body.name },
    });
    res.status(201).json(skill);
  } catch (e) {
    if (e?.code === "P2002") {
      return next(new HttpError(409, "La skill ya existe (name único)"));
    }
    next(e);
  }
});

// ---------- GET /skills ----------
// Soporta búsqueda, paginación y ordenamiento
router.get("/", async (req, res, next) => {
  try {
    const {
      search = "",
      page = "1",
      limit = "50",
      orderBy = "name",
      order = "asc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Construir filtro de búsqueda
    const where = search
      ? {
          name: {
            contains: search,
            mode: "insensitive", // Case-insensitive search
          },
        }
      : {};

    // Obtener skills con filtros
    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where,
        orderBy: { [orderBy]: order },
        skip,
        take: limitNum,
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
              teams: true,
              projects: true,
            },
          },
        },
      }),
      prisma.skill.count({ where }),
    ]);

    // Formatear respuesta con estadísticas
    const formattedSkills = skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      createdAt: skill.createdAt,
      stats: {
        usersCount: skill._count.users,
        teamsCount: skill._count.teams,
        projectsCount: skill._count.projects,
        totalUsage: skill._count.users + skill._count.teams + skill._count.projects,
      },
    }));

    res.json({
      ok: true,
      skills: formattedSkills,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + limitNum < total,
      },
      search: search || null,
    });
  } catch (e) {
    next(e);
  }
});
