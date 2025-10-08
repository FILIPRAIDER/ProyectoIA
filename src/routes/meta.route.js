import { Router } from "express";
import { HttpError } from "../utils/http-errors.js";
import { prisma } from "../lib/prisma.js";

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

/* ============================================================
   GET /meta/sectors
   Retorna lista de sectores desde la base de datos
   Incluye: id, name, nameEs, nameEn, icon, description
============================================================ */
router.get("/sectors", async (_req, res, next) => {
  try {
    const sectors = await prisma.sector.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        nameEs: true,
        nameEn: true,
        description: true,
        icon: true,
      },
    });

    res.json({
      ok: true,
      sectors,
      total: sectors.length,
    });
  } catch (e) {
    console.error('Error fetching sectors:', e);
    next(e);
  }
});

/* ============================================================
   GET /meta/stacks
   Retorna lista de stacks tecnológicos comunes (opcional)
   Para ayudar a usuarios a rellenar el campo stack
============================================================ */
const COMMON_STACKS = [
  "MERN (MongoDB, Express, React, Node.js)",
  "MEAN (MongoDB, Express, Angular, Node.js)",
  "LAMP (Linux, Apache, MySQL, PHP)",
  "JAMstack (JavaScript, APIs, Markup)",
  "Python + Django + PostgreSQL",
  "Ruby on Rails + PostgreSQL",
  ".NET Core + SQL Server",
  "Java Spring Boot + MySQL",
  "Next.js + TypeScript + Prisma",
  "Vue.js + Nuxt + Firebase",
  "Flutter + Firebase",
  "React Native + Expo",
  "Full Stack JavaScript",
  "DevOps (Docker, Kubernetes, CI/CD)",
  "Cloud Native (AWS/Azure/GCP)",
];

router.get("/stacks", async (_req, res, next) => {
  try {
    res.json({
      ok: true,
      stacks: COMMON_STACKS,
      total: COMMON_STACKS.length,
    });
  } catch (e) {
    next(e);
  }
});

/* ============================================================
   GET /meta/cities/:countryCode
   Retorna lista de ciudades principales por país
   Parámetro: countryCode (ISO 3166-1 alpha-2: "CO", "US", etc.)
============================================================ */
const CITIES_BY_COUNTRY = {
  // Colombia
  CO: [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
    'Cúcuta', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué',
    'Pasto', 'Manizales', 'Neiva', 'Villavicencio', 'Armenia',
    'Valledupar', 'Montería', 'Popayán', 'Sincelejo', 'Tunja',
  ],
  // Estados Unidos
  US: [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    'Austin', 'Jacksonville', 'San Francisco', 'Columbus', 'Seattle',
    'Denver', 'Boston', 'Nashville', 'Portland', 'Las Vegas',
  ],
  // México
  MX: [
    'Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana',
    'León', 'Juárez', 'Zapopan', 'Mérida', 'San Luis Potosí',
    'Aguascalientes', 'Hermosillo', 'Saltillo', 'Mexicali', 'Culiacán',
    'Querétaro', 'Chihuahua', 'Cancún', 'Morelia', 'Toluca',
  ],
  // Argentina
  AR: [
    'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata',
    'San Miguel de Tucumán', 'Mar del Plata', 'Salta', 'Santa Fe', 'San Juan',
    'Resistencia', 'Neuquén', 'Posadas', 'Bahía Blanca', 'Corrientes',
  ],
  // Brasil
  BR: [
    'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza',
    'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre',
    'Belém', 'Goiânia', 'Guarulhos', 'Campinas', 'São Luís',
  ],
  // Chile
  CL: [
    'Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta',
    'Temuco', 'Rancagua', 'Talca', 'Arica', 'Chillán',
    'Iquique', 'Puerto Montt', 'Los Ángeles', 'Coyhaique', 'Punta Arenas',
  ],
  // Perú
  PE: [
    'Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura',
    'Iquitos', 'Cusco', 'Huancayo', 'Tacna', 'Pucallpa',
    'Ica', 'Juliaca', 'Sullana', 'Ayacucho', 'Cajamarca',
  ],
  // Ecuador
  EC: [
    'Quito', 'Guayaquil', 'Cuenca', 'Santo Domingo', 'Machala',
    'Durán', 'Portoviejo', 'Manta', 'Loja', 'Ambato',
    'Esmeraldas', 'Riobamba', 'Ibarra', 'Milagro', 'La Libertad',
  ],
  // Venezuela
  VE: [
    'Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay',
    'Ciudad Guayana', 'Barcelona', 'Maturín', 'San Cristóbal', 'Ciudad Bolívar',
    'Cumaná', 'Mérida', 'Puerto La Cruz', 'Los Teques', 'Barinas',
  ],
  // España
  ES: [
    'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza',
    'Málaga', 'Murcia', 'Palma de Mallorca', 'Las Palmas', 'Bilbao',
    'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón',
    'Granada', 'Vitoria', 'La Coruña', 'Pamplona', 'Santander',
  ],
  // Portugal
  PT: [
    'Lisboa', 'Porto', 'Amadora', 'Braga', 'Setúbal',
    'Coimbra', 'Funchal', 'Queluz', 'Almada', 'Évora',
  ],
  // Francia
  FR: [
    'París', 'Marsella', 'Lyon', 'Toulouse', 'Niza',
    'Nantes', 'Montpellier', 'Estrasburgo', 'Burdeos', 'Lille',
  ],
  // Alemania
  DE: [
    'Berlín', 'Hamburgo', 'Múnich', 'Colonia', 'Fráncfort',
    'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig',
  ],
  // Italia
  IT: [
    'Roma', 'Milán', 'Nápoles', 'Turín', 'Palermo',
    'Génova', 'Bolonia', 'Florencia', 'Venecia', 'Verona',
  ],
  // Reino Unido
  GB: [
    'Londres', 'Birmingham', 'Manchester', 'Leeds', 'Glasgow',
    'Liverpool', 'Newcastle', 'Sheffield', 'Bristol', 'Edimburgo',
  ],
  // Canadá
  CA: [
    'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton',
    'Ottawa', 'Winnipeg', 'Quebec', 'Hamilton', 'Kitchener',
  ],
  // Australia
  AU: [
    'Sídney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaida',
    'Gold Coast', 'Canberra', 'Newcastle', 'Wollongong', 'Hobart',
  ],
};

router.get("/cities/:countryCode", async (req, res, next) => {
  try {
    const { countryCode } = req.params;
    const code = countryCode.toUpperCase();
    const cities = CITIES_BY_COUNTRY[code] || [];
    
    res.json({
      ok: true,
      countryCode: code,
      cities,
      total: cities.length,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
