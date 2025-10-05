import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

/* POST /companies */
const CreateCompanyBody = z.object({
  name: z.string().min(2).max(120).trim(),
  sector: z.string().min(2).max(120).trim().optional(),
  website: z.string().url().optional(),
  city: z.string().min(2).max(120).trim().optional(),
  about: z.string().max(2000).optional(),
});

router.post("/", validate(CreateCompanyBody), async (req, res, next) => {
  try {
    const created = await prisma.company.create({ data: req.body });
    res.status(201).json(created);
  } catch (e) {
    if (e?.code === "P2002") return next(new HttpError(409, "La empresa ya existe (name único)"));
    next(e);
  }
});

/* GET /companies/:id */
const CompanyIdParams = z.object({ id: z.string().min(1) });

router.get("/:id", validate(CompanyIdParams, "params"), async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: { projects: { select: { id: true, title: true, status: true } } },
    });
    if (!company) throw new HttpError(404, "Empresa no encontrada");
    res.json(company);
  } catch (e) {
    next(e);
  }
});
