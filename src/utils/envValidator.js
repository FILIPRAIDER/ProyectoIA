// src/utils/envValidator.js
import { z } from "zod";

/**
 * Schema de validación para variables de entorno
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().regex(/^\d+$/).transform(Number).default("4001"),

  // Database (CRÍTICO)
  DATABASE_URL: z.string().url().min(1, "DATABASE_URL es requerida"),

  // ImageKit (CRÍTICO para uploads)
  IMAGEKIT_PUBLIC_KEY: z.string().min(1, "IMAGEKIT_PUBLIC_KEY es requerida"),
  IMAGEKIT_PRIVATE_KEY: z.string().min(1, "IMAGEKIT_PRIVATE_KEY es requerida"),
  IMAGEKIT_URL_ENDPOINT: z.string().url("IMAGEKIT_URL_ENDPOINT debe ser una URL válida"),
  IMAGEKIT_UPLOAD_FOLDER: z.string().default("/certifications"),

  // Email Provider
  MAIL_PROVIDER: z.enum(["resend", "mailtrap", "smtp"]).default("resend"),

  // Resend (si MAIL_PROVIDER = resend)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().email().optional().or(z.string().regex(/^.+ <.+@.+>$/)).optional(),
  RESEND_DEV_FORCE_TO: z.string().email().optional(),

  // Mailtrap (si MAIL_PROVIDER = mailtrap)
  MAILTRAP_TOKEN: z.string().optional(),
  MAILTRAP_SENDER: z.string().optional(),

  // SMTP (si MAIL_PROVIDER = smtp)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),

  // URLs Base
  API_BASE_URL: z.string().url().default("http://localhost:4001"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
});

/**
 * Valida las variables de entorno al iniciar la aplicación
 * @throws {Error} Si faltan variables críticas o hay errores de formato
 */
export function validateEnv() {
  console.log("🔍 Validando variables de entorno...");

  try {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => {
        return `  ❌ ${issue.path.join(".")}: ${issue.message}`;
      });

      console.error("\n❌ ERROR: Variables de entorno inválidas o faltantes:\n");
      console.error(errors.join("\n"));
      console.error("\n💡 Revisa tu archivo .env y asegúrate de tener todas las variables requeridas.\n");

      throw new Error("Validación de variables de entorno fallida");
    }

    // Validaciones condicionales según el proveedor de email
    const env = parsed.data;

    if (env.MAIL_PROVIDER === "resend") {
      if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
        throw new Error(
          "❌ MAIL_PROVIDER=resend requiere RESEND_API_KEY y RESEND_FROM configurados"
        );
      }
    }

    if (env.MAIL_PROVIDER === "mailtrap") {
      if (!env.MAILTRAP_TOKEN || !env.MAILTRAP_SENDER) {
        throw new Error(
          "❌ MAIL_PROVIDER=mailtrap requiere MAILTRAP_TOKEN y MAILTRAP_SENDER configurados"
        );
      }
    }

    if (env.MAIL_PROVIDER === "smtp") {
      if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) {
        throw new Error(
          "❌ MAIL_PROVIDER=smtp requiere SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASS configurados"
        );
      }
    }

    // Validar que DATABASE_URL tenga sslmode en producción
    if (env.NODE_ENV === "production" && !env.DATABASE_URL.includes("sslmode")) {
      console.warn(
        "⚠️  ADVERTENCIA: DATABASE_URL no incluye sslmode. Se forzará sslmode=require"
      );
    }

    console.log("✅ Variables de entorno validadas correctamente");
    console.log(`   📍 Entorno: ${env.NODE_ENV}`);
    console.log(`   🌐 Puerto: ${env.PORT}`);
    console.log(`   📧 Proveedor de email: ${env.MAIL_PROVIDER}`);
    console.log(`   🔗 API URL: ${env.API_BASE_URL}`);
    console.log(`   🌍 App URL: ${env.APP_BASE_URL}`);
    console.log("");

    return parsed.data;
  } catch (error) {
    console.error("\n💥 Error fatal al validar variables de entorno:", error.message);
    console.error("\n🛑 El servidor no puede iniciar sin configuración válida.\n");
    process.exit(1);
  }
}

/**
 * Lista las variables de entorno configuradas (sin valores sensibles)
 */
export function listEnvVars() {
  const env = process.env;
  const masked = (key) => {
    const value = env[key];
    if (!value) return "❌ No configurada";
    if (key.includes("KEY") || key.includes("TOKEN") || key.includes("PASS")) {
      return `✅ ${value.substring(0, 8)}...`;
    }
    return `✅ ${value}`;
  };

  console.log("\n📋 Variables de entorno configuradas:");
  console.log("=====================================");
  console.log(`NODE_ENV: ${masked("NODE_ENV")}`);
  console.log(`PORT: ${masked("PORT")}`);
  console.log(`DATABASE_URL: ${env.DATABASE_URL ? "✅ Configurada" : "❌ No configurada"}`);
  console.log(`IMAGEKIT_PUBLIC_KEY: ${masked("IMAGEKIT_PUBLIC_KEY")}`);
  console.log(`IMAGEKIT_PRIVATE_KEY: ${masked("IMAGEKIT_PRIVATE_KEY")}`);
  console.log(`IMAGEKIT_URL_ENDPOINT: ${masked("IMAGEKIT_URL_ENDPOINT")}`);
  console.log(`MAIL_PROVIDER: ${masked("MAIL_PROVIDER")}`);

  if (env.MAIL_PROVIDER === "resend") {
    console.log(`RESEND_API_KEY: ${masked("RESEND_API_KEY")}`);
    console.log(`RESEND_FROM: ${masked("RESEND_FROM")}`);
  }

  console.log("=====================================\n");
}
