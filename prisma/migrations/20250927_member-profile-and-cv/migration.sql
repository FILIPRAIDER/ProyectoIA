-- MEMBER PROFILE (1:1 con User)
CREATE TABLE IF NOT EXISTS "MemberProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL UNIQUE,
  "headline" TEXT,
  "bio" TEXT,
  "seniority" TEXT,
  "location" TEXT,
  "availability" INTEGER,
  "stack" TEXT,
  "sector" TEXT,
  CONSTRAINT "MemberProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MemberProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- CERTIFICATIONS (N:1 User)
CREATE TABLE IF NOT EXISTS "Certification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "issuer" TEXT,
  "issueDate" TIMESTAMP(3),
  "url" TEXT,
  CONSTRAINT "Certification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Certification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Certification_userId_idx" ON "Certification"("userId");

-- EXPERIENCES (N:1 User)
CREATE TABLE IF NOT EXISTS "Experience" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "company" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "description" TEXT,
  CONSTRAINT "Experience_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Experience_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Experience_userId_idx" ON "Experience"("userId");
