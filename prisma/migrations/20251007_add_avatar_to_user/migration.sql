-- Migration: Add avatarUrl to User model
-- Created: 2025-10-07
-- Description: Adds avatar URL field to User table for quick access

-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- Optional: Copy existing avatars from MemberProfile to User
UPDATE "User" u
SET "avatarUrl" = mp."avatarUrl"
FROM "MemberProfile" mp
WHERE u.id = mp."userId" AND mp."avatarUrl" IS NOT NULL;

-- Create index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS "User_avatarUrl_idx" ON "User"("avatarUrl");
