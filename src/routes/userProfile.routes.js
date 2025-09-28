import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

/* =========== PROFILE =========== */
const UserIdParams = z.object({ userId: z.string().min(1) });

const CreateProfileBody = z.object({
  headline: z.string().min(2).max(120).optional(),
  bio: z.string().max(2000).optional(),
  seniority: z.string().min(2).max(40).optional(),
  location: z.string().min(2).max(120).optional(),
  availability: z.number().int().min(1).max(60).optional(),
  stack: z.string().min(2).max(200).optional(),
  sector: z.string().min(2).max(120).optional(),
});

router.get("/:userId/profile", validate(UserIdParams, "params"), async (req, res, next) => {
  try {
    const profile = await prisma.memberProfile.findUnique({
      where: { userId: req.params.userId },
    });
    if (!profile) throw new HttpError(404, "Perfil no encontrado");
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

// Crea o reemplaza perfil (upsert semántico: si no hay, crea; si hay, actualiza)
router.post(
  "/:userId/profile",
  validate(UserIdParams, "params"),
  validate(CreateProfileBody),
  async (req, res, next) => {
    try {
      // verifica existencia user
      const user = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { id: true } });
      if (!user) throw new HttpError(404, "Usuario no encontrado");

      const saved = await prisma.memberProfile.upsert({
        where: { userId: req.params.userId },
        create: { userId: req.params.userId, ...req.body },
        update: { ...req.body },
      });
      res.status(201).json(saved);
    } catch (e) {
      next(e);
    }
  }
);

// Actualiza parcialmente
router.patch(
  "/:userId/profile",
  validate(UserIdParams, "params"),
  validate(CreateProfileBody),
  async (req, res, next) => {
    try {
      const updated = await prisma.memberProfile.update({
        where: { userId: req.params.userId },
        data: { ...req.body },
      });
      res.json(updated);
    } catch (e) {
      if (e?.code === "P2025") return next(new HttpError(404, "Perfil no encontrado"));
      next(e);
    }
  }
);

/* =========== CERTIFICATIONS =========== */
const CreateCertBody = z.object({
  name: z.string().min(2).max(160),
  issuer: z.string().min(2).max(160).optional(),
  issueDate: z.string().datetime().optional(), // ISO
  url: z.string().url().optional(),
});

router.get("/:userId/certifications", validate(UserIdParams, "params"), async (req, res, next) => {
  try {
    const rows = await prisma.certification.findMany({
      where: { userId: req.params.userId },
      orderBy: [{ issueDate: "desc" }, { name: "asc" }],
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/:userId/certifications",
  validate(UserIdParams, "params"),
  validate(CreateCertBody),
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { id: true } });
      if (!user) throw new HttpError(404, "Usuario no encontrado");

      const created = await prisma.certification.create({
        data: {
          userId: req.params.userId,
          name: req.body.name,
          issuer: req.body.issuer ?? null,
          issueDate: req.body.issueDate ? new Date(req.body.issueDate) : null,
          url: req.body.url ?? null,
        },
      });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  }
);

const CertParams = z.object({ userId: z.string().min(1), certId: z.string().min(1) });

router.patch(
  "/:userId/certifications/:certId",
  validate(CertParams, "params"),
  validate(CreateCertBody.partial()),
  async (req, res, next) => {
    try {
      const updated = await prisma.certification.update({
        where: { id: req.params.certId },
        data: {
          ...("name" in req.body ? { name: req.body.name } : {}),
          ...("issuer" in req.body ? { issuer: req.body.issuer ?? null } : {}),
          ...("issueDate" in req.body
            ? { issueDate: req.body.issueDate ? new Date(req.body.issueDate) : null }
            : {}),
          ...("url" in req.body ? { url: req.body.url ?? null } : {}),
        },
      });
      res.json(updated);
    } catch (e) {
      if (e?.code === "P2025") return next(new HttpError(404, "Certificación no encontrada"));
      next(e);
    }
  }
);

router.delete("/:userId/certifications/:certId", validate(CertParams, "params"), async (req, res, next) => {
  try {
    await prisma.certification.delete({ where: { id: req.params.certId } });
    res.status(204).send();
  } catch (e) {
    if (e?.code === "P2025") return next(new HttpError(404, "Certificación no encontrada"));
    next(e);
  }
});

/* =========== EXPERIENCES =========== */
const CreateExpBody = z.object({
  role: z.string().min(2).max(120),
  company: z.string().min(2).max(160).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  description: z.string().max(2000).optional(),
});

router.get("/:userId/experiences", validate(UserIdParams, "params"), async (req, res, next) => {
  try {
    const rows = await prisma.experience.findMany({
      where: { userId: req.params.userId },
      orderBy: [{ startDate: "desc" }, { role: "asc" }],
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/:userId/experiences",
  validate(UserIdParams, "params"),
  validate(CreateExpBody),
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { id: true } });
      if (!user) throw new HttpError(404, "Usuario no encontrado");

      const created = await prisma.experience.create({
        data: {
          userId: req.params.userId,
          role: req.body.role,
          company: req.body.company ?? null,
          startDate: req.body.startDate ? new Date(req.body.startDate) : null,
          endDate: req.body.endDate ? new Date(req.body.endDate) : null,
          description: req.body.description ?? null,
        },
      });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  }
);

const ExpParams = z.object({ userId: z.string().min(1), expId: z.string().min(1) });

router.patch(
  "/:userId/experiences/:expId",
  validate(ExpParams, "params"),
  validate(CreateExpBody.partial()),
  async (req, res, next) => {
    try {
      const updated = await prisma.experience.update({
        where: { id: req.params.expId },
        data: {
          ...("role" in req.body ? { role: req.body.role } : {}),
          ...("company" in req.body ? { company: req.body.company ?? null } : {}),
          ...("startDate" in req.body
            ? { startDate: req.body.startDate ? new Date(req.body.startDate) : null }
            : {}),
          ...("endDate" in req.body
            ? { endDate: req.body.endDate ? new Date(req.body.endDate) : null }
            : {}),
          ...("description" in req.body ? { description: req.body.description ?? null } : {}),
        },
      });
      res.json(updated);
    } catch (e) {
      if (e?.code === "P2025") return next(new HttpError(404, "Experiencia no encontrada"));
      next(e);
    }
  }
);

router.delete("/:userId/experiences/:expId", validate(ExpParams, "params"), async (req, res, next) => {
  try {
    await prisma.experience.delete({ where: { id: req.params.expId } });
    res.status(204).send();
  } catch (e) {
    if (e?.code === "P2025") return next(new HttpError(404, "Experiencia no encontrada"));
    next(e);
  }
});
