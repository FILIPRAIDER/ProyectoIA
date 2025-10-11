import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

// ============ BÚSQUEDA DE USUARIOS ============

/**
 * GET /users/search
 * Busca usuarios por email (autocomplete)
 * Query params: email (required), role (optional), limit (optional, default: 10)
 */
router.get("/search", async (req, res, next) => {
  try {
    const { email, role, limit = "10" } = req.query;
    
    // Validación
    if (!email || typeof email !== "string" || email.trim() === "") {
      throw new HttpError(400, "El parámetro 'email' es obligatorio");
    }
    
    // Construir filtros
    const where = {
      email: {
        contains: email.trim(),
        mode: "insensitive", // Case-insensitive
      },
    };
    
    // Filtrar por rol si se proporciona
    if (role && typeof role === "string") {
      where.role = role.toUpperCase();
    }
    
    // Buscar usuarios
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      take: parseInt(limit, 10),
      orderBy: {
        email: "asc",
      },
    });
    
    res.status(200).json(users);
  } catch (e) {
    next(e);
  }
});

// ============ USUARIOS ============

const StrongPassword = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña no puede superar 72 caracteres")
  .regex(/[A-Z]/, "Debe incluir al menos una letra mayúscula")
  .regex(/[0-9]/, "Debe incluir al menos un número")
  .regex(/[!@#$%^&*()_\-+={}\[\]|\\:;"'<>,.?/]/, "Debe incluir al menos un carácter especial");

const CreateUserSchema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  email: z.string().email(),
  role: z.enum(["EMPRESARIO", "ESTUDIANTE", "ADMIN", "LIDER"]).optional().default("ESTUDIANTE"),
  password: StrongPassword,
});
router.post("/", validate(CreateUserSchema), async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, role, passwordHash, onboardingStep: "ACCOUNT" },
    });

    const { passwordHash: _, ...safe } = user;
    res.status(201).json(safe);
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
        profile: {
          include: {
            sector: true // ✅ Incluir sector completo dentro del profile
          }
        },
        experiences: {
          orderBy: { startDate: 'desc' }
        },
        certifications: {
          orderBy: { issueDate: 'desc' }
        },
        skills: { 
          include: { skill: true },
          orderBy: { level: 'desc' }
        },
        teamMemberships: { include: { team: true } },
        company: true, // ✅ Incluir empresa si es empresario
      },
    });
    if (!user) throw new HttpError(404, "Usuario no encontrado");
    
    // Remover campos sensibles antes de enviar
    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
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

      // 🔄 AUTO-PROPAGAR: Agregar esta skill a todos los equipos del usuario
      const userTeams = await prisma.teamMember.findMany({
        where: { userId: req.params.userId },
        select: { teamId: true }
      });

      let teamsUpdated = 0;
      for (const { teamId } of userTeams) {
        try {
          await prisma.teamSkill.upsert({
            where: {
              teamId_skillId: {
                teamId,
                skillId: req.body.skillId
              }
            },
            create: {
              teamId,
              skillId: req.body.skillId
            },
            update: {} // No actualizar si ya existe
          });
          teamsUpdated++;
        } catch (e) {
          // Si ya existe o hay error, continuar
          console.warn(`Could not add skill to team ${teamId}:`, e.message);
        }
      }

      console.log(`✅ Skill agregada al usuario y propagada a ${teamsUpdated} equipo(s)`);

      res.status(201).json({
        ...created,
        teamsUpdated, // Información adicional para debugging
      });
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

const UserSkillIdParams = z.object({
  userId: z.string().min(1),
  id: z.string().min(1), // ID de la relación UserSkill
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

// DELETE usando el ID de la relación UserSkill (no el skillId)
router.delete("/:userId/skills/:id", validate(UserSkillIdParams, "params"), async (req, res, next) => {
  try {
    const { userId, id } = req.params;
    
    console.log(`🗑️ DELETE UserSkill - userId: ${userId}, userSkillId: ${id}`);
    
    // 1. ✅ Buscar el UserSkill por su ID
    const userSkill = await prisma.userSkill.findUnique({
      where: { id }
    });

    // 2. Verificar que existe y pertenece al usuario
    if (!userSkill) {
      console.warn(`⚠️ UserSkill no encontrado: ${id}`);
      return next(new HttpError(404, "Skill no encontrado"));
    }

    if (userSkill.userId !== userId) {
      console.warn(`⚠️ UserSkill no pertenece al usuario - userSkillId: ${id}, esperado userId: ${userId}, actual userId: ${userSkill.userId}`);
      return next(new HttpError(404, "Skill no pertenece al usuario"));
    }
    
    // 3. Eliminar el UserSkill
    const skillId = userSkill.skillId; // Guardar para usar en auto-limpieza
    await prisma.userSkill.delete({
      where: { id }
    });

    // 4. 🔄 AUTO-LIMPIAR: Limpiar skill de equipos si ningún otro miembro la tiene
    const userTeams = await prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true }
    });

    let teamsUpdated = 0;
    for (const { teamId } of userTeams) {
      // Contar cuántos otros miembros del equipo tienen esta skill
      const otherMembersWithSkill = await prisma.teamMember.count({
        where: {
          teamId,
          userId: { not: userId },
          user: {
            skills: {
              some: { skillId }
            }
          }
        }
      });

      // Si ningún otro miembro tiene la skill, eliminarla del equipo
      if (otherMembersWithSkill === 0) {
        try {
          await prisma.teamSkill.deleteMany({
            where: { teamId, skillId }
          });
          teamsUpdated++;
        } catch (e) {
          console.warn(`Could not remove skill from team ${teamId}:`, e.message);
        }
      }
    }

    console.log(`✅ UserSkill eliminado: ${id}, skill: ${skillId}, equipos actualizados: ${teamsUpdated}`);
    
    res.status(204).send();
  } catch (e) {
    console.error("Error deleting user skill:", e);
    next(e);
  }
});

// ============ ONBOARDING (flujo por fases) ============

const OnboardingBody = z.object({
  step: z.enum(["ACCOUNT", "PROFILE", "OPTIONAL", "DONE"]),
});

router.patch("/:id/onboarding", validate(IdParams, "params"), validate(OnboardingBody), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { onboardingStep: true } });
    if (!user) throw new HttpError(404, "Usuario no encontrado");

    // Reglas simples de avance: solo avanzar hacia adelante
    const order = ["ACCOUNT", "PROFILE", "OPTIONAL", "DONE"];
    const currentIdx = order.indexOf(user.onboardingStep);
    const nextIdx = order.indexOf(req.body.step);
    if (nextIdx < currentIdx) {
      throw new HttpError(400, `No puedes retroceder el onboarding (${user.onboardingStep} → ${req.body.step})`);
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { onboardingStep: req.body.step },
      select: { id: true, onboardingStep: true },
    });

    res.json(updated);
  } catch (e) {
    next(e);
  }
});
