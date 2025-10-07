// src/middleware/errorHandler.js
import { Prisma } from "@prisma/client";

/**
 * Clase personalizada para errores HTTP
 */
export class HttpError extends Error {
  constructor(status = 500, message = "Internal Server Error", details = undefined) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handler 404 - Not Found
 */
export const notFoundHandler = (req, res, next) => {
  next(new HttpError(404, `No se encontró ${req.method} ${req.originalUrl}`));
};

/**
 * Mapea errores de Prisma a respuestas HTTP apropiadas
 */
function handlePrismaError(error) {
  // Errores de validación/constraint
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2000":
        return new HttpError(
          400,
          "El valor proporcionado es demasiado largo para el campo",
          { field: error.meta?.column_name }
        );

      case "P2001":
        return new HttpError(
          404,
          "El registro buscado no existe",
          { model: error.meta?.modelName }
        );

      case "P2002":
        const fields = error.meta?.target || ["campo"];
        return new HttpError(
          409,
          `Ya existe un registro con ese ${Array.isArray(fields) ? fields.join(", ") : fields}`,
          { fields: error.meta?.target }
        );

      case "P2003":
        return new HttpError(
          400,
          "Violación de clave foránea - el registro relacionado no existe",
          { field: error.meta?.field_name }
        );

      case "P2004":
        return new HttpError(
          400,
          "Violación de restricción en la base de datos",
          { constraint: error.meta?.constraint }
        );

      case "P2011":
        return new HttpError(
          400,
          `Campo requerido faltante: ${error.meta?.constraint}`,
          { constraint: error.meta?.constraint }
        );

      case "P2012":
        return new HttpError(
          400,
          "Valor faltante para campo requerido",
          { field: error.meta?.path }
        );

      case "P2013":
        return new HttpError(
          400,
          `Argumento requerido faltante: ${error.meta?.argumentName}`,
          { argument: error.meta?.argumentName }
        );

      case "P2014":
        return new HttpError(
          400,
          "Violación de relación requerida",
          { relation: error.meta?.relation_name }
        );

      case "P2015":
        return new HttpError(
          404,
          "Registro relacionado no encontrado",
          { relation: error.meta?.relation_name }
        );

      case "P2016":
        return new HttpError(
          400,
          "Error de interpretación de query",
          { details: error.meta?.details }
        );

      case "P2017":
        return new HttpError(
          400,
          "Relaciones no conectadas correctamente",
          { relation: error.meta?.relation_name }
        );

      case "P2018":
        return new HttpError(
          400,
          "Registros conectados requeridos no encontrados",
          { details: error.meta }
        );

      case "P2019":
        return new HttpError(
          400,
          "Error de entrada de datos",
          { details: error.message }
        );

      case "P2020":
        return new HttpError(
          400,
          "Valor fuera de rango para el tipo de dato",
          { details: error.meta }
        );

      case "P2021":
        return new HttpError(
          500,
          "La tabla no existe en la base de datos",
          { table: error.meta?.table }
        );

      case "P2022":
        return new HttpError(
          500,
          "La columna no existe en la base de datos",
          { column: error.meta?.column }
        );

      case "P2023":
        return new HttpError(
          500,
          "Columna de datos inconsistente",
          { details: error.message }
        );

      case "P2024":
        return new HttpError(
          408,
          "Timeout de conexión a la base de datos",
          { timeout: error.meta?.timeout }
        );

      case "P2025":
        return new HttpError(
          404,
          "Registro no encontrado para actualizar o eliminar",
          { operation: error.meta?.cause }
        );

      case "P2026":
        return new HttpError(
          400,
          "El proveedor de base de datos no soporta esta operación",
          { provider: error.meta?.provider }
        );

      case "P2027":
        return new HttpError(
          500,
          "Múltiples errores en la base de datos durante ejecución",
          { errors: error.meta?.errors }
        );

      case "P2028":
        return new HttpError(
          500,
          "Error de transacción en la base de datos",
          { details: error.message }
        );

      default:
        return new HttpError(
          500,
          "Error de base de datos",
          { code: error.code, meta: error.meta }
        );
    }
  }

  // Errores de inicialización
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new HttpError(
      503,
      "No se pudo conectar a la base de datos",
      { errorCode: error.errorCode }
    );
  }

  // Errores de validación
  if (error instanceof Prisma.PrismaClientValidationError) {
    return new HttpError(
      400,
      "Error de validación en la consulta a base de datos",
      { details: error.message.split("\n")[0] }
    );
  }

  // Error genérico de Prisma
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new HttpError(
      500,
      "Error crítico del motor de base de datos",
      { details: "Por favor contacte al administrador" }
    );
  }

  return null;
}

/**
 * Middleware global de manejo de errores
 */
export const errorHandler = (err, req, res, next) => {
  // Log del error (en producción usar logger como Winston)
  const timestamp = new Date().toISOString();
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get("user-agent"),
  };

  // Intentar convertir errores de Prisma
  const prismaError = handlePrismaError(err);
  const error = prismaError || err;

  // Determinar status code
  const status = error.status || 500;

  // Log completo del error (solo stack trace en desarrollo)
  if (process.env.NODE_ENV !== "production") {
    console.error("\n" + "=".repeat(80));
    console.error(`[${timestamp}] ERROR ${status}`);
    console.error("Request:", requestInfo);
    console.error("Error:", error.message);
    if (error.details) console.error("Details:", error.details);
    console.error("Stack:", error.stack);
    console.error("=".repeat(80) + "\n");
  } else {
    // En producción, log simplificado
    console.error(
      `[${timestamp}] ${status} ${error.message} - ${req.method} ${req.originalUrl}`
    );
    // Aquí integrarías con un servicio de logging (Sentry, LogRocket, etc.)
  }

  // Preparar respuesta
  const payload = {
    error: {
      message: error.message || "Error inesperado del servidor",
      ...(error.details && { details: error.details }),
    },
  };

  // En desarrollo, agregar info adicional
  if (process.env.NODE_ENV !== "production") {
    payload.error._dev = {
      timestamp,
      request: requestInfo,
      stack: error.stack?.split("\n").slice(0, 5), // Primeras 5 líneas del stack
      ...(prismaError && { prismaCode: err.code }),
    };
  }

  // Enviar respuesta
  res.status(status).json(payload);
};

/**
 * Wrapper async para rutas que automáticamente pasa errores a next()
 * Uso: router.get('/ruta', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para validar que ciertos campos existan en el request
 */
export const requireFields = (fields, source = "body") => {
  return (req, res, next) => {
    const data = source === "params" ? req.params : source === "query" ? req.query : req.body;
    const missing = fields.filter((field) => !(field in data) || data[field] === undefined);

    if (missing.length > 0) {
      return next(
        new HttpError(400, `Campos requeridos faltantes: ${missing.join(", ")}`, { missing })
      );
    }

    next();
  };
};
