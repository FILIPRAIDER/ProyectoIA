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

// POST /uploads/companies/:companyId/logo
// Subir o reemplazar logo de la empresa
// Solo el empresario dueño de la empresa puede subir el logo
router.post(
  "/companies/:companyId/logo",
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { companyId } = req.params;
      const file = req.file;

      if (!file) throw new HttpError(400, "No file uploaded");

      // Validar tipo de archivo
      const allowedTypes = [
        "image/jpeg",
        "image/jpg", 
        "image/png", 
        "image/gif",
        "image/svg+xml",
        "image/webp"
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new HttpError(
          400, 
          "Invalid file format. Allowed: PNG, JPG, GIF, SVG, WebP"
        );
      }

      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new HttpError(400, "File size exceeds 5MB limit");
      }

      // Verificar que la empresa existe
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { 
          id: true, 
          name: true,
          logoUrl: true,
          users: { 
            select: { id: true } 
          }
        },
      });

      if (!company) {
        throw new HttpError(404, "Company not found");
      }

      // TODO: Descomentar cuando tengas autenticación implementada
      // Verificar permisos - solo el empresario dueño puede subir
      // if (!req.user || !company.users.some(u => u.id === req.user.id)) {
      //   throw new HttpError(
      //     403, 
      //     "You don't have permission to upload logo for this company"
      //   );
      // }

      // Subir imagen a ImageKit
      const uploadResponse = await imagekit.upload({
        file: file.buffer.toString("base64"),
        fileName: `logo_${companyId}_${Date.now()}.${file.originalname.split(".").pop()}`,
        folder: "/companies/logos",
        useUniqueFileName: true,
        tags: [`company:${companyId}`, "logo"],
      });

      // Actualizar URL del logo en la BD
      await prisma.company.update({
        where: { id: companyId },
        data: { 
          logoUrl: uploadResponse.url,
          updatedAt: new Date()
        },
      });

      console.log(`✅ Logo actualizado para empresa ${company.name} (${companyId})`);

      res.json({
        message: "Company logo uploaded successfully",
        url: uploadResponse.url,
        companyId: companyId,
      });
    } catch (error) {
      console.error("❌ Error uploading company logo:", error);
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