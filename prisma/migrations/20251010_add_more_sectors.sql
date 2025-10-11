-- Agregar más sectores profesionales relevantes
-- Fecha: 2025-10-10

INSERT INTO "Sector" (id, name, "nameEs", "nameEn", description, icon, active, "order", "createdAt", "updatedAt") VALUES
-- Tecnología avanzada
(gen_random_uuid(), 'artificial-intelligence', 'Inteligencia Artificial', 'Artificial Intelligence', 'Machine learning, deep learning, data science y análisis predictivo', '🤖', true, 31, NOW(), NOW()),
(gen_random_uuid(), 'cybersecurity', 'Ciberseguridad', 'Cybersecurity', 'Seguridad informática, ethical hacking, protección de datos', '🔒', true, 32, NOW(), NOW()),
(gen_random_uuid(), 'blockchain', 'Blockchain y Web3', 'Blockchain & Web3', 'Desarrollo blockchain, smart contracts, criptomonedas y DeFi', '⛓️', true, 33, NOW(), NOW()),
(gen_random_uuid(), 'cloud-computing', 'Cloud Computing', 'Cloud Computing', 'AWS, Azure, GCP, infraestructura cloud y DevOps', '☁️', true, 34, NOW(), NOW()),

-- Creativos y diseño
(gen_random_uuid(), 'ux-ui-design', 'Diseño UX/UI', 'UX/UI Design', 'Diseño de producto, experiencia de usuario, interfaces', '🎨', true, 35, NOW(), NOW()),
(gen_random_uuid(), 'digital-content', 'Contenido Digital', 'Digital Content', 'Creación de contenido, redes sociales, community management', '📱', true, 36, NOW(), NOW()),
(gen_random_uuid(), 'digital-advertising', 'Publicidad Digital', 'Digital Advertising', 'Marketing digital, estrategia de marca, performance marketing', '📢', true, 37, NOW(), NOW()),

-- Científicos
(gen_random_uuid(), 'biotechnology', 'Biotecnología', 'Biotechnology', 'Ingeniería genética, biología molecular, bioinformática', '🧬', true, 38, NOW(), NOW()),
(gen_random_uuid(), 'pharmaceutical', 'Farmacéutica', 'Pharmaceutical', 'Desarrollo de medicamentos, investigación clínica', '💊', true, 39, NOW(), NOW()),
(gen_random_uuid(), 'environment', 'Medio Ambiente', 'Environment', 'Sostenibilidad, gestión ambiental, energías renovables', '🌱', true, 40, NOW(), NOW()),

-- Negocios y servicios
(gen_random_uuid(), 'human-resources', 'Recursos Humanos', 'Human Resources', 'Reclutamiento, gestión de talento, desarrollo organizacional', '👥', true, 41, NOW(), NOW()),
(gen_random_uuid(), 'data-analytics', 'Data Analytics', 'Data Analytics', 'Business intelligence, análisis de datos, reporting', '📊', true, 42, NOW(), NOW()),

-- Industriales
(gen_random_uuid(), 'robotics', 'Robótica', 'Robotics', 'Robótica industrial, automatización, AI física', '🤖', true, 43, NOW(), NOW()),
(gen_random_uuid(), 'logistics', 'Logística', 'Logistics', 'Supply chain, distribución, transporte y almacenamiento', '🚚', true, 44, NOW(), NOW()),

-- Entretenimiento
(gen_random_uuid(), 'media', 'Medios de Comunicación', 'Media', 'Periodismo, producción audiovisual, broadcasting', '📺', true, 45, NOW(), NOW()),
(gen_random_uuid(), 'music', 'Música', 'Music', 'Producción musical, industria discográfica, streaming', '🎵', true, 46, NOW(), NOW()),
(gen_random_uuid(), 'art-culture', 'Arte y Cultura', 'Art & Culture', 'Galerías, museos, producción cultural, gestión artística', '🎭', true, 47, NOW(), NOW())

ON CONFLICT (name) DO NOTHING;
