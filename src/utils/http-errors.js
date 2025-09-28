export class HttpError extends Error {
  constructor(status = 500, message = "Internal Server Error", details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
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
  res.status(status).json(payload);
};
