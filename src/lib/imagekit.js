// src/lib/imagekit.js
import crypto from "crypto";
import { IK_PUBLIC_KEY, IK_PRIVATE_KEY, IK_URL_ENDPOINT, IK_UPLOAD_FOLDER } from "../env.js";

export function getImageKitAuthParams() {
  if (!IK_PUBLIC_KEY || !IK_PRIVATE_KEY || !IK_URL_ENDPOINT) {
    throw new Error("ImageKit no está configurado (faltan llaves o endpoint).");
  }
  const token = crypto.randomBytes(16).toString("hex");
  const expire = Math.floor(Date.now() / 1000) + 60 * 5; // 5 minutos
  const signature = crypto
    .createHmac("sha1", IK_PRIVATE_KEY)
    .update(token + expire)
    .digest("hex");

  return {
    token,
    expire,
    signature,
    publicKey: IK_PUBLIC_KEY,
    urlEndpoint: IK_URL_ENDPOINT,
    folder: IK_UPLOAD_FOLDER || "/certifications",
    // El endpoint de subida (para el cliente/frontend)
    uploadApiEndpoint: "https://upload.imagekit.io/api/v1/files/upload",
  };
}
