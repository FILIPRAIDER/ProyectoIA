-- CreateTable
CREATE TABLE "Industry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryKeyword" (
    "id" TEXT NOT NULL,
    "industryId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndustryKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Industry_name_key" ON "Industry"("name");

-- CreateIndex
CREATE INDEX "Industry_active_idx" ON "Industry"("active");

-- CreateIndex
CREATE INDEX "IndustryKeyword_keyword_idx" ON "IndustryKeyword"("keyword");

-- CreateIndex
CREATE INDEX "IndustryKeyword_industryId_idx" ON "IndustryKeyword"("industryId");

-- CreateIndex
CREATE INDEX "IndustryKeyword_priority_idx" ON "IndustryKeyword"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryKeyword_industryId_keyword_language_key" ON "IndustryKeyword"("industryId", "keyword", "language");

-- AddForeignKey
ALTER TABLE "IndustryKeyword" ADD CONSTRAINT "IndustryKeyword_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
