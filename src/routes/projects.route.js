import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

/* ===== Create Project ===== */
const CreateProjectBody = z.object({
  companyId: z.string().min(1),
  title: z.string().min(2).max(160).trim(),
  description: z.string().max(4000).optional(),
  city: z.string().min(2).max(160).optional(),
  area: z.string().min(2).max(160).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELED"]).optional().default("OPEN"),
  budget: z.number().optional(),
  startDate: z.string().datetime().optional(), // ISO
  endDate: z.string().datetime().optional(),
});

router.post("/", validate(CreateProjectBody), async (req, res, next) => {
  try {
    const { companyId, title } = req.body;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true }
    });
    if (!company) throw new HttpError(404, "Empresa no encontrada");

    // 🚧 Chequeo previo (case-insensitive) para evitar duplicados amables
    const dup = await prisma.project.findFirst({
      where: {
        companyId,
        title: { equals: title, mode: "insensitive" },
      },
      select: { id: true }
    });
    if (dup) {
      throw new HttpError(409, "Ya existe un proyecto con ese título para esta empresa");
    }

    const created = await prisma.project.create({
      data: {
        companyId,
        title,
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
    // Si algo se coló en carrera, capturamos P2002 del índice único (ver migración)
    if (e?.code === "P2002") return next(new HttpError(409, "Ya existe un proyecto con ese título para esta empresa"));
    next(e);
  }
});


/* ===== Get Project by id ===== */
const ProjectIdParams = z.object({ id: z.string().min(1) });

router.get("/:id", validate(ProjectIdParams, "params"), async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        company: { select: { id: true, name: true } },
        skills: { include: { skill: true }, orderBy: { skill: { name: "asc" } } },
        assignments: { include: { team: { select: { id: true, name: true, city: true, area: true } } } },
      },
    });
    if (!project) throw new HttpError(404, "Proyecto no encontrado");
    res.json(project);
  } catch (e) {
    next(e);
  }
});

/* ===== List Projects with filters ===== */
const ListProjectsQuery = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELED"]).optional(),
  city: z.string().trim().optional(),
  area: z.string().trim().optional(),
  skill: z.string().trim().optional(), // por nombre de skill
});

router.get("/", validate(ListProjectsQuery, "query"), async (req, res, next) => {
  try {
    const { status, city, area, skill } = (req.validated?.query ?? req.query);
    const where = {};

    if (status) where.status = status;
    if (city) where.city = { equals: city, mode: "insensitive" };
    if (area) where.area = { contains: area, mode: "insensitive" };
    if (skill) {
      where.skills = {
        some: { skill: { name: { contains: skill, mode: "insensitive" } } },
      };
    }

    const rows = await prisma.project.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        status: true,
        city: true,
        area: true,
        company: { select: { id: true, name: true } },
        _count: { select: { assignments: true } },
      },
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/* ===== Project Skills ===== */
const ProjectIdOnlyParams = z.object({ projectId: z.string().min(1) });

router.get("/:projectId/skills", validate(ProjectIdOnlyParams, "params"), async (req, res, next) => {
  try {
    const exists = await prisma.project.findUnique({ where: { id: req.params.projectId }, select: { id: true } });
    if (!exists) throw new HttpError(404, "Proyecto no encontrado");

    const rows = await prisma.projectSkill.findMany({
      where: { projectId: req.params.projectId },
      include: { skill: true },
      orderBy: { skill: { name: "asc" } },
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

const AddProjectSkillBody = z.object({
  skillId: z.string().min(1),
  levelRequired: z.number().int().min(1).max(5).optional(),
});

router.post("/:projectId/skills",
  validate(ProjectIdOnlyParams, "params"),
  validate(AddProjectSkillBody),
  async (req, res, next) => {
    try {
      const [project, skill] = await Promise.all([
        prisma.project.findUnique({ where: { id: req.params.projectId }, select: { id: true } }),
        prisma.skill.findUnique({ where: { id: req.body.skillId }, select: { id: true } }),
      ]);
      if (!project) throw new HttpError(404, "Proyecto no encontrado");
      if (!skill) throw new HttpError(404, "Skill no encontrada");

      const rel = await prisma.projectSkill.create({
        data: {
          projectId: req.params.projectId,
          skillId: req.body.skillId,
          levelRequired: req.body.levelRequired ?? null,
        },
        include: { skill: true },
      });
      res.status(201).json(rel);
    } catch (e) {
      if (e?.code === "P2002") return next(new HttpError(409, "La skill ya está asignada a este proyecto"));
      next(e);
    }
  }
);

const ProjectSkillParams = z.object({
  projectId: z.string().min(1),
  skillId: z.string().min(1),
});

router.delete("/:projectId/skills/:skillId", validate(ProjectSkillParams, "params"), async (req, res, next) => {
  try {
    await prisma.projectSkill.delete({
      where: { projectId_skillId: { projectId: req.params.projectId, skillId: req.params.skillId } },
    });
    res.status(204).send();
  } catch (e) {
    if (e?.code === "P2025") return next(new HttpError(404, "Esa skill no está asignada al proyecto"));
    next(e);
  }
});

/* ===== Assignments (match exitoso) ===== */
const CreateAssignmentBody = z.object({
  teamId: z.string().min(1),
});

router.post("/:projectId/assignments",
  validate(ProjectIdOnlyParams, "params"),
  validate(CreateAssignmentBody),
  async (req, res, next) => {
    try {
      const [project, team] = await Promise.all([
        prisma.project.findUnique({ where: { id: req.params.projectId }, select: { id: true, status: true } }),
        prisma.team.findUnique({ where: { id: req.body.teamId }, select: { id: true } }),
      ]);
      if (!project) throw new HttpError(404, "Proyecto no encontrado");
      if (!team) throw new HttpError(404, "Equipo no encontrado");

      const created = await prisma.teamAssignment.create({
        data: { projectId: req.params.projectId, teamId: req.body.teamId },
        include: { team: { select: { id: true, name: true, city: true, area: true } } },
      });
      res.status(201).json(created);
    } catch (e) {
      if (e?.code === "P2002") return next(new HttpError(409, "Ese equipo ya está asignado a este proyecto"));
      next(e);
    }
  }
);

router.get("/:projectId/assignments", validate(ProjectIdOnlyParams, "params"), async (req, res, next) => {
  try {
    const rows = await prisma.teamAssignment.findMany({
      where: { projectId: req.params.projectId },
      include: { team: { select: { id: true, name: true, city: true, area: true } } },
      orderBy: { assignedAt: "desc" },
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/* Historial por equipo */
const TeamIdParams = z.object({ teamId: z.string().min(1) });

router.get("/by-team/:teamId/assignments", validate(TeamIdParams, "params"), async (req, res, next) => {
  try {
    const rows = await prisma.teamAssignment.findMany({
      where: { teamId: req.params.teamId },
      include: { project: { select: { id: true, title: true, status: true } } },
      orderBy: { assignedAt: "desc" },
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});
