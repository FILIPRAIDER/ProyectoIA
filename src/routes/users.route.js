import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

// ============ USUARIOS ============

const CreateUserSchema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  email: z.string().email(),
  role: z.enum(["EMPRESARIO", "ESTUDIANTE", "ADMIN"]).optional().default("ESTUDIANTE"),
});

router.post("/", validate(CreateUserSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.create({ data: req.body });
    res.status(201).json(user);
  } catch (e) {
    if (e?.code === "P2002") {
      return next(new HttpError(409, "El email ya está registrado"));
    }
    next(e);
  }
});

const IdParams = z.object({ id: z.string().min(1) });

router.get("/:id", validate(IdParams, "params"), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        skills: { include: { skill: true } },
        teamMemberships: { include: { team: true } },
      },
    });
    if (!user) throw new HttpError(404, "Usuario no encontrado");
    res.json(user);
  } catch (e) {
    next(e);
  }
});

// ============ SKILLS POR USUARIO ============

const UserIdParams = z.object({ userId: z.string().min(1) });

router.get("/:userId/skills", validate(UserIdParams, "params"), async (req, res, next) => {
  try {
    const exists = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { id: true },
    });
    if (!exists) throw new HttpError(404, "Usuario no encontrado");

    const userSkills = await prisma.userSkill.findMany({
      where: { userId: req.params.userId },
      include: { skill: true },
      // sin createdAt; ordenamos por nombre de la skill
      orderBy: { skill: { name: "asc" } },
    });
    res.json(userSkills);
  } catch (e) {
    next(e);
  }
});

const AddUserSkillBody = z.object({
  skillId: z.string().min(1),
  level: z.number().int().min(1).max(5),
});

router.post(
  "/:userId/skills",
  validate(UserIdParams, "params"),
  validate(AddUserSkillBody),
  async (req, res, next) => {
    try {
      const [user, skill] = await Promise.all([
        prisma.user.findUnique({ where: { id: req.params.userId }, select: { id: true } }),
        prisma.skill.findUnique({ where: { id: req.body.skillId }, select: { id: true } }),
      ]);
      if (!user) throw new HttpError(404, "Usuario no encontrado");
      if (!skill) throw new HttpError(404, "Skill no encontrada");

      const created = await prisma.userSkill.create({
        data: {
          userId: req.params.userId,
          skillId: req.body.skillId,
          level: req.body.level,
        },
        include: { skill: true },
      });
      res.status(201).json(created);
    } catch (e) {
      if (e?.code === "P2002") {
        return next(new HttpError(409, "El usuario ya tiene esta skill (única por userId+skillId)"));
      }
      next(e);
    }
  }
);

const UserSkillParams = z.object({
  userId: z.string().min(1),
  skillId: z.string().min(1),
});
const UpdateLevelBody = z.object({
  level: z.number().int().min(1).max(5),
});

router.patch(
  "/:userId/skills/:skillId",
  validate(UserSkillParams, "params"),
  validate(UpdateLevelBody),
  async (req, res, next) => {
    try {
      const updated = await prisma.userSkill.update({
        where: { userId_skillId: { userId: req.params.userId, skillId: req.params.skillId } },
        data: { level: req.body.level },
        include: { skill: true },
      });
      res.json(updated);
    } catch (e) {
      if (e?.code === "P2025") {
        return next(new HttpError(404, "Relación user-skill no encontrada"));
      }
      next(e);
    }
  }
);

router.delete("/:userId/skills/:skillId", validate(UserSkillParams, "params"), async (req, res, next) => {
  try {
    await prisma.userSkill.delete({
      where: { userId_skillId: { userId: req.params.userId, skillId: req.params.skillId } },
    });
    res.status(204).send();
  } catch (e) {
    if (e?.code === "P2025") {
      return next(new HttpError(404, "Relación user-skill no encontrada"));
    }
    next(e);
  }
});
