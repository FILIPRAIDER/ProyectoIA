// Valida req.body (o params/query) con Zod
export const validate =
  (schema, where = "body") =>
  (req, res, next) => {
    try {
      const data = schema.parse(req[where]);
      req[where] = data; // normaliza
      next();
    } catch (e) {
      const issues = e?.issues?.map(i => ({
        path: i.path.join("."),
        message: i.message,
      }));
      next({ status: 400, message: "Validación fallida", details: issues });
    }
  };
