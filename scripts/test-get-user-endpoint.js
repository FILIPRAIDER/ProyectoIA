import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testGetUser() {
  try {
    const userId = 'cmgiw6p640004mazji8kolds4';
    
    console.log('\n🧪 Probando GET /users/:id (simulación)...\n');
    
    // Simular lo que hace el endpoint
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            sector: true
          }
        },
        experiences: {
          orderBy: { startDate: 'desc' }
        },
        certifications: {
          orderBy: { issueDate: 'desc' }
        },
        skills: { 
          include: { skill: true },
          orderBy: { level: 'desc' }
        },
        teamMemberships: { include: { team: true } },
        company: true, // ✅ Incluir empresa
      },
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    // Remover passwordHash (como hace el endpoint)
    const { passwordHash, ...userWithoutPassword } = user;

    console.log('✅ Respuesta del endpoint:\n');
    console.log(JSON.stringify({
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      name: userWithoutPassword.name,
      role: userWithoutPassword.role,
      companyId: userWithoutPassword.companyId, // ← CRÍTICO
      company: userWithoutPassword.company,      // ← CRÍTICO
      profile: userWithoutPassword.profile
    }, null, 2));

    // Verificación
    if (userWithoutPassword.companyId && userWithoutPassword.company) {
      console.log('\n✅ CORRECTO: Usuario tiene companyId y company');
      console.log(`   - companyId: ${userWithoutPassword.companyId}`);
      console.log(`   - company.name: ${userWithoutPassword.company.name}`);
      console.log('\n🎉 El frontend ahora podrá mostrar los datos de la empresa');
    } else {
      console.log('\n❌ ERROR: Faltan companyId o company');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGetUser();
