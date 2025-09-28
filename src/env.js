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
