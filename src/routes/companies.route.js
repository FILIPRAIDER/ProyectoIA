import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

/* =========================
   Schemas
========================= */
const CreateCompanySchema = z.object({
  name: z.string().min(2, "Nombre muy corto").trim(),
  sector: z.string().trim().optional(),
  city: z.string().trim().optional(),
  website: z.string().url().optional(),
  about: z.string().trim().optional(),
});

const CompanyIdParams = z.object({
  id: z.string().min(1),
});

const ListCompaniesQuery = z.object({
  search: z.string().trim().optional(), // busca por nombre (contains, insensitive)
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("name"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

/* =========================
   POST /companies
========================= */
router.post("/", validate(CreateCompanySchema), async (req, res, next) => {
  try {
    const company = await prisma.company.create({ data: req.body });
    res.status(201).json(company);
  } catch (e) {
    if (e?.code === "P2002") {
      return next(new HttpError(409, "El nombre de la empresa ya existe"));
    }
    next(e);
  }
});

/* =========================
   GET /companies/:id
========================= */
router.get("/:id", validate(CompanyIdParams, "params"), async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { projects: true } },
      },
    });
    if (!company) throw new HttpError(404, "Empresa no encontrada");
    res.json(company);
  } catch (e) {
    next(e);
  }
});

/* =========================
   GET /companies?search=&page=&limit=
========================= */
router.get("/", validate(ListCompaniesQuery, "query"), async (req, res, next) => {
  try {
    const { search, page, limit, sortBy, sortDir } = req.query;

    const where = search
      ? { name: { contains: search, mode: "insensitive" } }
      : {};

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const [rows, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: [{ [sortBy]: sortDir }],
        skip,
        take,
        select: {
          id: true,
          name: true,
          sector: true,
          city: true,
          website: true,
          _count: { select: { projects: true } },
        },
      }),
      prisma.company.count({ where }),
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
});
