import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

// ✨ NUEVO: Validar env antes de iniciar
import { validateEnv } from "./utils/envValidator.js";
validateEnv();

// Rutas
import { router as healthRouter } from "./routes/health.route.js";
import { router as usersRouter } from "./routes/users.route.js";
import { router as skillsRouter } from "./routes/skills.route.js";
import { router as teamsRouter } from "./routes/teams.route.js";
import { router as userProfileRouter } from "./routes/userProfile.route.js";
import { router as uploadsRouter } from "./routes/uploads.route.js";
import { router as companiesRouter } from "./routes/companies.route.js";
import { router as projectsRouter } from "./routes/projects.route.js";
import { router as matchingRouter } from "./routes/matching.route.js";
import { router as projectApplicationsRouter } from "./routes/projectApplications.route.js";
import { router as teamInvitesRouter } from "./routes/teamInvites.route.js";
import { router as authRoutes } from "./routes/auth.route.js";
import { router as metaRouter } from "./routes/meta.route.js";
import { router as notificationsRouter } from "./routes/notifications.route.js";
import { router as debugRouter } from "./routes/debug.route.js";
import { router as industriesRouter } from "./routes/industries.route.js";

// ✨ MEJORADO: Usar error handler mejorado
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const { PORT = 4001, NODE_ENV = "development", APP_BASE_URL } = process.env;

const app = express();

// ✨ MEJORADO: CORS configurado según entorno
const corsOptions =
  NODE_ENV === "production"
    ? {
        origin: function (origin, callback) {
          // Permitir requests sin origin (mobile apps, Postman, etc.)
          if (!origin) return callback(null, true);

          const allowedOrigins = [
            APP_BASE_URL,
            process.env.FRONTEND_URL, // URL de Vercel
            "https://bridge-ai-api.onrender.com", // AI-API en Render
            "http://localhost:4101", // AI-API local
            "http://localhost:3000", // Frontend local
            // Agregar más dominios si es necesario
          ].filter(Boolean);

          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            console.warn(`❌ CORS bloqueado para origen: ${origin}`);
            callback(new Error("No permitido por CORS"));
          }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-By", "User-Agent"],
        optionsSuccessStatus: 200,
      }
    : {
        // En desarrollo permite todo (incluye localhost:3000 y localhost:4101)
        origin: "*",
      };

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(NODE_ENV === "production" ? "combined" : "dev"));

// Logging de peticiones del AI-API
app.use((req, res, next) => {
  const origin = req.get("origin");
  const userAgent = req.get("user-agent");
  
  if (origin?.includes("bridge-ai-api") || userAgent?.includes("AI-API")) {
    console.log(`🤖 AI-API Request: ${req.method} ${req.path} - Origin: ${origin}`);
  }
  
  next();
});

app.use("/health", healthRouter);
app.use("/users", usersRouter);
app.use("/skills", skillsRouter);
app.use("/teams", teamsRouter);
// Montamos también bajo /users (p. ej., /users/:userId/profile)
app.use("/users", userProfileRouter);
app.use("/uploads", uploadsRouter);
app.use("/companies", companiesRouter);
app.use("/projects", projectsRouter);

// Matching
app.use("/matching", matchingRouter);
app.use("/projects", projectApplicationsRouter);

app.use("/teams", teamInvitesRouter);

app.use("/auth", authRoutes);

app.use("/meta", metaRouter);

app.use("/notifications", notificationsRouter);

app.use("/industries", industriesRouter);

// Debug endpoints (solo en desarrollo/testing)
if (NODE_ENV !== "production" || process.env.ENABLE_DEBUG === "true") {
  app.use("/debug", debugRouter);
  console.log("🔧 Debug endpoints enabled at /debug/*");
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(Number(PORT), () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 core-api (Express) iniciado correctamente`);
  console.log(`${"=".repeat(60)}`);
  console.log(`   🌐 URL: http://localhost:${PORT}`);
  console.log(`   📍 Entorno: ${NODE_ENV}`);
  console.log(`   ⏰ Hora: ${new Date().toLocaleString("es-CO")}`);
  console.log(`${"=".repeat(60)}\n`);
});

// ✨ NUEVO: Manejo de señales para graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n👋 SIGTERM recibido, cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n👋 SIGINT recibido (Ctrl+C), cerrando servidor...");
  process.exit(0);
});
