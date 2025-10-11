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

console.log("✅ ImageKit configurado correctamente");

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
      console.log(`📝 [Avatar Upload] Guardando en DB para usuario: ${userId}`);
      console.log(`📝 [Avatar Upload] URL a guardar: ${uploadResponse.url}`);
      
      const updatedUser = await prisma.user.update({
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
        include: {
          profile: {
            select: {
              avatarUrl: true,
              avatarKey: true,
            }
          }
        }
      });

      console.log(`✅ Avatar actualizado para usuario ${userId}`);
      console.log(`✅ User.avatarUrl: ${updatedUser.avatarUrl}`);
      console.log(`✅ Profile.avatarUrl: ${updatedUser.profile?.avatarUrl || 'NULL'}`);
      console.log(`✅ Profile.avatarKey: ${updatedUser.profile?.avatarKey || 'NULL'}`);

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

// POST /uploads/teams/:teamId/profile-image
// Subir o reemplazar foto de perfil del equipo
// Solo el líder del equipo puede subir la foto
router.post(
  "/teams/:teamId/profile-image",
  upload.single("image"), // Frontend envía el campo como 'image'
  async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const file = req.file;

      console.log(`📸 [Team Profile Image] Received upload request for team: ${teamId}`);

      // 1. Validar que se haya enviado un archivo
      if (!file) {
        console.log("❌ No file received");
        throw new HttpError(400, "No se ha proporcionado ninguna imagen");
      }

      console.log(`📦 File info: ${file.originalname}, ${file.mimetype}, ${file.size} bytes`);

      // 2. Validar tipo de archivo
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new HttpError(400, "Solo se permiten imágenes JPG, PNG o WebP");
      }

      // 3. Validar tamaño (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new HttpError(400, "La imagen no debe superar 5MB");
      }

      // 4. Verificar que el equipo existe
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: {
          id: true,
          name: true,
          profileImage: true,
          avatarKey: true,
          members: {
            select: {
              userId: true,
              role: true,
            },
          },
        },
      });

      if (!team) {
        console.log(`❌ Team not found: ${teamId}`);
        throw new HttpError(404, "Equipo no encontrado");
      }

      console.log(`✅ Team found: ${team.name}`);

      // 5. Verificar permisos - usuario debe ser LIDER del equipo
      // TODO: Descomentar cuando tengas autenticación implementada
      // if (!req.user) {
      //   throw new HttpError(401, "No autenticado");
      // }
      //
      // const member = team.members.find(
      //   (m) => m.userId === req.user.id && m.role === "LIDER"
      // );
      //
      // if (!member) {
      //   console.log(`❌ User ${req.user.id} is not a LIDER of team ${teamId}`);
      //   throw new HttpError(
      //     403,
      //     "Solo los líderes pueden cambiar la foto del equipo"
      //   );
      // }
      //
      // console.log(`✅ User ${req.user.id} is LIDER - permission granted`);

      // 6. Si el equipo ya tiene una imagen, eliminar la anterior de ImageKit
      if (team.avatarKey) {
        try {
          await imagekit.deleteFile(team.avatarKey);
          console.log(`✅ Previous team image deleted from ImageKit: ${team.avatarKey}`);
        } catch (deleteError) {
          console.warn("⚠️ Could not delete previous image from ImageKit:", deleteError.message);
          // Continuar de todas formas
        }
      }

      // 7. Subir nueva imagen a ImageKit
      console.log(`📤 Uploading to ImageKit...`);
      const uploadResponse = await imagekit.upload({
        file: file.buffer.toString("base64"),
        fileName: `team_${teamId}_${Date.now()}.${file.originalname.split(".").pop()}`,
        folder: "/teams/profile-images",
        useUniqueFileName: true,
        tags: [`team:${teamId}`, "profile-image"],
      });

      console.log(`✅ Upload successful - URL: ${uploadResponse.url}`);

      // 8. Actualizar base de datos con la nueva imagen
      const updatedTeam = await prisma.team.update({
        where: { id: teamId },
        data: {
          profileImage: uploadResponse.url,
          avatarProvider: "imagekit",
          avatarKey: uploadResponse.fileId,
          avatarType: file.mimetype,
          avatarSize: file.size,
          avatarWidth: uploadResponse.width || null,
          avatarHeight: uploadResponse.height || null,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Team profile image updated in database for team: ${team.name}`);

      // 9. Responder con éxito
      res.status(200).json({
        success: true,
        message: "Foto de perfil actualizada correctamente",
        profileImage: uploadResponse.url,
        team: {
          id: updatedTeam.id,
          name: updatedTeam.name,
          profileImage: updatedTeam.profileImage,
        },
      });
    } catch (error) {
      console.error("❌ Error uploading team profile image:", error);
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