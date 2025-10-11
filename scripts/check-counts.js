import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkCounts() {
  const users = await prisma.user.count();
  const companies = await prisma.company.count();
  const teams = await prisma.team.count();
  const projects = await prisma.project.count();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 TOTALES EN BASE DE DATOS LOCAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👥 Usuarios: ${users} (17 prod + 13 test = 30)`);
  console.log(`🏢 Empresas: ${companies} (11 prod + 1 test = 12)`);
  console.log(`👨‍👩‍👧‍👦 Equipos: ${teams} (7 prod + 3 test = 10)`);
  console.log(`📋 Proyectos: ${projects} (12 prod + 5 test = 17)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  await prisma.$disconnect();
}

checkCounts();
