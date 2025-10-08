// Script para verificar qué tablas existen en la base de datos
import { prisma } from '../src/lib/prisma.js';

async function checkTables() {
  try {
    console.log('🔍 Verificando tablas en la base de datos...\n');

    // Listar todas las tablas
    const tables = await prisma.$queryRawUnsafe(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('📋 Tablas encontradas:');
    console.table(tables);

    console.log(`\n✅ Total de tablas: ${tables.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
