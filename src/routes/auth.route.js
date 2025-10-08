import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/login", validate(LoginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ✅ Buscar usuario con profile incluido
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: {
          include: {
            sector: true // Incluir sector dentro del profile
          }
        }
      }
    });

    if (!user || !user.passwordHash) {
      throw new HttpError(401, "Credenciales inválidas");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new HttpError(401, "Credenciales inválidas");
    }

    // ✅ Devuelve el usuario completo con profile (sin passwordHash)
    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (e) {
    next(e);
  }
});
