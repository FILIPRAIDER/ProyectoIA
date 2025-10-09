import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    // 1. Verificar usuario
    const user = await prisma.user.findUnique({
      where: { email: 'crunchyroll01022022@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
      }
    });

    console.log('\n📊 Usuario encontrado:');
    console.log(JSON.stringify(user, null, 2));

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    // 2. Verificar si tiene companyId
    if (!user.companyId) {
      console.log('\n⚠️ Usuario NO tiene companyId vinculado');
      
      // 3. Buscar si hay empresa con nombre "Mi Empresa"
      const company = await prisma.company.findFirst({
        where: { name: { contains: 'Mi Empresa', mode: 'insensitive' } }
      });

      if (company) {
        console.log('\n✅ Empresa encontrada:', JSON.stringify(company, null, 2));
        console.log('\n🔧 Necesita vincularse al usuario');
        
        // Vincular
        await prisma.user.update({
          where: { id: user.id },
          data: { companyId: company.id }
        });
        
        console.log(`\n✅ Usuario vinculado a empresa "${company.name}"`);
      } else {
        console.log('\n❌ No se encontró empresa "Mi Empresa"');
        console.log('Lista de empresas:');
        const allCompanies = await prisma.company.findMany({
          select: { id: true, name: true, sector: true }
        });
        console.log(JSON.stringify(allCompanies, null, 2));
      }
    } else {
      console.log('\n✅ Usuario tiene companyId:', user.companyId);
      
      // Cargar datos de la empresa
      const company = await prisma.company.findUnique({
        where: { id: user.companyId }
      });
      
      console.log('\n📦 Empresa vinculada:');
      console.log(JSON.stringify(company, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
