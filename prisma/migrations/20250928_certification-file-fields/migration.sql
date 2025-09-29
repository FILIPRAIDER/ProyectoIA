-- Campos opcionales para archivo asociado a la certificación
ALTER TABLE "Certification"
  ADD COLUMN IF NOT EXISTS "fileUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "fileProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "fileKey" TEXT,
  ADD COLUMN IF NOT EXISTS "fileType" TEXT,
  ADD COLUMN IF NOT EXISTS "fileSize" INTEGER,
  ADD COLUMN IF NOT EXISTS "fileWidth" INTEGER,
  ADD COLUMN IF NOT EXISTS "fileHeight" INTEGER;
