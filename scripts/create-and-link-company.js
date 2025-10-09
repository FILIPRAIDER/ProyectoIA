import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAndLinkCompany() {
  try {
    const userId = 'cmgiw6p640004mazji8kolds4';
    const userEmail = 'crunchyroll01022022@gmail.com';
    
    console.log('\n🔧 Creando empresa y vinculando a usuario...\n');
    
    // 1. Crear empresa "Mi Empresa"
    const company = await prisma.company.create({
      data: {
        name: 'Mi Empresa',
        sector: 'Salud',
        city: 'Bogotá',
        about: 'Empresa del sector salud',
      }
    });
    
    console.log('✅ Empresa creada:');
    console.log(JSON.stringify(company, null, 2));
    
    // 2. Vincular al usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { companyId: company.id }
    });
    
    console.log(`\n✅ Usuario actualizado - companyId: ${updatedUser.companyId}`);
    
    // 3. Verificar vinculación
    const userWithCompany = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });
    
    console.log('\n📊 Verificación final:');
    console.log(JSON.stringify({
      userId: userWithCompany.id,
      email: userWithCompany.email,
      companyId: userWithCompany.companyId,
      company: userWithCompany.company
    }, null, 2));
    
    console.log('\n🎉 ¡Listo! El usuario ahora tiene empresa vinculada.');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Ir a: https://cresia-app.vercel.app/dashboard/empresario/profile');
    console.log('2. Refrescar la página');
    console.log('3. Verificar que se muestran los datos de "Mi Empresa"');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAndLinkCompany();
