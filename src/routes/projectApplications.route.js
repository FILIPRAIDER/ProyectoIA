import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

/* ========================= Schemas ========================= */
const ProjectIdParams = z.object({ projectId: z.string().min(1) });
const TeamIdParams = z.object({ teamId: z.string().min(1) });

const CreateApplicationBody = z.object({
  teamId: z.string().min(1),
  message: z.string().trim().max(500).optional(),
  byUserId: z.string().min(1).optional(), // auditoría opcional
});

// NUEVO: límite opcional de PENDING por proyecto (en query)
const CreateApplicationQuery = z.object({
  maxPending: z.coerce.number().int().min(1).max(100).optional(),
});

const ListByProjectQuery = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"]).optional(),
});

const ListByTeamQuery = ListByProjectQuery;

const RespondBody = z.object({
  decision: z.enum(["ACCEPT", "REJECT", "WITHDRAW"]),
  byUserId: z.string().min(1).optional(), // quién decide (opcional)
});

const RespondParams = z.object({
  projectId: z.string().min(1),
  appId: z.string().min(1),
});

// NUEVO: cancelar (empresa) => WITHDRAWN si está PENDING
const CancelParams = RespondParams;
const CancelBody = z.object({
  byUserId: z.string().min(1).optional(),
});

/* ================== Helpers de validación ================== */
async function assertProjectActive(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, status: true, title: true, city: true, area: true },
  });
  if (!project) throw new HttpError(404, "Proyecto no encontrado");
  if (project.status === "CANCELED") throw new HttpError(400, "Proyecto cancelado");
  return project;
}

async function assertTeamExists(teamId) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true, city: true, area: true },
  });
  if (!team) throw new HttpError(404, "Equipo no encontrado");
  return team;
}

/* ============================================================
   POST /projects/:projectId/applications?maxPending=3
   Crea invitación (PENDING) de empresa → equipo
   - Evita duplicar PENDING del mismo par
   - (Opcional) limita el total de PENDING del proyecto
============================================================ */
router.post(
  "/:projectId/applications",
  validate(ProjectIdParams, "params"),
  validate(CreateApplicationQuery, "query"),
  validate(CreateApplicationBody),
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { teamId, message, byUserId } = req.body;
      const { maxPending } = req.query; // opcional

      await assertProjectActive(projectId);
      await assertTeamExists(teamId);

      // No permitir invitar si ya hay asignación efectiva
      const existingAssignment = await prisma.teamAssignment.findUnique({
        where: { projectId_teamId: { projectId, teamId } },
        select: { id: true },
      });
      if (existingAssignment) {
        throw new HttpError(409, "Ya existe una asignación efectiva para este equipo en el proyecto");
      }

      // Límite opcional de PENDING por proyecto
      if (typeof maxPending === "number") {
        const pendingCount = await prisma.teamApplication.count({
          where: { projectId, status: "PENDING" },
        });
        if (pendingCount >= maxPending) {
          throw new HttpError(
            422,
            `Se alcanzó el máximo de invitaciones PENDING para este proyecto (maxPending=${maxPending})`
          );
        }
      }

      // Evitar duplicar PENDING para el mismo par
      const existingPending = await prisma.teamApplication.findFirst({
        where: { projectId, teamId, status: "PENDING" },
        select: { id: true },
      });
      if (existingPending) {
        throw new HttpError(409, "Ya hay una invitación PENDING para este equipo en este proyecto");
      }

      const app = await prisma.teamApplication.create({
        data: {
          projectId,
          teamId,
          status: "PENDING",
          message: message ?? null,
          decidedBy: byUserId ?? null, // quién originó (si usas este campo así)
        },
      });

      // TODO: emitir evento "ApplicationCreated" (notificación equipo)
      res.status(201).json(app);
    } catch (e) {
      next(e);
    }
  }
);

/* ============================================================
   POST /projects/:projectId/applications/:appId/response
   Equipo responde: ACCEPT | REJECT | WITHDRAW
   - ACCEPT => crea TeamAssignment y marca la aplicación como ACCEPTED
============================================================ */
router.post(
  "/:projectId/applications/:appId/response",
  validate(RespondParams, "params"),
  validate(RespondBody),
  async (req, res, next) => {
    try {
      const { projectId, appId } = req.params;
      const { decision, byUserId } = req.body;

      await assertProjectActive(projectId);

      const app = await prisma.teamApplication.findUnique({
        where: { id: appId },
        include: { project: true, team: true },
      });
      if (!app || app.projectId !== projectId) {
        throw new HttpError(404, "Aplicación no encontrada");
      }
      if (app.status !== "PENDING") {
        throw new HttpError(422, "La aplicación no está en estado PENDING");
      }

      if (decision === "ACCEPT") {
        let assignment;
        try {
          assignment = await prisma.teamAssignment.create({
            data: { projectId: app.projectId, teamId: app.teamId },
          });
        } catch (e) {
          if (e?.code === "P2002") {
            assignment = await prisma.teamAssignment.findUnique({
              where: { projectId_teamId: { projectId: app.projectId, teamId: app.teamId } },
            });
          } else {
            throw e;
          }
        }

        const updated = await prisma.teamApplication.update({
          where: { id: appId },
          data: {
            status: "ACCEPTED",
            decidedAt: new Date(),
            decidedBy: byUserId ?? null,
          },
        });

        // TODO: eventos "ApplicationDecided(ACCEPTED)" y "AssignmentCreated" (notificar empresa/equipo)
        return res.json({ application: updated, assignment });
      }

      // REJECT o WITHDRAW
      const newStatus = decision === "REJECT" ? "REJECTED" : "WITHDRAWN";
      const updated = await prisma.teamApplication.update({
        where: { id: appId },
        data: {
          status: newStatus,
          decidedAt: new Date(),
          decidedBy: byUserId ?? null,
        },
      });

      // TODO: evento "ApplicationDecided(REJECTED/WITHDRAWN)"
      return res.json({ application: updated });
    } catch (e) {
      next(e);
    }
  }
);

/* ============================================================
   POST /projects/:projectId/applications/:appId/cancel
   (NUEVO) Cancelación iniciada por la empresa => WITHDRAWN si PENDING
============================================================ */
router.post(
  "/:projectId/applications/:appId/cancel",
  validate(CancelParams, "params"),
  validate(CancelBody),
  async (req, res, next) => {
    try {
      const { projectId, appId } = req.params;
      const { byUserId } = req.body;

      await assertProjectActive(projectId);

      const app = await prisma.teamApplication.findUnique({
        where: { id: appId },
        select: { id: true, projectId: true, status: true },
      });
      if (!app || app.projectId !== projectId) {
        throw new HttpError(404, "Aplicación no encontrada");
      }
      if (app.status !== "PENDING") {
        throw new HttpError(422, "Solo se pueden cancelar aplicaciones en estado PENDING");
      }

      const updated = await prisma.teamApplication.update({
        where: { id: appId },
        data: {
          status: "WITHDRAWN",
          decidedAt: new Date(),
          decidedBy: byUserId ?? null,
        },
      });

      // TODO: evento "ApplicationDecided(WITHDRAWN)" (notificar equipo)
      return res.json({ application: updated });
    } catch (e) {
      next(e);
    }
  }
);

/* ============================================================
   GET /projects/:projectId/applications?status=...
============================================================ */
router.get(
  "/:projectId/applications",
  validate(ProjectIdParams, "params"),
  validate(ListByProjectQuery, "query"),
  async (req, res, next) => {
    try {
      const { projectId } = req.params;
      const { status } = req.query;

      await assertProjectActive(projectId);

      const apps = await prisma.teamApplication.findMany({
        where: { projectId, ...(status ? { status } : {}) },
        orderBy: [{ createdAt: "desc" }],
        include: { team: { select: { id: true, name: true, city: true, area: true} } },
      });

      res.json(apps);
    } catch (e) {
      next(e);
    }
  }
);

/* ============================================================
   GET /projects/by-team/:teamId/applications?status=...
============================================================ */
router.get(
  "/by-team/:teamId/applications",
  validate(TeamIdParams, "params"),
  validate(ListByTeamQuery, "query"),
  async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const { status } = req.query;

      await assertTeamExists(teamId);

      const apps = await prisma.teamApplication.findMany({
        where: { teamId, ...(status ? { status } : {}) },
        orderBy: [{ createdAt: "desc" }],
        include: {
          project: { select: { id: true, title: true, city: true, area: true, status: true } },
        },
      });

      res.json(apps);
    } catch (e) {
      next(e);
    }
  }
);
