import { Router } from "express";
import { HttpError } from "../utils/http-errors.js";

export const router = Router();

// Cache simple en memoria (24h)
let cachedCountries = null;
let cachedAt = 0;
const ONE_DAY = 24 * 60 * 60 * 1000;

function flagEmojiFromCC(cc2) {
  // ISO alpha-2 → bandera emoji
  return cc2
    .toUpperCase()
    .replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt()));
}

router.get("/countries", async (_req, res, next) => {
  try {
    const now = Date.now();
    if (cachedCountries && (now - cachedAt) < ONE_DAY) {
      return res.json(cachedCountries);
    }

    // Rest Countries v3.1 (gratis)
    // Node 18+ trae fetch nativo
    const url = "https://restcountries.com/v3.1/all?fields=cca2,name,idd";
    const r = await fetch(url);
    if (!r.ok) throw new HttpError(502, "No se pudieron cargar países");
    const data = await r.json();

    // Transformar a: { code, name, dialCode, flag }
    const rows = data
      .map((it) => {
        const code = it.cca2; // ISO-3166 alpha-2
        if (!code || !it.idd) return null;

        const root = it.idd?.root || "";      // ej: "+5"
        const suf = it.idd?.suffixes || [];   // ej: ["7","8","9"]
        // Algunos países tienen múltiples sufijos; devolvemos varias filas o uno con el primero.
        const dialCodes = suf.length ? suf.map(s => `${root}${s}`) : (root ? [root] : []);

        if (!dialCodes.length) return null;

        // Nos quedamos con el primero como principal; si quieres, devuelve el array completo.
        const dialCode = dialCodes[0];

        return {
          code,
          name: it.name?.common || code,
          dialCode,
          flag: flagEmojiFromCC(code),
        };
      })
      .filter(Boolean)
      // pequeños retoques: ordenar por nombre
      .sort((a, b) => a.name.localeCompare(b.name));

    cachedCountries = rows;
    cachedAt = now;
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;
