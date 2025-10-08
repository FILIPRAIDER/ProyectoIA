import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";

import multer from "multer";
import ImageKit from "imagekit";
import { getImageKitAuthParams } from "../lib/imagekit.js";

export const router = Router();

// Configurar multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Configurar ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// POST /uploads/users/:userId/avatar
// Subir o reemplazar avatar del usuario
// Si ya tiene avatar, elimina el anterior de ImageKit
router.post(
  "/users/:userId/avatar",
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const file = req.file;

      if (!file) throw new HttpError(400, "No se recibió ningún archivo");

      // Validar tipo de archivo
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new HttpError(400, "Tipo de archivo no permitido. Solo imágenes (JPG, PNG, GIF, WebP)");
      }

      // Verificar usuario existe y obtener avatar actual
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          avatarUrl: true,
          profile: {
            select: {
              avatarKey: true, // ImageKit fileId
            }
          }
        },
      });
      if (!user) throw new HttpError(404, "Usuario no encontrado");

      // Si el usuario ya tiene un avatar, eliminarlo de ImageKit
      if (user.profile?.avatarKey) {
        try {
          await imagekit.deleteFile(user.profile.avatarKey);
          console.log(`✅ Avatar anterior eliminado de ImageKit: ${user.profile.avatarKey}`);
        } catch (deleteError) {
          console.warn("⚠️ No se pudo eliminar el avatar anterior de ImageKit:", deleteError.message);
          // Continuar de todas formas - no bloqueamos la subida
        }
      }

      // Subir nueva imagen a ImageKit
      const uploadResponse = await imagekit.upload({
        file: file.buffer.toString("base64"),
        fileName: `avatar_${userId}_${Date.now()}.${file.originalname.split(".").pop()}`,
        folder: "/avatars",
        useUniqueFileName: true,
        tags: [`user:${userId}`, "avatar"],
      });

      // Actualizar en DB (tanto User como MemberProfile)
      await prisma.user.update({
        where: { id: userId },
        data: { 
          avatarUrl: uploadResponse.url,
          profile: {
            upsert: {
              create: {
                avatarUrl: uploadResponse.url,
                avatarProvider: "imagekit",
                avatarKey: uploadResponse.fileId,
                avatarType: file.mimetype,
                avatarSize: file.size,
                avatarWidth: uploadResponse.width || null,
                avatarHeight: uploadResponse.height || null,
              },
              update: {
                avatarUrl: uploadResponse.url,
                avatarProvider: "imagekit",
                avatarKey: uploadResponse.fileId,
                avatarType: file.mimetype,
                avatarSize: file.size,
                avatarWidth: uploadResponse.width || null,
                avatarHeight: uploadResponse.height || null,
              }
            }
          }
        },
      });

      console.log(`✅ Avatar actualizado para usuario ${userId}`);

      res.json({
        ok: true,
        success: true,
        url: uploadResponse.url,
        fileId: uploadResponse.fileId,
        message: user.avatarUrl 
          ? "Avatar reemplazado correctamente" 
          : "Avatar subido correctamente",
      });
    } catch (error) {
      console.error("❌ Error uploading avatar:", error);
      next(error);
    }
  }
);

const CertParams = z.object({ certId: z.string().min(1) });

router.post("/certifications/:certId/url", validate(CertParams, "params"), async (req, res, next) => {
  try {
    const cert = await prisma.certification.findUnique({
      where: { id: req.params.certId },
      select: { id: true, userId: true },
    });
    if (!cert) throw new HttpError(404, "Certificación no encontrada");

    const auth = getImageKitAuthParams();
    res.json({
      provider: "imagekit",
      ...auth,
      folder: auth.folder || "/certifications",
      // El frontend debe enviar: file (binary), fileName, folder, token, expire, signature, publicKey
    });
  } catch (e) {
    next(e);
  }
});

export default router;