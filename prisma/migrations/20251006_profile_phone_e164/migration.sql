ALTER TABLE "MemberProfile"
  ADD COLUMN IF NOT EXISTS "phoneE164" TEXT,
  ADD COLUMN IF NOT EXISTS "phoneCountry" TEXT;

-- Opcional: índice para búsquedas por teléfono canónico
DO $$ BEGIN
  CREATE INDEX "MemberProfile_phoneE164_idx" ON "MemberProfile"("phoneE164");
EXCEPTION WHEN duplicate_table THEN null; END $$;
