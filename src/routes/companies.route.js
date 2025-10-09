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
  userId: z.string().min(1).optional(), // ID del usuario empresario que crea la empresa
});

const UpdateCompanySchema = z.object({
  name: z.string().min(2, "Nombre muy corto").trim().optional(),
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
    const { userId, ...companyData } = req.body;
    
    // 1. Crear la empresa
    const company = await prisma.company.create({ data: companyData });
    
    // 2. Si se proporciona userId, vincular la empresa al usuario
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { companyId: company.id }
      });
      
      console.log(`✅ Empresa "${company.name}" vinculada al usuario ${userId}`);
    }
    
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
   PATCH /companies/:id
========================= */
router.patch(
  "/:id",
  validate(CompanyIdParams, "params"),
  validate(UpdateCompanySchema),
  async (req, res, next) => {
    try {
      // Construir payload solo con campos definidos
      const updateData = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.sector !== undefined) updateData.sector = req.body.sector;
      if (req.body.city !== undefined) updateData.city = req.body.city;
      if (req.body.website !== undefined) updateData.website = req.body.website;
      if (req.body.about !== undefined) updateData.about = req.body.about;

      const company = await prisma.company.update({
        where: { id: req.params.id },
        data: updateData,
      });

      console.log(`✅ Empresa "${company.name}" actualizada`);
      res.json(company);
    } catch (e) {
      if (e?.code === "P2025") {
        return next(new HttpError(404, "Empresa no encontrada"));
      }
      if (e?.code === "P2002") {
        return next(new HttpError(409, "El nombre de la empresa ya existe"));
      }
      next(e);
    }
  }
);

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
