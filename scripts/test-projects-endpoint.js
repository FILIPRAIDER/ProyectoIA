import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testProjectsEndpoint() {
  try {
    const companyId = 'cmgiy2gdz0000e8md6plp9rgl'; // Mi Empresa
    
    console.log('\n🧪 Probando GET /projects?companyId=...\n');
    
    // Simular el endpoint exacto
    const page = 1;
    const limit = 10;
    const sortBy = 'createdAt';
    const sortDir = 'desc';
    const includeDescription = false;
    
    const where = {
      companyId: companyId
    };
    
    const take = Number(limit);
    const skip = (Number(page) - 1) * take;
    
    console.log('📊 Query parameters:');
    console.log(JSON.stringify({
      where,
      orderBy: [{ [sortBy]: sortDir }],
      skip,
      take
    }, null, 2));
    
    const baseSelect = {
      id: true,
      title: true,
      status: true,
      city: true,
      area: true,
      company: { select: { id: true, name: true } },
      _count: { select: { assignments: true } },
    };
    
    const [rows, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: [{ [sortBy]: sortDir }],
        skip,
        take,
        select: baseSelect,
      }),
      prisma.project.count({ where }),
    ]);
    
    const totalPages = Math.max(1, Math.ceil(total / take));
    const meta = {
      page: Number(page),
      limit: take,
      total,
      totalPages,
      hasPrev: Number(page) > 1,
      hasNext: Number(page) < totalPages,
      sortBy,
      sortDir,
      includeDescription,
    };
    
    console.log('\n✅ Response (200 OK):\n');
    console.log(JSON.stringify({ data: rows, meta }, null, 2));
    
    if (rows.length === 0) {
      console.log('\n⚠️ No hay proyectos para esta empresa aún.');
      console.log('   Esto es normal si la empresa es nueva.');
    } else {
      console.log(`\n✅ Encontrados ${rows.length} proyecto(s) para la empresa`);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProjectsEndpoint();
