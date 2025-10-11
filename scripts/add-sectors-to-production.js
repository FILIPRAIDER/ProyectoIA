#!/usr/bin/env node

/**
 * 🌍 Script para agregar los nuevos sectores a la BASE DE DATOS DE PRODUCCIÓN (Neon)
 * 
 * ⚠️ IMPORTANTE: Este script modificará la base de datos de PRODUCCIÓN
 * 
 * Sectores a agregar: 17 nuevos sectores profesionales
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

// Obtener la URL de producción desde las variables de entorno
const PRODUCTION_DB_URL = process.env.PRODUCTION_DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!PRODUCTION_DB_URL) {
  console.error('\n❌ ERROR: No se encontró la URL de la base de datos de producción');
  console.error('Por favor, define PRODUCTION_DATABASE_URL en tu .env con la URL de Neon\n');
  process.exit(1);
}

// ⚠️ CONEXIÓN DIRECTA A PRODUCCIÓN
const prismaProduction = new PrismaClient({
  datasources: {
    db: {
      url: PRODUCTION_DB_URL
    }
  }
});

const newSectors = [
  // Tecnología
  { name: 'Inteligencia Artificial', icon: '🤖', description: 'Desarrollo de sistemas de IA, ML y automatización inteligente', order: 31 },
  { name: 'Blockchain y Web3', icon: '⛓️', description: 'Desarrollo de aplicaciones descentralizadas y criptomonedas', order: 32 },
  { name: 'Cloud Computing', icon: '☁️', description: 'Arquitectura e infraestructura en la nube', order: 33 },
  { name: 'Ciberseguridad', icon: '🔒', description: 'Seguridad informática y protección de datos', order: 34 },
  
  // Creativos
  { name: 'Diseño UX/UI', icon: '🎨', description: 'Diseño de experiencia e interfaces de usuario', order: 35 },
  { name: 'Contenido Digital', icon: '📱', description: 'Creación de contenido multimedia para plataformas digitales', order: 36 },
  { name: 'Publicidad Digital', icon: '📢', description: 'Marketing digital y campañas publicitarias online', order: 37 },
  
  // Científicos
  { name: 'Biotecnología', icon: '🧬', description: 'Investigación y desarrollo en biotecnología', order: 38 },
  { name: 'Farmacéutica', icon: '💊', description: 'Desarrollo farmacéutico y medicamentos', order: 39 },
  { name: 'Medio Ambiente', icon: '🌱', description: 'Sostenibilidad y proyectos ambientales', order: 40 },
  
  // Empresariales
  { name: 'Recursos Humanos', icon: '👥', description: 'Gestión de talento humano y desarrollo organizacional', order: 41 },
  { name: 'Data Analytics', icon: '📊', description: 'Análisis de datos y business intelligence', order: 42 },
  
  // Industriales
  { name: 'Robótica', icon: '🤖', description: 'Diseño y programación de robots y sistemas automatizados', order: 43 },
  { name: 'Logística', icon: '🚚', description: 'Gestión de cadena de suministro y distribución', order: 44 },
  
  // Entretenimiento
  { name: 'Medios de Comunicación', icon: '📺', description: 'Producción audiovisual y periodismo digital', order: 45 },
  { name: 'Música', icon: '🎵', description: 'Producción musical y gestión de eventos', order: 46 },
  { name: 'Arte y Cultura', icon: '🎭', description: 'Proyectos artísticos y gestión cultural', order: 47 }
];

async function addSectorsToProduction() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  AGREGANDO SECTORES A BASE DE DATOS DE PRODUCCIÓN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('🌍 Conectado a: Neon PostgreSQL (PRODUCCIÓN)');
  console.log('📋 Sectores a agregar: 17\n');

  // Confirmar antes de proceder
  console.log('⏳ Verificando sectores existentes en producción...\n');

  const existingSectors = await prismaProduction.sector.findMany();
  console.log(`📊 Sectores actuales en producción: ${existingSectors.count || existingSectors.length}\n`);

  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const sector of newSectors) {
    try {
      // Verificar si ya existe
      const existing = await prismaProduction.sector.findFirst({
        where: { name: sector.name }
      });

      if (existing) {
        console.log(`⏭️  ${sector.icon} ${sector.name} - Ya existe, omitiendo`);
        skipped++;
        continue;
      }

      // Crear el nuevo sector
      await prismaProduction.sector.create({
        data: {
          name: sector.name,
          nameEs: sector.name, // Mantener mismo nombre en español
          nameEn: sector.name, // Puedes traducir si quieres
          description: sector.description,
          icon: sector.icon,
          active: true,
          order: sector.order
        }
      });

      console.log(`✅ ${sector.icon} ${sector.name} - Agregado`);
      added++;
    } catch (error) {
      console.error(`❌ ${sector.icon} ${sector.name} - Error:`, error.message);
      errors++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMEN DE OPERACIÓN EN PRODUCCIÓN:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   ✅ Sectores agregados: ${added}`);
  console.log(`   ⏭️  Sectores omitidos (ya existían): ${skipped}`);
  console.log(`   ❌ Errores: ${errors}`);
  
  const totalSectors = await prismaProduction.sector.count();
  console.log(`   📊 Total de sectores en producción: ${totalSectors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (added > 0) {
    console.log('✅ Los nuevos sectores ya están disponibles en PRODUCCIÓN');
    console.log('🌐 Los usuarios ya pueden verlos en el frontend\n');
  } else if (skipped === newSectors.length) {
    console.log('ℹ️  Todos los sectores ya existían en producción\n');
  }

  await prismaProduction.$disconnect();
}

// Ejecutar
console.log('\n⚠️  ADVERTENCIA: Este script modificará la base de datos de PRODUCCIÓN (Neon)');
console.log('⏳ Iniciando en 3 segundos... (Ctrl+C para cancelar)\n');

setTimeout(() => {
  addSectorsToProduction()
    .catch((error) => {
      console.error('\n❌ Error fatal:', error);
      process.exit(1);
    });
}, 3000);
