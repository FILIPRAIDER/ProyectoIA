-- 0) (Defensivo) Quitar DEFAULT antiguo si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'TeamInvite'
      AND column_name = 'status'
      AND column_default IS NOT NULL
  ) THEN
    EXECUTE 'ALTER TABLE public."TeamInvite" ALTER COLUMN "status" DROP DEFAULT';
  END IF;
END$$;

-- 1) Soltar índices que referencian "status" (incluye parciales con WHERE status = '...')
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'TeamInvite'
      AND indexdef ILIKE '%status%'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I', r.schemaname, r.indexname);
  END LOOP;
END$$;

-- 2) Soltar CHECK constraints que referencien "status" (si existieran)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public."TeamInvite"'::regclass
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public."TeamInvite" DROP CONSTRAINT %I', r.conname);
  END LOOP;
END$$;

-- 3) Asegurar tipo ENUM
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InviteStatus') THEN
    CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELED', 'EXPIRED');
  END IF;
END$$;

-- 4) Cambiar tipo de columna a ENUM con casting explícito
ALTER TABLE public."TeamInvite"
  ALTER COLUMN "status" TYPE "InviteStatus"
  USING
    CASE
      WHEN "status" IN ('PENDING','ACCEPTED','CANCELED','EXPIRED')
        THEN "status"::"InviteStatus"
      ELSE 'PENDING'::"InviteStatus"
    END;

-- 5) Colocar DEFAULT ya como ENUM
ALTER TABLE public."TeamInvite"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- 6) (Opcional) Recrear índice ÚNICO simple sin predicado (no-parcial).
-- Si ya lo manejas en Prisma, puedes omitir este bloque.
-- CREATE UNIQUE INDEX IF NOT EXISTS "team_email_status_unique"
--   ON public."TeamInvite" ("teamId","email","status");
