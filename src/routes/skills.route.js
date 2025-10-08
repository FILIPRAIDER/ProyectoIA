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
// Query params:
//   - search: Filtrar por nombre (case-insensitive)
//   - limit: Resultados por página (default: 50, max: 100)
//   - page: Número de página (default: 1)
//   - orderBy: Campo para ordenar (default: "name")
//   - order: Dirección (asc/desc, default: "asc")
//   - simple: Si es "true", retorna solo {id, name} para autocomplete
router.get("/", async (req, res, next) => {
  try {
    const {
      search = "",
      page = "1",
      limit = "50",
      orderBy = "name",
      order = "asc",
      simple = "false", // Nuevo: modo simple para autocomplete
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const isSimpleMode = simple === "true";

    // Construir filtro de búsqueda
    const where = search
      ? {
          name: {
            contains: search,
            mode: "insensitive", // Case-insensitive search
          },
        }
      : {};

    // Determinar qué campos seleccionar
    const selectFields = isSimpleMode
      ? {
          id: true,
          name: true,
        }
      : {
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
        };

    // Obtener skills con filtros
    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where,
        orderBy: { [orderBy]: order },
        skip,
        take: limitNum,
        select: selectFields,
      }),
      prisma.skill.count({ where }),
    ]);

    // Formatear respuesta según el modo
    const formattedSkills = isSimpleMode
      ? skills // Retornar tal cual para autocomplete: { id, name }
      : skills.map((skill) => ({
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
