import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

/* =========================
   Schemas
========================= */
const CreateProjectBody = z.object({
  companyId: z.string().min(1),
  title: z.string().min(2).max(160),
  description: z.string().max(3000).optional(),
  city: z.string().trim().optional(),
  area: z.string().trim().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELED"]).optional(),
  budget: z.coerce.number().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const ProjectIdParams = z.object({ id: z.string().min(1) });

const ListProjectsQuery = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELED"]).optional(),
  city: z.string().trim().optional(),
  area: z.string().trim().optional(),
  skill: z.string().trim().optional(), // filtra por nombre de skill requerida
  includeDescription: z.coerce.boolean().optional().default(false), // <- NUEVO
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z
    .enum(["createdAt", "updatedAt", "title", "status"])
    .default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

/* =========================
   POST /projects
========================= */
router.post("/", validate(CreateProjectBody), async (req, res, next) => {
  try {
    // Único por (companyId + lower(title)) a nivel de aplicación (además del índice único en BD si lo tienes)
    const existing = await prisma.project.findFirst({
      where: {
        companyId: req.body.companyId,
        title: { equals: req.body.title, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (existing) {
      return next(
        new HttpError(
          409,
          "Ya existe un proyecto con ese título para la empresa (case-insensitive)"
        )
      );
    }

    const created = await prisma.project.create({
      data: {
        companyId: req.body.companyId,
        title: req.body.title.trim(),
        description: req.body.description ?? null,
        city: req.body.city ?? null,
        area: req.body.area ?? null,
        status: req.body.status ?? "OPEN",
        budget: req.body.budget ?? null,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      },
    });

    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

/* =========================
   GET /projects/:id
========================= */
router.get("/:id", validate(ProjectIdParams, "params"), async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        company: { select: { id: true, name: true } },
        skills: { include: { skill: true } },
        _count: { select: { assignments: true } },
      },
    });
    if (!project) throw new HttpError(404, "Proyecto no encontrado");
    res.json(project);
  } catch (e) {
    next(e);
  }
});

/* =========================
   GET /projects?status=&city=&area=&skill=&includeDescription=
========================= */
router.get("/", validate(ListProjectsQuery, "query"), async (req, res, next) => {
  try {
    const {
      status,
      city,
      area,
      skill,
      includeDescription = false,
      page,
      limit,
      sortBy,
      sortDir,
    } = req.query;

    const where = {
      ...(status ? { status } : {}),
      ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
      ...(area ? { area: { contains: area, mode: "insensitive" } } : {}),
      ...(skill
        ? {
            skills: {
              some: {
                skill: { name: { contains: skill, mode: "insensitive" } },
              },
            },
          }
        : {}),
    };

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    // Selección slim vs full (incluir o no description)
    const baseSelect = includeDescription
      ? {
          id: true,
          title: true,
          status: true,
          city: true,
          area: true,
          description: true, // <- NUEVO cuando includeDescription=true
          company: { select: { id: true, name: true } },
          _count: { select: { assignments: true } },
        }
      : {
          id: true,
          title: true,
          status: true,
          city: true,
          area: true,
          company: { select: { id: true, name: true } },
          _count: { select: { assignments: true } },
        };

    const [rows, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: [{ [sortBy]: sortDir }],
        skip,
        take,
        select: baseSelect,
      }),
      prisma.project.count({ where }),
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
      includeDescription,
    };

    res.json({ data: rows, meta });
  } catch (e) {
    next(e);
  }
});
