-- DropIndex
DROP INDEX "User_companyId_idx";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "budgetCurrency" TEXT NOT NULL DEFAULT 'COP';
