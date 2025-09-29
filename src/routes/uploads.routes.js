import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { HttpError } from "../utils/http-errors.js";
import { getImageKitAuthParams } from "../lib/imagekit.js";

export const router = Router();

// POST /uploads/certifications/:certId/url
// Responde con token/expire/signature/publicKey/urlEndpoint/folder/uploadApiEndpoint
const CertParams = z.object({ certId: z.string().min(1) });

router.post("/certifications/:certId/url", validate(CertParams, "params"), async (req, res, next) => {
  try {
    // Validar que la certificación exista y pertenece a un user
    const cert = await prisma.certification.findUnique({
      where: { id: req.params.certId },
      select: { id: true, userId: true },
    });
    if (!cert) throw new HttpError(404, "Certificación no encontrada");

    const auth = getImageKitAuthParams();
    res.json({
      provider: "imagekit",
      ...auth,
      // client guidance (el frontend debe enviar estos campos en multipart):
      // file: (binary), fileName: "cert.jpg"|"cert.pdf", folder: auth.folder, token, expire, signature, publicKey
    });
  } catch (e) {
    next(e);
  }
});

export default router;
