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

      const { candidates } = await computeCandidates({
        prisma,
        project,
        top,
        explain,
        minCoverage,
        requireArea,
        requireCity,
      });

      // Adaptar los campos al formato solicitado
      const teams = candidates.map(team => ({
        teamId: team.teamId,
        name: team.teamName,
        avatarUrl: team.avatarUrl || `https://cdn.bridge.com/avatars/${team.teamId}.png`,
        skills: team.teamSkillNames || [],
        members: team.membersCount,
        rating: team.rating || null, // Si tienes rating real, ponlo aquí
        location: team.city || "",
        availability: team.avgAvailability !== undefined ? (team.avgAvailability === 0 ? "No disponible" : "Inmediata") : "",
        matchScore: team.score || 0,
        skillCoverage: team.breakdown?.skillCoverage || 0  // Porcentaje real de skills coincidentes
      }));

      res.json({
        type: "team_matches",
        teams
      });
    } catch (err) {
      next(err);
    }
  }
);
