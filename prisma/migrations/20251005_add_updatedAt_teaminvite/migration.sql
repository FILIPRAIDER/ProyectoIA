-- Asegurar columna createdAt (por si en tu tabla faltara)
ALTER TABLE public."TeamInvite"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Agregar columna updatedAt si no existe
ALTER TABLE public."TeamInvite"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- Rellenar nulos
UPDATE public."TeamInvite"
SET "updatedAt" = NOW()
WHERE "updatedAt" IS NULL;

-- Marcar NOT NULL
ALTER TABLE public."TeamInvite"
  ALTER COLUMN "updatedAt" SET NOT NULL;

-- (Opcional) dejar default NOW() para inserciones manuales fuera de Prisma.
-- Prisma actualizará updatedAt en cada UPDATE por su @updatedAt.
ALTER TABLE public."TeamInvite"
  ALTER COLUMN "updatedAt" SET DEFAULT NOW();
