-- Añadir columna 'area' a Team (nullable)
ALTER TABLE "Team"
ADD COLUMN IF NOT EXISTS "area" TEXT;

-- Índice combinado por ciudad y área para filtros
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'Team_city_area_idx'
  ) THEN
    CREATE INDEX "Team_city_area_idx" ON "Team"("city", "area");
  END IF;
END$$;
