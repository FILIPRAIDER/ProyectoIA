// src/env.js
import * as dotenv from "dotenv";
dotenv.config();

function ensureSSL(url) {
  if (!url) return url;
  // Si ya trae parámetros, añadimos sslmode=require si falta
  if (url.includes("sslmode=")) return url;
  return url.includes("?")
    ? `${url}&sslmode=require`
    : `${url}?sslmode=require`;
}

export const DATABASE_URL = ensureSSL(process.env.DATABASE_URL);
export const PORT = process.env.PORT || "4001";

// ImageKit config
export const IK_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY || "";
export const IK_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || "";
export const IK_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT || "";
export const IK_UPLOAD_FOLDER = process.env.IMAGEKIT_UPLOAD_FOLDER || "/certifications";
