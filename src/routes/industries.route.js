import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

/* =========================
   Schemas
========================= */
const DetectIndustryBody = z.object({
  text: z.string().min(1, "Text is required"),
  language: z.string().optional().default("es"),
});

/* =========================
   GET /industries
   Lista todas las industrias activas
========================= */
router.get("/", async (req, res, next) => {
  try {
    const industries = await prisma.industry.findMany({
      where: { active: true },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        name: true,
        nameEn: true,
        description: true,
        icon: true,
        displayOrder: true,
      },
    });

    res.json({
      industries,
      total: industries.length,
    });
  } catch (e) {
    next(e);
  }
});

/* =========================
   GET /industries/keywords
   Obtiene todas las keywords organizadas por industria
   (Para sincronización con AI-API)
========================= */
router.get("/keywords", async (req, res, next) => {
  try {
    const { language = "es" } = req.query;

    const industries = await prisma.industry.findMany({
      where: { active: true },
      include: {
        keywords: {
          where: { language: String(language) },
          orderBy: { priority: "desc" },
          select: {
            keyword: true,
            priority: true,
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    // Formato optimizado para AI-API
    const formatted = industries.map((industry) => ({
      name: industry.name,
      keywords: industry.keywords.map((k) => k.keyword),
    }));

    res.json({
      industries: formatted,
      total: industries.length,
      totalKeywords: industries.reduce((sum, i) => sum + i.keywords.length, 0),
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

/* =========================
   POST /industries/detect
   Detecta industria basándose en texto del usuario
========================= */
router.post("/detect", validate(DetectIndustryBody), async (req, res, next) => {
  try {
    const { text, language } = req.body;

    const textLower = text.toLowerCase();

    // Buscar keywords que coincidan con el texto (búsqueda por palabras completas y frases)
    const matchedKeywords = await prisma.industryKeyword.findMany({
      where: {
        language,
      },
      include: {
        industry: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            icon: true,
          },
        },
      },
      orderBy: {
        priority: "desc",
      },
    });

    // Filtrar keywords que aparecen en el texto
    const matches = matchedKeywords.filter((kw) => {
      const keyword = kw.keyword.toLowerCase();
      // Buscar keyword como palabra completa o frase
      const regex = new RegExp(`\\b${keyword}\\b`, "i");
      return regex.test(textLower);
    });

    if (matches.length === 0) {
      return res.json({
        industry: null,
        confidence: "none",
        message: "No se detectó industria",
      });
    }

    // Obtener la keyword con mayor prioridad
    const bestMatch = matches[0];

    // Determinar nivel de confianza
    let confidence = "low";
    if (bestMatch.priority >= 3) confidence = "high";
    else if (bestMatch.priority === 2) confidence = "medium";

    res.json({
      industry: bestMatch.industry.name,
      industryEn: bestMatch.industry.nameEn,
      confidence,
      keyword: bestMatch.keyword,
      icon: bestMatch.industry.icon,
      industryId: bestMatch.industry.id,
    });
  } catch (e) {
    next(e);
  }
});

/* =========================
   POST /industries/keywords (Admin)
   Agregar nueva keyword a una industria
========================= */
const CreateKeywordBody = z.object({
  industryId: z.string().min(1),
  keyword: z.string().min(1),
  priority: z.number().int().min(1).max(3).optional().default(1),
  language: z.string().optional().default("es"),
});

router.post(
  "/keywords",
  validate(CreateKeywordBody),
  async (req, res, next) => {
    try {
      const { industryId, keyword, priority, language } = req.body;

      const newKeyword = await prisma.industryKeyword.create({
        data: {
          industryId,
          keyword: keyword.toLowerCase(),
          priority,
          language,
        },
      });

      res.status(201).json({
        keyword: newKeyword,
        message: "Keyword creada exitosamente",
      });
    } catch (e) {
      if (e?.code === "P2002") {
        return next(
          new HttpError(409, "Keyword ya existe para esta industria")
        );
      }
      next(e);
    }
  }
);

/* =========================
   GET /industries/:id
   Obtener una industria específica con sus keywords
========================= */
const IndustryIdParams = z.object({
  id: z.string().min(1),
});

router.get(
  "/:id",
  validate(IndustryIdParams, "params"),
  async (req, res, next) => {
    try {
      const industry = await prisma.industry.findUnique({
        where: { id: req.params.id },
        include: {
          keywords: {
            orderBy: [{ priority: "desc" }, { keyword: "asc" }],
          },
        },
      });

      if (!industry) {
        throw new HttpError(404, "Industria no encontrada");
      }

      res.json(industry);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
