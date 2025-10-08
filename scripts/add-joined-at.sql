-- Agregar columna joinedAt a TeamMember con valor por defecto
ALTER TABLE "TeamMember" 
ADD COLUMN IF NOT EXISTS "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Para registros existentes, usar la fecha actual como fallback
-- (ya que DEFAULT CURRENT_TIMESTAMP lo hace automáticamente)

-- Verificar que se agregó correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'TeamMember' AND column_name = 'joinedAt';
