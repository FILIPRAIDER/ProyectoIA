import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

/* =========== PROFILE =========== */
const UserIdParams = z.object({ userId: z.string().min(1) });

const IdentityTypeEnum = z.enum(["CC", "TI", "CE", "PEP", "PASAPORTE", "NIT"]);

const CreateProfileBody = z.object({
  headline: z.string().min(2).max(120).optional(),
  bio: z.string().max(2000).optional(),
  seniority: z.string().min(2).max(40).optional(),
  location: z.string().min(2).max(120).optional(),
  availability: z.number().int().min(1).max(60).optional(),
  stack: z.string().min(2).max(200).optional(),
  sector: z.string().min(2).max(120).optional(),

  identityType: IdentityTypeEnum.optional(),
  documentNumber: z.string().min(3).max(40).optional(),

  // TELÉFONO (opcional): libre + canónico
  phone: z.string().min(7).max(30).optional(),
  phoneE164: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Teléfono E.164 inválido")
    .optional(),
  phoneCountry: z.string().length(2).optional(), // ISO-3166 alpha-2

  birthdate: z.string().datetime().optional(), // ISO
});

// Validación condicional por rol: EMPRESARIO -> NIT
async function validateIdentityByRole(userId, body) {
  if (!("identityType" in body) && !("documentNumber" in body)) return; // opcional
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) throw new HttpError(404, "Usuario no encontrado");

  const { identityType, documentNumber } = body;

  if (user.role === "EMPRESARIO") {
    if (identityType && identityType !== "NIT") {
      throw new HttpError(
        400,
        "Para EMPRESARIO el tipo de identidad debe ser NIT"
      );
    }
    if (documentNumber && !/^\d{8,15}$/.test(documentNumber)) {
      // regla simple para NIT (ajústala si necesitas dígito de verificación)
      throw new HttpError(400, "NIT inválido");
    }
  } else {
    // miembro/líder (estudiante)
    if (identityType === "NIT") {
      throw new HttpError(400, "NIT solo aplica para EMPRESARIO");
    }
    if (documentNumber && !/^[A-Za-z0-9.\-]{5,20}$/.test(documentNumber)) {
      throw new HttpError(400, "Número de documento inválido");
    }
  }
}

router.get(
  "/:userId/profile",
  validate(UserIdParams, "params"),
  async (req, res, next) => {
    try {
      const profile = await prisma.memberProfile.findUnique({
        where: { userId: req.params.userId },
      });
      if (!profile) throw new HttpError(404, "Perfil no encontrado");
      res.json(profile);
    } catch (e) {
      next(e);
    }
  }
);

// Crea o actualiza (upsert)
router.post(
  "/:userId/profile",
  validate(UserIdParams, "params"),
  validate(CreateProfileBody),
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.userId },
        select: { id: true, role: true },
      });
      if (!user) throw new HttpError(404, "Usuario no encontrado");

      await validateIdentityByRole(req.params.userId, req.body);

      const saved = await prisma.memberProfile.upsert({
        where: { userId: req.params.userId },
        create: {
          userId: req.params.userId,
          ...req.body,
          birthdate: req.body.birthdate ? new Date(req.body.birthdate) : null,
        },
        update: {
          ...req.body,
          birthdate: req.body.birthdate ? new Date(req.body.birthdate) : null,
        },
      });

      // Si estaba en ACCOUNT, avanzar a PROFILE (flujo por fases)
      if (
        user.role &&
        (await prisma.user.findUnique({ where: { id: req.params.userId } }))
          .onboardingStep === "ACCOUNT"
      ) {
        await prisma.user.update({
          where: { id: req.params.userId },
          data: { onboardingStep: "PROFILE" },
        });
      }

      res.status(201).json(saved);
    } catch (e) {
      if (e?.code === "P2002" && e?.meta?.target?.includes("documentNumber")) {
        return next(
          new HttpError(409, "El número de documento ya está registrado")
        );
      }
      next(e);
    }
  }
);

router.patch(
  "/:userId/profile",
  validate(UserIdParams, "params"),
  validate(CreateProfileBody),
  async (req, res, next) => {
    try {
      await validateIdentityByRole(req.params.userId, req.body);

      const updated = await prisma.memberProfile.update({
        where: { userId: req.params.userId },
        data: {
          ...req.body,
          ...(req.body.birthdate !== undefined
            ? {
                birthdate: req.body.birthdate
                  ? new Date(req.body.birthdate)
                  : null,
              }
            : {}),
        },
      });
      res.json(updated);
    } catch (e) {
      if (e?.code === "P2025")
        return next(new HttpError(404, "Perfil no encontrado"));
      if (e?.code === "P2002" && e?.meta?.target?.includes("documentNumber")) {
        return next(
          new HttpError(409, "El número de documento ya está registrado")
        );
      }
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

  // Metadatos de archivo (opcionales)
  fileUrl: z.string().url().optional(),
  fileProvider: z.string().min(2).max(40).optional(), // "imagekit", etc.
  fileKey: z.string().min(1).optional(),
  fileType: z.string().min(3).max(100).optional(), // "image/jpeg", ...
  fileSize: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024)
    .optional(), // 10 MB
  fileWidth: z.number().int().min(1).max(20000).optional(),
  fileHeight: z.number().int().min(1).max(20000).optional(),
});

router.get(
  "/:userId/certifications",
  validate(UserIdParams, "params"),
  async (req, res, next) => {
    try {
      const rows = await prisma.certification.findMany({
        where: { userId: req.params.userId },
        orderBy: [{ issueDate: "desc" }, { name: "asc" }],
      });
      res.json(rows);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/:userId/certifications",
  validate(UserIdParams, "params"),
  validate(CreateCertBody),
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.userId },
        select: { id: true },
      });
      if (!user) throw new HttpError(404, "Usuario no encontrado");

      const created = await prisma.certification.create({
        data: {
          userId: req.params.userId,
          name: req.body.name,
          issuer: req.body.issuer ?? null,
          issueDate: req.body.issueDate ? new Date(req.body.issueDate) : null,
          url: req.body.url ?? null,

          fileUrl: req.body.fileUrl ?? null,
          fileProvider: req.body.fileProvider ?? null,
          fileKey: req.body.fileKey ?? null,
          fileType: req.body.fileType ?? null,
          fileSize: req.body.fileSize ?? null,
          fileWidth: req.body.fileWidth ?? null,
          fileHeight: req.body.fileHeight ?? null,
        },
      });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  }
);

const CertParams = z.object({
  userId: z.string().min(1),
  certId: z.string().min(1),
});

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
            ? {
                issueDate: req.body.issueDate
                  ? new Date(req.body.issueDate)
                  : null,
              }
            : {}),
          ...("url" in req.body ? { url: req.body.url ?? null } : {}),

          ...("fileUrl" in req.body
            ? { fileUrl: req.body.fileUrl ?? null }
            : {}),
          ...("fileProvider" in req.body
            ? { fileProvider: req.body.fileProvider ?? null }
            : {}),
          ...("fileKey" in req.body
            ? { fileKey: req.body.fileKey ?? null }
            : {}),
          ...("fileType" in req.body
            ? { fileType: req.body.fileType ?? null }
            : {}),
          ...("fileSize" in req.body
            ? { fileSize: req.body.fileSize ?? null }
            : {}),
          ...("fileWidth" in req.body
            ? { fileWidth: req.body.fileWidth ?? null }
            : {}),
          ...("fileHeight" in req.body
            ? { fileHeight: req.body.fileHeight ?? null }
            : {}),
        },
      });
      res.json(updated);
    } catch (e) {
      if (e?.code === "P2025")
        return next(new HttpError(404, "Certificación no encontrada"));
      next(e);
    }
  }
);

router.delete(
  "/:userId/certifications/:certId",
  validate(CertParams, "params"),
  async (req, res, next) => {
    try {
      await prisma.certification.delete({ where: { id: req.params.certId } });
      res.status(204).send();
    } catch (e) {
      if (e?.code === "P2025")
        return next(new HttpError(404, "Certificación no encontrada"));
      next(e);
    }
  }
);

/* =========== EXPERIENCES =========== */
const CreateExpBody = z.object({
  role: z.string().min(2).max(120),
  company: z.string().min(2).max(160).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  description: z.string().max(2000).optional(),
});

router.get(
  "/:userId/experiences",
  validate(UserIdParams, "params"),
  async (req, res, next) => {
    try {
      const rows = await prisma.experience.findMany({
        where: { userId: req.params.userId },
        orderBy: [{ startDate: "desc" }, { role: "asc" }],
      });
      res.json(rows);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/:userId/experiences",
  validate(UserIdParams, "params"),
  validate(CreateExpBody),
  async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.userId },
        select: { id: true },
      });
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

const ExpParams = z.object({
  userId: z.string().min(1),
  expId: z.string().min(1),
});

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
          ...("company" in req.body
            ? { company: req.body.company ?? null }
            : {}),
          ...("startDate" in req.body
            ? {
                startDate: req.body.startDate
                  ? new Date(req.body.startDate)
                  : null,
              }
            : {}),
          ...("endDate" in req.body
            ? { endDate: req.body.endDate ? new Date(req.body.endDate) : null }
            : {}),
          ...("description" in req.body
            ? { description: req.body.description ?? null }
            : {}),
        },
      });
      res.json(updated);
    } catch (e) {
      if (e?.code === "P2025")
        return next(new HttpError(404, "Experiencia no encontrada"));
      next(e);
    }
  }
);

router.delete(
  "/:userId/experiences/:expId",
  validate(ExpParams, "params"),
  async (req, res, next) => {
    try {
      await prisma.experience.delete({ where: { id: req.params.expId } });
      res.status(204).send();
    } catch (e) {
      if (e?.code === "P2025")
        return next(new HttpError(404, "Experiencia no encontrada"));
      next(e);
    }
  }
);

// Perfil + skills del usuario
router.get(
  "/:userId/profile/full",
  validate(UserIdParams, "params"),
  async (req, res, next) => {
    try {
      const [profile, skills] = await Promise.all([
        prisma.memberProfile.findUnique({
          where: { userId: req.params.userId },
        }),
        prisma.userSkill.findMany({
          where: { userId: req.params.userId },
          include: { skill: true },
          orderBy: { skill: { name: "asc" } },
        }),
      ]);

      if (!profile) throw new HttpError(404, "Perfil no encontrado");

      res.json({
        profile,
        skills, // [{ skill: { id, name }, level }]
      });
    } catch (e) {
      next(e);
    }
  }
);

// NUEVO: guardar metadatos de avatar en el perfil
const SaveAvatarBody = z.object({
  avatarUrl: z.string().url(),
  avatarProvider: z.string().min(2).max(40).optional().default("imagekit"),
  avatarKey: z.string().min(1),
  avatarType: z.string().min(3).max(100).optional(),
  avatarSize: z
    .number()
    .int()
    .min(1)
    .max(5 * 1024 * 1024)
    .optional(), // 5MB
  avatarWidth: z.number().int().min(1).max(10000).optional(),
  avatarHeight: z.number().int().min(1).max(10000).optional(),
});

router.patch(
  "/:userId/profile/avatar",
  validate(UserIdParams, "params"),
  validate(SaveAvatarBody),
  async (req, res, next) => {
    try {
      const updated = await prisma.memberProfile.update({
        where: { userId: req.params.userId },
        data: { ...req.body },
      });
      res.json(updated);
    } catch (e) {
      if (e?.code === "P2025")
        return next(new HttpError(404, "Perfil no encontrado"));
      next(e);
    }
  }
);
