#!/usr/bin/env node

/**
 * 🔍 Script para verificar la conexión a la base de datos
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function checkConnection() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VERIFICANDO CONEXIÓN A LA BASE DE DATOS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Mostrar URL de conexión (sin contraseña)
  const dbUrl = process.env.DATABASE_URL || 'NO DEFINIDA';
  const safeUrl = dbUrl.replace(/:[^:@]*@/, ':***@');
  console.log(`📡 URL de conexión: ${safeUrl}\n`);

  try {
    // Intentar una consulta simple
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const endTime = Date.now();
    
    console.log('✅ CONEXIÓN EXITOSA');
    console.log(`⏱️  Tiempo de respuesta: ${endTime - startTime}ms\n`);

    // Obtener información de la base de datos
    const userCount = await prisma.user.count();
    const companyCount = await prisma.company.count();
    const teamCount = await prisma.team.count();
    const projectCount = await prisma.project.count();
    const skillCount = await prisma.skill.count();

    console.log('📊 ESTADÍSTICAS:');
    console.log(`   👥 Usuarios: ${userCount}`);
    console.log(`   🏢 Empresas: ${companyCount}`);
    console.log(`   👨‍👩‍👧‍👦 Equipos: ${teamCount}`);
    console.log(`   📋 Proyectos: ${projectCount}`);
    console.log(`   💡 Skills: ${skillCount}`);
    console.log('');

    // Detectar si es local o producción
    const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    const environment = isLocal ? '🏠 LOCAL (Docker)' : '☁️ PRODUCCIÓN (Neon)';
    console.log(`🌍 Entorno: ${environment}\n`);

    // Mostrar credenciales de prueba si es local
    if (isLocal) {
      console.log('🔐 CREDENCIALES DE PRUEBA DISPONIBLES:');
      console.log('   Email: empresario@test.com');
      console.log('   Password: Test123!');
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TODO OK - Puedes usar el backend');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ ERROR DE CONEXIÓN\n');
    console.error('Detalles del error:');
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error(`   Mensaje: ${error.message}`);
    console.error('');

    // Sugerencias según el tipo de error
    if (error.message.includes('TLS') || error.message.includes('SSL')) {
      console.error('💡 SOLUCIÓN SUGERIDA:');
      console.error('   Este error ocurre cuando intentas conectarte a una base de datos');
      console.error('   local (Docker) con SSL habilitado.');
      console.error('');
      console.error('   Verifica que src/env.js tenga la función ensureSSL() actualizada');
      console.error('   para NO agregar SSL a conexiones localhost.');
      console.error('');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 SOLUCIÓN SUGERIDA:');
      console.error('   La base de datos no está corriendo. Inicia Docker:');
      console.error('   docker-compose up -d postgres');
      console.error('');
    } else if (error.message.includes('password authentication failed')) {
      console.error('💡 SOLUCIÓN SUGERIDA:');
      console.error('   Usuario o contraseña incorrectos en DATABASE_URL');
      console.error('   Verifica tu archivo .env');
      console.error('');
    }

    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();
