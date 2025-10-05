-- Tabla de invitaciones a equipos (TeamInvite)
-- Estados: PENDING | ACCEPTED | CANCELED | EXPIRED

CREATE TABLE "TeamInvite" (
  "id"         TEXT PRIMARY KEY,                 -- SIN DEFAULT cuid() (lo pone Prisma)
  "teamId"     TEXT NOT NULL,
  "email"      TEXT NOT NULL,
  "role"       TEXT NOT NULL CHECK ("role" IN ('LIDER','MIEMBRO')),
  "token"      TEXT NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING','ACCEPTED','CANCELED','EXPIRED')),
  "invitedBy"  TEXT,
  "message"    TEXT,
  "expiresAt"  TIMESTAMP(3) NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "decidedAt"  TIMESTAMP(3) NULL,

  CONSTRAINT "TeamInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE
);

-- Un token debe ser único
CREATE UNIQUE INDEX "TeamInvite_token_key" ON "TeamInvite" ("token");

-- Evitar invitaciones PENDING duplicadas por (teamId + email ci)
CREATE UNIQUE INDEX "TeamInvite_unique_pending_ci"
ON "TeamInvite" ("teamId", lower("email"))
WHERE "status" = 'PENDING';

-- Índices de soporte
CREATE INDEX "TeamInvite_teamId_idx" ON "TeamInvite" ("teamId");
CREATE INDEX "TeamInvite_status_idx" ON "TeamInvite" ("status");
CREATE INDEX "TeamInvite_expiresAt_idx" ON "TeamInvite" ("expiresAt");
