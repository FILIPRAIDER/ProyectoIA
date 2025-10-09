-- AddCompanyToUser Migration
-- Fecha: 2025-10-08
-- Propósito: Agregar relación User -> Company para empresarios

-- 1. Agregar columna companyId a tabla User (nullable, sin afectar datos existentes)
ALTER TABLE "User" ADD COLUMN "companyId" TEXT;

-- 2. Crear foreign key constraint
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" 
  FOREIGN KEY ("companyId") 
  REFERENCES "Company"("id") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- 3. Crear índice para optimizar queries
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- Nota: La columna es nullable (opcional) por lo que:
-- - Usuarios existentes quedarán con companyId = NULL (no afecta funcionamiento)
-- - Solo empresarios que completen onboarding tendrán companyId asignado
-- - No se pierden datos existentes
