// src/middleware/validate.js
export const validate = (schema, where = "body") => {
  return (req, res, next) => {
    const source =
      where === "params" ? req.params :
      where === "query"  ? req.query  :
      req.body;

    const parsed = schema.safeParse(source);
    if (!parsed.success) {
      process.stderr.write("\n" + "!".repeat(60) + "\n");
      process.stderr.write("❌ VALIDACIÓN FALLIDA en: " + where + "\n");
      process.stderr.write("📦 Data recibida:\n" + JSON.stringify(source, null, 2) + "\n");
      process.stderr.write("🔍 Errores:\n" + JSON.stringify(parsed.error.issues, null, 2) + "\n");
      process.stderr.write("!".repeat(60) + "\n\n");
      
      return res.status(400).json({
        error: {
          message: "Validación fallida",
          issues: parsed.error.issues.map(i => ({
            path: i.path.join("."),
            message: i.message,
            code: i.code
          }))
        }
      });
    }

    // Guardar valores parseados SIN reescribir propiedades de Express
    if (!req.validated) req.validated = {};
    if (where === "params") req.validated.params = parsed.data;
    else if (where === "query") req.validated.query = parsed.data;
    else req.validated.body = parsed.data;

    next();
  };
};
