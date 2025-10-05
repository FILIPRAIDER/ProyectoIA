import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";
import { computeCandidates } from "../services/matching.service.js";

export const router = Router();

const ParamsSchema = z.object({
  projectId: z.string().min(1, "projectId requerido"),
});

const QuerySchema = z.object({
  top: z.coerce.number().int().min(1).max(50).optional(),          // por defecto 5
  explain: z.coerce.boolean().optional(),                          // modo explicación
  minCoverage: z.coerce.number().min(0).max(1).optional(),         // 0..1
  requireArea: z.coerce.boolean().optional(),                      // filtro duro por área
  requireCity: z.coerce.boolean().optional(),                      // filtro duro por ciudad
});

/**
 * POST /matching/projects/:projectId/candidates
 * Query:
 *  - top?: number (1..50, default 5)
 *  - explain?: boolean
 *  - minCoverage?: number (0..1)
 *  - requireArea?: boolean
 *  - requireCity?: boolean
 */
router.post(
  "/projects/:projectId/candidates",
  validate(ParamsSchema, "params"),
  validate(QuerySchema, "query"),
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const {
        top = 5,
        explain = false,
        minCoverage = 0,
        requireArea = false,
        requireCity = false,
      } = req.query;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          skills: { include: { skill: true } }, // ProjectSkill[] + Skill
        },
      });

      if (!project) throw new HttpError(404, "Proyecto no encontrado");
      if (project.status === "CANCELED") {
        throw new HttpError(400, "Proyecto cancelado");
      }

      const { candidates, filtersApplied } = await computeCandidates({
        prisma,
        project,
        top,
        explain,
        minCoverage,
        requireArea,
        requireCity,
      });

      const response = {
        project: {
          id: project.id,
          title: project.title,
          city: project.city,
          area: project.area,
          requiredSkills: (project.skills ?? []).map((ps) => ({
            skillId: ps.skillId,
            skillName: ps.skill?.name ?? "",
            levelRequired: ps.levelRequired ?? null,
          })),
        },
        top: Number(top),
        candidates,
      };

      if (explain) response.filtersApplied = filtersApplied;

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);
