-- Migration: Add phoneE164 and phoneCountry to MemberProfile
-- Generated: 2025-10-06
-- Description: Adds the phoneE164 and phoneCountry fields that are already in the Prisma schema
--              but missing from the database.

-- Add phoneE164 column (E.164 format: +573001234567)
ALTER TABLE "MemberProfile" 
ADD COLUMN IF NOT EXISTS "phoneE164" TEXT;

-- Add phoneCountry column (ISO-3166 alpha-2: "CO", "US", etc.)
ALTER TABLE "MemberProfile" 
ADD COLUMN IF NOT EXISTS "phoneCountry" TEXT;

-- Optional: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "MemberProfile_phoneE164_idx" ON "MemberProfile"("phoneE164");
CREATE INDEX IF NOT EXISTS "MemberProfile_phoneCountry_idx" ON "MemberProfile"("phoneCountry");

-- Optional: Add comments to document the fields
COMMENT ON COLUMN "MemberProfile"."phoneE164" IS 'Phone number in E.164 format (e.g., +573001234567)';
COMMENT ON COLUMN "MemberProfile"."phoneCountry" IS 'Phone country code in ISO-3166 alpha-2 format (e.g., CO, US)';
