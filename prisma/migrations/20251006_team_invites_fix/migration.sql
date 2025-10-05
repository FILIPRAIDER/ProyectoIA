-- Crear enum InviteStatus si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InviteStatus') THEN
    CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELED', 'EXPIRED');
  END IF;
END$$;

-- Asegurar existencia de TeamRole (ya debería existir por TeamMember);
-- Si no existiera, descomenta la siguiente línea:
-- CREATE TYPE "TeamRole" AS ENUM ('LIDER','MIEMBRO');

-- Crear tabla TeamInvite si no existe
CREATE TABLE IF NOT EXISTS "TeamInvite" (
  "id"         TEXT PRIMARY KEY,
  "teamId"     TEXT NOT NULL REFERENCES "Team"("id") ON DELETE CASCADE,
  "email"      TEXT NOT NULL,
  "role"       "TeamRole" NOT NULL DEFAULT 'MIEMBRO',
  "token"      TEXT NOT NULL UNIQUE,
  "status"     "InviteStatus" NOT NULL DEFAULT 'PENDING',
  "message"    TEXT,
  "expiresAt"  TIMESTAMPTZ,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "acceptedAt" TIMESTAMPTZ,
  "canceledAt" TIMESTAMPTZ
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS "TeamInvite_teamId_email_idx"
  ON "TeamInvite" ("teamId","email");
