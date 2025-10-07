// NOTA: Este archivo mantiene compatibilidad con el código existente
// Para el nuevo error handler mejorado, ver: src/middleware/errorHandler.js

export class HttpError extends Error {
  constructor(status = 500, message = "Internal Server Error", details = undefined) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (req, res, next) => {
  next(new HttpError(404, `No se encontró ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const payload = {
    error: {
      message: err.message || "Error inesperado",
    },
  };
  if (err.details) payload.error.details = err.details;
  
  // Log simple (mejorado en middleware/errorHandler.js)
  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${status} ${err.message}`);
    if (process.env.NODE_ENV !== "production") {
      console.error("Stack:", err.stack);
    }
  }
  
  res.status(status).json(payload);
};
