import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

// ---------- POST /skills ----------
const CreateSkillSchema = z.object({
  name: z.string().min(2, "Nombre de la skill muy corto").trim(),
});

router.post("/", validate(CreateSkillSchema), async (req, res, next) => {
  try {
    const skill = await prisma.skill.create({
      data: { name: req.body.name },
    });
    res.status(201).json(skill);
  } catch (e) {
    if (e?.code === "P2002") {
      return next(new HttpError(409, "La skill ya existe (name único)"));
    }
    next(e);
  }
});

// ---------- GET /skills ----------
router.get("/", async (_req, res, next) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { name: "asc" },
    });
    res.json(skills);
  } catch (e) {
    next(e);
  }
});
