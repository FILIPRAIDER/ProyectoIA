-- 1) Enum para estado de aplicación
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApplicationStatus') THEN
    CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
  END IF;
END$$;

-- 2) Tabla TeamApplication
CREATE TABLE IF NOT EXISTS "TeamApplication" (
  "id" TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "message" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "decidedAt" TIMESTAMPTZ,
  "decidedBy" TEXT
);

-- 3) Índices
CREATE INDEX IF NOT EXISTS "TeamApplication_projectId_idx" ON "TeamApplication" ("projectId");
CREATE INDEX IF NOT EXISTS "TeamApplication_teamId_idx" ON "TeamApplication" ("teamId");

-- 4) FKs (en cascada al borrar Proyecto/Equipo)
ALTER TABLE "TeamApplication"
  ADD CONSTRAINT "TeamApplication_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamApplication"
  ADD CONSTRAINT "TeamApplication_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5) (Opcional) Unicidad de PENDING por par (parcial index)
--    Descomenta si deseas impedir 2 invitaciones PENDING para el mismo par.
-- CREATE UNIQUE INDEX "TeamApplication_unique_pending"
-- ON "TeamApplication" ("projectId", "teamId")
-- WHERE status = 'PENDING';
