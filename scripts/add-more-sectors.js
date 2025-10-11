#!/usr/bin/env node

/**
 * 🏢 Script para agregar más sectores profesionales
 * 
 * Agrega 17 sectores nuevos y relevantes:
 * - Inteligencia Artificial
 * - Ciberseguridad
 * - Blockchain y Web3
 * - Cloud Computing
 * - Y más...
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const newSectors = [
  // Tecnología avanzada
  {
    name: 'artificial-intelligence',
    nameEs: 'Inteligencia Artificial',
    nameEn: 'Artificial Intelligence',
    description: 'Machine learning, deep learning, data science y análisis predictivo',
    icon: '🤖',
    active: true,
    order: 31
  },
  {
    name: 'cybersecurity',
    nameEs: 'Ciberseguridad',
    nameEn: 'Cybersecurity',
    description: 'Seguridad informática, ethical hacking, protección de datos',
    icon: '🔒',
    active: true,
    order: 32
  },
  {
    name: 'blockchain',
    nameEs: 'Blockchain y Web3',
    nameEn: 'Blockchain & Web3',
    description: 'Desarrollo blockchain, smart contracts, criptomonedas y DeFi',
    icon: '⛓️',
    active: true,
    order: 33
  },
  {
    name: 'cloud-computing',
    nameEs: 'Cloud Computing',
    nameEn: 'Cloud Computing',
    description: 'AWS, Azure, GCP, infraestructura cloud y DevOps',
    icon: '☁️',
    active: true,
    order: 34
  },
  // Creativos y diseño
  {
    name: 'ux-ui-design',
    nameEs: 'Diseño UX/UI',
    nameEn: 'UX/UI Design',
    description: 'Diseño de producto, experiencia de usuario, interfaces',
    icon: '🎨',
    active: true,
    order: 35
  },
  {
    name: 'digital-content',
    nameEs: 'Contenido Digital',
    nameEn: 'Digital Content',
    description: 'Creación de contenido, redes sociales, community management',
    icon: '📱',
    active: true,
    order: 36
  },
  {
    name: 'digital-advertising',
    nameEs: 'Publicidad Digital',
    nameEn: 'Digital Advertising',
    description: 'Marketing digital, estrategia de marca, performance marketing',
    icon: '📢',
    active: true,
    order: 37
  },
  // Científicos
  {
    name: 'biotechnology',
    nameEs: 'Biotecnología',
    nameEn: 'Biotechnology',
    description: 'Ingeniería genética, biología molecular, bioinformática',
    icon: '🧬',
    active: true,
    order: 38
  },
  {
    name: 'pharmaceutical',
    nameEs: 'Farmacéutica',
    nameEn: 'Pharmaceutical',
    description: 'Desarrollo de medicamentos, investigación clínica',
    icon: '💊',
    active: true,
    order: 39
  },
  {
    name: 'environment',
    nameEs: 'Medio Ambiente',
    nameEn: 'Environment',
    description: 'Sostenibilidad, gestión ambiental, energías renovables',
    icon: '🌱',
    active: true,
    order: 40
  },
  // Negocios y servicios
  {
    name: 'human-resources',
    nameEs: 'Recursos Humanos',
    nameEn: 'Human Resources',
    description: 'Reclutamiento, gestión de talento, desarrollo organizacional',
    icon: '👥',
    active: true,
    order: 41
  },
  {
    name: 'data-analytics',
    nameEs: 'Data Analytics',
    nameEn: 'Data Analytics',
    description: 'Business intelligence, análisis de datos, reporting',
    icon: '📊',
    active: true,
    order: 42
  },
  // Industriales
  {
    name: 'robotics',
    nameEs: 'Robótica',
    nameEn: 'Robotics',
    description: 'Robótica industrial, automatización, AI física',
    icon: '🤖',
    active: true,
    order: 43
  },
  {
    name: 'logistics',
    nameEs: 'Logística',
    nameEn: 'Logistics',
    description: 'Supply chain, distribución, transporte y almacenamiento',
    icon: '🚚',
    active: true,
    order: 44
  },
  // Entretenimiento
  {
    name: 'media',
    nameEs: 'Medios de Comunicación',
    nameEn: 'Media',
    description: 'Periodismo, producción audiovisual, broadcasting',
    icon: '📺',
    active: true,
    order: 45
  },
  {
    name: 'music',
    nameEs: 'Música',
    nameEn: 'Music',
    description: 'Producción musical, industria discográfica, streaming',
    icon: '🎵',
    active: true,
    order: 46
  },
  {
    name: 'art-culture',
    nameEs: 'Arte y Cultura',
    nameEn: 'Art & Culture',
    description: 'Galerías, museos, producción cultural, gestión artística',
    icon: '🎭',
    active: true,
    order: 47
  }
];

async function addSectors() {
  console.log('🏢 Agregando nuevos sectores profesionales...\n');

  let added = 0;
  let skipped = 0;

  for (const sector of newSectors) {
    try {
      const existing = await prisma.sector.findUnique({
        where: { name: sector.name }
      });

      if (existing) {
        console.log(`⏭️  ${sector.nameEs} - Ya existe, omitiendo`);
        skipped++;
      } else {
        await prisma.sector.create({ data: sector });
        console.log(`✅ ${sector.icon} ${sector.nameEs} - Agregado`);
        added++;
      }
    } catch (error) {
      console.error(`❌ Error agregando ${sector.nameEs}:`, error.message);
    }
  }

  const totalSectors = await prisma.sector.count();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SECTORES AGREGADOS EXITOSAMENTE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📊 RESUMEN:');
  console.log(`   • Sectores agregados: ${added}`);
  console.log(`   • Sectores omitidos: ${skipped}`);
  console.log(`   • Total de sectores en DB: ${totalSectors}\n`);

  console.log('🎯 Nuevos sectores disponibles:');
  const latestSectors = await prisma.sector.findMany({
    where: { order: { gte: 31 } },
    orderBy: { order: 'asc' }
  });
  
  latestSectors.forEach(s => {
    console.log(`   ${s.icon} ${s.nameEs}`);
  });
  console.log('');
}

addSectors()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
