-- ============================================================
-- 1) Eliminar duplicados manteniendo el más antiguo (por createdAt)
--    Grupo por (companyId, lower(title))
-- ============================================================
WITH ranked AS (
  SELECT
    p."id",
    p."companyId",
    LOWER(p."title") AS title_ci,
    p."createdAt",
    ROW_NUMBER() OVER (
      PARTITION BY p."companyId", LOWER(p."title")
      ORDER BY p."createdAt" ASC, p."id" ASC
    ) AS rn
  FROM "Project" p
),
to_delete AS (
  SELECT r."id"
  FROM ranked r
  WHERE r.rn > 1
)
DELETE FROM "Project" p
USING to_delete td
WHERE p."id" = td."id";

-- ============================================================
-- 2) Crear índice único case-insensitive: (companyId, lower(title))
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'Project_companyId_title_ci_key'
  ) THEN
    CREATE UNIQUE INDEX "Project_companyId_title_ci_key"
      ON "Project" ("companyId", lower("title"));
  END IF;
END$$;
