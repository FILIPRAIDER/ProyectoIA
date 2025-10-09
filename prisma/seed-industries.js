/**
 * Seed de Industrias y Keywords para detección automática
 * 
 * Crea 10 industrias con sus keywords asociadas para que la IA
 * pueda detectar automáticamente la industria del proyecto
 * 
 * USO:
 * node prisma/seed-industries.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INDUSTRIES = [
  {
    name: 'E-commerce y Retail',
    nameEn: 'E-commerce & Retail',
    description: 'Tiendas online, venta de productos por internet, comercio electrónico',
    icon: '🛒',
    displayOrder: 1,
    keywords: [
      { keyword: 'ecommerce', priority: 3 },
      { keyword: 'e-commerce', priority: 3 },
      { keyword: 'tienda online', priority: 3 },
      { keyword: 'tienda en linea', priority: 3 },
      { keyword: 'tienda en línea', priority: 3 },
      { keyword: 'tienda virtual', priority: 2 },
      { keyword: 'venta online', priority: 2 },
      { keyword: 'ventas online', priority: 2 },
      { keyword: 'comercio electronico', priority: 2 },
      { keyword: 'comercio electrónico', priority: 2 },
      { keyword: 'marketplace', priority: 3 },
      { keyword: 'retail', priority: 2 },
      { keyword: 'ventas', priority: 1 },
      { keyword: 'vender', priority: 1 },
      { keyword: 'mercado', priority: 1 },
      { keyword: 'tienda', priority: 1 }
    ]
  },
  {
    name: 'Moda y Textil',
    nameEn: 'Fashion & Textile',
    description: 'Ropa, accesorios, moda, textiles',
    icon: '👗',
    displayOrder: 2,
    keywords: [
      { keyword: 'moda', priority: 3 },
      { keyword: 'fashion', priority: 3 },
      { keyword: 'ropa', priority: 2 },
      { keyword: 'vestidos', priority: 2 },
      { keyword: 'textil', priority: 2 },
      { keyword: 'ropa deportiva', priority: 2 },
      { keyword: 'accesorios', priority: 1 },
      { keyword: 'zapatos', priority: 1 },
      { keyword: 'calzado', priority: 1 }
    ]
  },
  {
    name: 'Alimentos y Restaurantes',
    nameEn: 'Food & Restaurants',
    description: 'Comida, restaurantes, delivery, gastronomía',
    icon: '🍔',
    displayOrder: 3,
    keywords: [
      { keyword: 'restaurante', priority: 3 },
      { keyword: 'comida', priority: 2 },
      { keyword: 'alimentos', priority: 2 },
      { keyword: 'food', priority: 2 },
      { keyword: 'delivery comida', priority: 3 },
      { keyword: 'gastronomia', priority: 2 },
      { keyword: 'gastronomía', priority: 2 },
      { keyword: 'plantas', priority: 1 },
      { keyword: 'flores', priority: 1 },
      { keyword: 'cafeteria', priority: 2 },
      { keyword: 'cafetería', priority: 2 },
      { keyword: 'bar', priority: 1 },
      { keyword: 'cocina', priority: 1 }
    ]
  },
  {
    name: 'Salud',
    nameEn: 'Healthcare',
    description: 'Servicios médicos, hospitales, clínicas',
    icon: '⚕️',
    displayOrder: 4,
    keywords: [
      { keyword: 'salud', priority: 3 },
      { keyword: 'médico', priority: 3 },
      { keyword: 'medico', priority: 3 },
      { keyword: 'hospital', priority: 3 },
      { keyword: 'clínica', priority: 3 },
      { keyword: 'clinica', priority: 3 },
      { keyword: 'medicina', priority: 2 },
      { keyword: 'farmacia', priority: 2 },
      { keyword: 'doctor', priority: 2 },
      { keyword: 'enfermera', priority: 1 },
      { keyword: 'paciente', priority: 1 }
    ]
  },
  {
    name: 'Educación',
    nameEn: 'Education',
    description: 'Educación, cursos, formación, capacitación',
    icon: '📚',
    displayOrder: 5,
    keywords: [
      { keyword: 'educación', priority: 3 },
      { keyword: 'educacion', priority: 3 },
      { keyword: 'escuela', priority: 3 },
      { keyword: 'universidad', priority: 3 },
      { keyword: 'curso', priority: 3 },
      { keyword: 'cursos', priority: 3 },
      { keyword: 'plataforma educativa', priority: 3 },
      { keyword: 'formación', priority: 2 },
      { keyword: 'formacion', priority: 2 },
      { keyword: 'capacitación', priority: 2 },
      { keyword: 'capacitacion', priority: 2 },
      { keyword: 'academia', priority: 2 },
      { keyword: 'online', priority: 1 },
      { keyword: 'estudiante', priority: 1 },
      { keyword: 'profesor', priority: 1 },
      { keyword: 'aprendizaje', priority: 1 }
    ]
  },
  {
    name: 'Tecnología',
    nameEn: 'Technology',
    description: 'Software, desarrollo, IT, tecnología',
    icon: '💻',
    displayOrder: 6,
    keywords: [
      { keyword: 'tecnología', priority: 3 },
      { keyword: 'tecnologia', priority: 3 },
      { keyword: 'software', priority: 3 },
      { keyword: 'tech', priority: 3 },
      { keyword: 'desarrollo', priority: 2 },
      { keyword: 'programación', priority: 2 },
      { keyword: 'programacion', priority: 2 },
      { keyword: 'IT', priority: 2 },
      { keyword: 'app', priority: 1 },
      { keyword: 'digital', priority: 1 }
    ]
  },
  {
    name: 'Inmobiliaria',
    nameEn: 'Real Estate',
    description: 'Propiedades, bienes raíces, inmuebles',
    icon: '🏠',
    displayOrder: 7,
    keywords: [
      { keyword: 'inmobiliaria', priority: 3 },
      { keyword: 'bienes raíces', priority: 3 },
      { keyword: 'bienes raices', priority: 3 },
      { keyword: 'propiedades', priority: 2 },
      { keyword: 'apartamento', priority: 2 },
      { keyword: 'casa', priority: 1 },
      { keyword: 'arriendo', priority: 2 },
      { keyword: 'alquiler', priority: 2 },
      { keyword: 'vivienda', priority: 1 }
    ]
  },
  {
    name: 'Finanzas',
    nameEn: 'Finance',
    description: 'Servicios financieros, bancos, inversiones',
    icon: '💰',
    displayOrder: 8,
    keywords: [
      { keyword: 'finanzas', priority: 3 },
      { keyword: 'banco', priority: 3 },
      { keyword: 'financiero', priority: 2 },
      { keyword: 'prestamos', priority: 2 },
      { keyword: 'préstamos', priority: 2 },
      { keyword: 'inversión', priority: 2 },
      { keyword: 'inversion', priority: 2 },
      { keyword: 'crédito', priority: 2 },
      { keyword: 'credito', priority: 2 },
      { keyword: 'dinero', priority: 1 }
    ]
  },
  {
    name: 'Servicios',
    nameEn: 'Services',
    description: 'Consultoría, asesoría, servicios profesionales',
    icon: '🤝',
    displayOrder: 9,
    keywords: [
      { keyword: 'servicios', priority: 2 },
      { keyword: 'consultoría', priority: 3 },
      { keyword: 'consultoria', priority: 3 },
      { keyword: 'asesoría', priority: 3 },
      { keyword: 'asesoria', priority: 3 },
      { keyword: 'legal', priority: 2 },
      { keyword: 'contable', priority: 2 },
      { keyword: 'abogado', priority: 2 },
      { keyword: 'contador', priority: 2 }
    ]
  },
  {
    name: 'Entretenimiento y Turismo',
    nameEn: 'Entertainment & Tourism',
    description: 'Eventos, turismo, viajes, entretenimiento',
    icon: '🎭',
    displayOrder: 10,
    keywords: [
      { keyword: 'entretenimiento', priority: 3 },
      { keyword: 'turismo', priority: 3 },
      { keyword: 'eventos', priority: 2 },
      { keyword: 'viajes', priority: 2 },
      { keyword: 'hotel', priority: 2 },
      { keyword: 'cine', priority: 2 },
      { keyword: 'música', priority: 2 },
      { keyword: 'musica', priority: 2 },
      { keyword: 'concierto', priority: 2 },
      { keyword: 'teatro', priority: 2 }
    ]
  }
];

async function seedIndustries() {
  console.log('🌱 Iniciando seed de industrias y keywords...\n');

  try {
    let totalKeywords = 0;

    for (const industryData of INDUSTRIES) {
      const { keywords, ...industryInfo } = industryData;

      // Crear o actualizar industria
      const industry = await prisma.industry.upsert({
        where: { name: industryInfo.name },
        update: industryInfo,
        create: industryInfo
      });

      console.log(`✅ Industria: ${industry.name} (${industry.icon})`);

      // Agregar keywords
      for (const kw of keywords) {
        await prisma.industryKeyword.upsert({
          where: {
            industryId_keyword_language: {
              industryId: industry.id,
              keyword: kw.keyword,
              language: kw.language || 'es'
            }
          },
          update: {
            priority: kw.priority
          },
          create: {
            industryId: industry.id,
            keyword: kw.keyword,
            priority: kw.priority,
            language: kw.language || 'es'
          }
        });
        totalKeywords++;
      }

      console.log(`   📝 ${keywords.length} keywords agregadas`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 SEED DE INDUSTRIAS COMPLETADO EXITOSAMENTE!');
    console.log('='.repeat(70));
    console.log(`\n📊 Estadísticas:`);
    console.log(`   - Total industrias: ${INDUSTRIES.length}`);
    console.log(`   - Total keywords: ${totalKeywords}`);
    console.log(`   - Promedio keywords por industria: ${Math.round(totalKeywords / INDUSTRIES.length)}`);
    
    console.log('\n🔗 Endpoints disponibles:');
    console.log('   GET  /industries');
    console.log('   GET  /industries/keywords');
    console.log('   POST /industries/detect');
    
    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error durante el seed de industrias:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar seed
seedIndustries()
  .then(() => {
    console.log('✅ Proceso completado exitosamente\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
