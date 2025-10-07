-- Enums nuevos
DO $$ BEGIN
  CREATE TYPE "IdentityType" AS ENUM ('CC','TI','CE','PEP','PASAPORTE','NIT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "OnboardingStep" AS ENUM ('ACCOUNT','PROFILE','OPTIONAL','DONE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- User: paso de onboarding
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "onboardingStep" "OnboardingStep" NOT NULL DEFAULT 'ACCOUNT';

-- MemberProfile: identidad, contacto, nacimiento
ALTER TABLE "MemberProfile"
  ADD COLUMN IF NOT EXISTS "identityType" "IdentityType",
  ADD COLUMN IF NOT EXISTS "documentNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "birthdate" TIMESTAMP(3);

-- Único (si quieres permitir nulos repetidos, el índice único ignora NULLs en Postgres)
DO $$ BEGIN
  CREATE UNIQUE INDEX "MemberProfile_documentNumber_key" ON "MemberProfile"("documentNumber");
EXCEPTION WHEN duplicate_table THEN null; END $$;

-- MemberProfile: avatar (ImageKit u otros)
ALTER TABLE "MemberProfile"
  ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "avatarProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "avatarKey" TEXT,
  ADD COLUMN IF NOT EXISTS "avatarType" TEXT,
  ADD COLUMN IF NOT EXISTS "avatarSize" INTEGER,
  ADD COLUMN IF NOT EXISTS "avatarWidth" INTEGER,
  ADD COLUMN IF NOT EXISTS "avatarHeight" INTEGER;
