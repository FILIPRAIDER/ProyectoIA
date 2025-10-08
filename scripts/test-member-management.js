/**
 * Script para probar endpoints de gestión de miembros
 * Prueba expulsar miembros y cambiar roles
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 TESTING - Gestión de Miembros de Equipo\n");

  // 1. Buscar un equipo existente
  const team = await prisma.team.findFirst({
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { role: "asc" },
      },
    },
  });

  if (!team) {
    console.log("❌ No hay equipos en la base de datos");
    return;
  }

  console.log(`📋 Equipo: ${team.name} (${team.id})`);
  console.log(`👥 Miembros actuales: ${team.members.length}\n`);

  team.members.forEach((member, idx) => {
    console.log(
      `  ${idx + 1}. ${member.user.name} (${member.user.email}) - ${member.role}`
    );
  });

  const leader = team.members.find((m) => m.role === "LIDER");
  const member = team.members.find((m) => m.role === "MIEMBRO");

  if (!leader) {
    console.log("\n❌ El equipo no tiene líder");
    return;
  }

  console.log(`\n✅ Líder identificado: ${leader.user.name}`);

  // 2. Probar validaciones
  console.log("\n" + "=".repeat(60));
  console.log("🧪 TEST 1: Intentar expulsar a un miembro que no existe");
  console.log("=".repeat(60));

  console.log(
    `DELETE /teams/${team.id}/members/user_fake_id { byUserId: "${leader.userId}" }`
  );
  console.log("Respuesta esperada: 404 - Usuario no es miembro del equipo\n");

  // 3. Intentar expulsarse a sí mismo
  console.log("=".repeat(60));
  console.log("🧪 TEST 2: Líder intenta expulsarse a sí mismo");
  console.log("=".repeat(60));

  console.log(
    `DELETE /teams/${team.id}/members/${leader.userId} { byUserId: "${leader.userId}" }`
  );
  console.log("Respuesta esperada: 400 - No puedes expulsarte a ti mismo\n");

  // 4. Intentar cambiar su propio rol
  console.log("=".repeat(60));
  console.log("🧪 TEST 3: Líder intenta cambiar su propio rol");
  console.log("=".repeat(60));

  console.log(
    `PATCH /teams/${team.id}/members/${leader.userId}/role { role: "MIEMBRO", byUserId: "${leader.userId}" }`
  );
  console.log("Respuesta esperada: 400 - No puedes cambiar tu propio rol\n");

  // 5. Si hay un MIEMBRO, mostrar cómo cambiar su rol
  if (member) {
    console.log("=".repeat(60));
    console.log("🧪 TEST 4: Líder cambia rol de MIEMBRO a LIDER");
    console.log("=".repeat(60));

    console.log(`Miembro actual: ${member.user.name} (${member.role})`);
    console.log(
      `PATCH /teams/${team.id}/members/${member.userId}/role { role: "LIDER", byUserId: "${leader.userId}" }`
    );
    console.log("Respuesta esperada: 200 - Rol actualizado correctamente\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST 5: Ahora hay 2 líderes, se puede cambiar uno a MIEMBRO");
    console.log("=".repeat(60));

    console.log(
      `PATCH /teams/${team.id}/members/${member.userId}/role { role: "MIEMBRO", byUserId: "${leader.userId}" }`
    );
    console.log("Respuesta esperada: 200 - Rol actualizado correctamente\n");
  }

  // 6. Probar expulsar si hay más de 1 líder
  if (team.members.filter((m) => m.role === "LIDER").length > 1) {
    console.log("=".repeat(60));
    console.log("🧪 TEST 6: Expulsar un líder cuando hay más de uno");
    console.log("=".repeat(60));

    const secondLeader = team.members.filter((m) => m.role === "LIDER")[1];
    console.log(
      `DELETE /teams/${team.id}/members/${secondLeader.userId} { byUserId: "${leader.userId}" }`
    );
    console.log("Respuesta esperada: 200 - Miembro expulsado correctamente\n");
  }

  // 7. Intentar expulsar al último líder
  console.log("=".repeat(60));
  console.log("🧪 TEST 7: Intentar expulsar al último líder");
  console.log("=".repeat(60));

  console.log(
    `DELETE /teams/${team.id}/members/${leader.userId} { byUserId: "${leader.userId}" }`
  );
  console.log(
    "Respuesta esperada: 400 - Debe haber al menos un líder en el equipo\n"
  );

  // 8. Mostrar endpoints de Thunder Client / Postman
  console.log("\n" + "=".repeat(60));
  console.log("📡 ENDPOINTS PARA THUNDER CLIENT / POSTMAN");
  console.log("=".repeat(60) + "\n");

  console.log("1️⃣ EXPULSAR MIEMBRO");
  console.log(`DELETE http://localhost:4001/teams/${team.id}/members/:userId`);
  console.log("Body (JSON):");
  console.log(
    JSON.stringify(
      {
        byUserId: leader.userId,
      },
      null,
      2
    )
  );

  console.log("\n2️⃣ CAMBIAR ROL");
  console.log(
    `PATCH http://localhost:4001/teams/${team.id}/members/:userId/role`
  );
  console.log("Body (JSON):");
  console.log(
    JSON.stringify(
      {
        role: "LIDER", // o "MIEMBRO"
        byUserId: leader.userId,
      },
      null,
      2
    )
  );

  console.log("\n" + "=".repeat(60));
  console.log("✅ Tests de gestión de miembros completados");
  console.log("=".repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
