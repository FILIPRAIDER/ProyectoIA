-- Agregar columna para hash de contraseña
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

-- Opcional: si quieres forzar que todos los nuevos usuarios la tengan,
-- NO lo pongas NOT NULL todavía si tienes datos viejos sin contraseña.
-- Cuando limpies los datos antiguos, puedes:
-- ALTER TABLE "User" ALTER COLUMN "password_hash" SET NOT NULL;
