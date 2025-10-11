// src/env.js
import * as dotenv from "dotenv";
dotenv.config();

/** Asegura sslmode=require en la cadena de conexión SOLO si no es localhost */
function ensureSSL(url) {
  if (!url) return url;
  
  // Si ya tiene sslmode configurado, no hacer nada
  if (url.includes("sslmode=")) return url;
  
  // Si es localhost o 127.0.0.1 (base de datos local), NO agregar SSL
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    return url;
  }
  
  // Para bases de datos remotas (Neon, Clever Cloud, etc.), agregar SSL
  return url.includes("?") ? `${url}&sslmode=require` : `${url}?sslmode=require`;
}

/** Helpers opcionales para saneo */
const toInt = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/* ====================== Base ====================== */
export const DATABASE_URL = ensureSSL(process.env.DATABASE_URL);
export const DIRECT_DATABASE_URL = ensureSSL(process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL);
export const PORT = process.env.PORT || "4001";

/* ==================== ImageKit ==================== */
export const IK_PUBLIC_KEY   = process.env.IMAGEKIT_PUBLIC_KEY   || "";
export const IK_PRIVATE_KEY  = process.env.IMAGEKIT_PRIVATE_KEY  || "";
export const IK_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT || "";
export const IK_UPLOAD_FOLDER = process.env.IMAGEKIT_UPLOAD_FOLDER || "/certifications";

/* ==================== Correo ====================== */
/** Proveedor: "mailtrap" | "resend" | "smtp" (por defecto mailtrap en dev) */
export const MAIL_PROVIDER = (process.env.MAIL_PROVIDER || "mailtrap").toLowerCase();

/* Mailtrap Sending API */
export const MAILTRAP_TOKEN  = process.env.MAILTRAP_TOKEN  || "";
export const MAILTRAP_SENDER = process.env.MAILTRAP_SENDER || ""; // "Nombre <no-reply@tu-dominio>"

/* Resend */
export const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
export const RESEND_FROM    = process.env.RESEND_FROM    || "";   // "Nombre <no-reply@tu-dominio>"

/* SMTP clásico (si algún día lo usamos) */
export const SMTP_HOST = process.env.SMTP_HOST || "";
export const SMTP_PORT = toInt(process.env.SMTP_PORT, 587);
export const SMTP_USER = process.env.SMTP_USER || "";
export const SMTP_PASS = process.env.SMTP_PASS || "";
export const MAIL_FROM = process.env.MAIL_FROM || ""; // "Nombre <no-reply@tu-dominio>"

/* ============ URLs Base (para links en emails) ============ */
export const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4001";
export const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";
