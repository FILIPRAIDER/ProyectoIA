-- ============================================
-- SCRIPT: Agregar nuevos sectores profesionales
-- Base de datos: Bridge
-- Fecha: 2025-10-10
-- ============================================

-- IMPORTANTE: Ejecutar este script en tu base de datos PostgreSQL
-- Esto agregará 20 sectores nuevos y relevantes

-- ============================================
-- SECTORES TECNOLÓGICOS (Los más demandados)
-- ============================================

INSERT INTO sectors (name_es, name_en, description, icon) VALUES
('Inteligencia Artificial', 'Artificial Intelligence', 'Data science, machine learning, deep learning y análisis predictivo', '🤖'),
('Ciberseguridad', 'Cybersecurity', 'Seguridad informática, ethical hacking, protección de datos', '🔒'),
('Blockchain y Web3', 'Blockchain & Web3', 'Desarrollo blockchain, smart contracts, criptomonedas y DeFi', '⛓️'),
('Desarrollo de Software', 'Software Development', 'Programación, ingeniería de software, desarrollo web y móvil', '💻'),
('Cloud Computing', 'Cloud Computing', 'AWS, Azure, GCP, infraestructura cloud y DevOps', '☁️'),
('Gaming y Videojuegos', 'Gaming', 'Desarrollo de videojuegos, game design, eSports', '🎮');

-- ============================================
-- SECTORES CREATIVOS Y DISEÑO
-- ============================================

INSERT INTO sectors (name_es, name_en, description, icon) VALUES
('Diseño UX/UI', 'UX/UI Design', 'Diseño de producto, experiencia de usuario, interfaces', '🎨'),
('Contenido Digital', 'Digital Content', 'Creación de contenido, redes sociales, community management', '📱'),
('Publicidad Digital', 'Digital Advertising', 'Marketing digital, estrategia de marca, performance marketing', '📢');

-- ============================================
-- SECTORES CIENTÍFICOS Y BIOTECNOLOGÍA
-- ============================================

INSERT INTO sectors (name_es, name_en, description, icon) VALUES
('Biotecnología', 'Biotechnology', 'Ingeniería genética, biología molecular, bioinformática', '🧬'),
('Farmacéutica', 'Pharmaceutical', 'Desarrollo de medicamentos, investigación clínica', '💊'),
('Medio Ambiente', 'Environment', 'Sostenibilidad, gestión ambiental, energías renovables', '🌱');

-- ============================================
-- SECTORES DE NEGOCIOS Y SERVICIOS
-- ============================================

INSERT INTO sectors (name_es, name_en, description, icon) VALUES
('Recursos Humanos', 'Human Resources', 'Reclutamiento, gestión de talento, desarrollo organizacional', '👥'),
('Data Analytics', 'Data Analytics', 'Business intelligence, análisis de datos, reporting', '📊'),
('Seguros', 'Insurance', 'Sector asegurador, gestión de riesgos, actuaría', '🛡️');

-- ============================================
-- SECTORES INDUSTRIALES Y ESPECIALIZADOS
-- ============================================

INSERT INTO sectors (name_es, name_en, description, icon) VALUES
('Aeroespacial', 'Aerospace', 'Aviación, tecnología espacial, ingeniería aeronáutica', '✈️'),
('Robótica', 'Robotics', 'Robótica industrial, automatización, inteligencia artificial física', '🤖'),
('Moda y Textil', 'Fashion & Textile', 'Diseño de moda, producción textil, retail fashion', '👔'),
('Deportes', 'Sports', 'Gestión deportiva, entrenamiento, nutrición deportiva', '⚽'),
('Arte y Cultura', 'Art & Culture', 'Galerías, museos, producción cultural, gestión artística', '🎭');

-- ============================================
-- VERIFICAR QUE SE AGREGARON CORRECTAMENTE
-- ============================================

-- Contar sectores totales
SELECT COUNT(*) as total_sectores FROM sectors;

-- Ver los últimos 20 sectores agregados
SELECT 
    id,
    name_es,
    icon,
    created_at
FROM sectors
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Este script agrega 20 sectores nuevos
-- 2. Verifica que los nombres de columnas coincidan con tu esquema:
--    - Si tu tabla usa 'nameEs' en vez de 'name_es', ajusta el script
--    - Si tu tabla usa 'createdAt' en vez de 'created_at', ajusta el script
-- 
-- 3. Si ya tienes alguno de estos sectores, saltará un error de UNIQUE
--    En ese caso, comenta las líneas duplicadas
--
-- 4. Total de sectores después de este script: 26 (originales) + 20 (nuevos) = 46 sectores

-- ============================================
-- ROLLBACK (Por si necesitas deshacer)
-- ============================================

-- Para eliminar los sectores agregados (SOLO si necesitas revertir):
-- DELETE FROM sectors WHERE name_es IN (
--   'Inteligencia Artificial', 'Ciberseguridad', 'Blockchain y Web3',
--   'Desarrollo de Software', 'Cloud Computing', 'Gaming y Videojuegos',
--   'Diseño UX/UI', 'Contenido Digital', 'Publicidad Digital',
--   'Biotecnología', 'Farmacéutica', 'Medio Ambiente',
--   'Recursos Humanos', 'Data Analytics', 'Seguros',
--   'Aeroespacial', 'Robótica', 'Moda y Textil', 'Deportes', 'Arte y Cultura'
-- );
