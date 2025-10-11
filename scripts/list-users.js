import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👥 USUARIOS EN BASE DE DATOS LOCAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      company: {
        select: {
          name: true
        }
      }
    },
    orderBy: [
      { role: 'asc' },
      { email: 'asc' }
    ]
  });

  const testUsers = users.filter(u => u.email.includes('@test.com'));
  const prodUsers = users.filter(u => !u.email.includes('@test.com'));

  console.log('🧪 USUARIOS DE PRUEBA (Contraseña: Test123!):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  testUsers.forEach(user => {
    console.log(`📧 ${user.email}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Rol: ${user.role}`);
    if (user.company) {
      console.log(`   Empresa: ${user.company.name}`);
    }
    console.log('');
  });

  console.log('\n📊 USUARIOS DE PRODUCCIÓN:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  prodUsers.forEach(user => {
    console.log(`📧 ${user.email}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Rol: ${user.role}`);
    if (user.company) {
      console.log(`   Empresa: ${user.company.name}`);
    }
    console.log('');
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 TOTAL: ${users.length} usuarios (${testUsers.length} prueba + ${prodUsers.length} producción)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
}

listUsers();
